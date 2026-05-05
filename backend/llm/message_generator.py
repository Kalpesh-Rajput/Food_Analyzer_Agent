"""LLM integration for generating final witty messages."""

import json
import os
import urllib.error
import urllib.request
from typing import Any, Dict, Optional

try:
    from config import settings
except ModuleNotFoundError:
    from backend.config import settings


class MessageGenerator:
    """Generate final, short, witty messages using LLM."""
    
    def __init__(self, provider: str = "openai"):
        """Initialize LLM client."""
        self.provider = provider
        self.api_key = settings.OPENAI_API_KEY
    
    def generate_final_message(self,
                              verdict: str,
                              score: int,
                              insights: list,
                              product_name: str,
                              misleading_claims: list = None,
                              nutrition: Optional[Dict[str, Any]] = None,
                              ingredient_analysis: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate short, witty final message.
        
        Args:
            verdict: "Healthy", "Okay", or "Unhealthy"
            score: 0-100 score
            insights: List of insights
            product_name: Product name
            misleading_claims: Any misleading claims found
            nutrition: Parsed nutrition facts
            ingredient_analysis: Ingredient analysis details
        
        Returns:
            Short, witty message (1-2 sentences max)
        """
        
        prompt = self._build_prompt(
            verdict,
            score,
            insights,
            product_name,
            misleading_claims,
            nutrition,
            ingredient_analysis,
        )
        
        try:
            if self.provider == "openai":
                return self._generate_with_openai(prompt)
            elif self.provider == "anthropic":
                return self._generate_with_anthropic(prompt)
        except Exception as e:
            print(f"⚠️  LLM call failed: {e}. Using fallback message.")
            return self._generate_fallback_message(verdict, score, misleading_claims, nutrition, ingredient_analysis)
    
    def _build_prompt(self, verdict: str, score: int, insights: list,
                     product_name: str, misleading_claims: list,
                     nutrition: Optional[Dict[str, Any]],
                     ingredient_analysis: Optional[Dict[str, Any]]) -> str:
        """Build the prompt for LLM."""

        nutrition_summary = []
        if nutrition:
            if nutrition.get("sugar_g") is not None:
                nutrition_summary.append(f"Sugar: {nutrition['sugar_g']}g")
            if nutrition.get("energy_kcal") is not None:
                nutrition_summary.append(f"Calories: {nutrition['energy_kcal']} kcal")
            if nutrition.get("fat_g") is not None:
                nutrition_summary.append(f"Fat: {nutrition['fat_g']}g")
            if nutrition.get("saturated_fat_g") is not None:
                nutrition_summary.append(f"Sat. fat: {nutrition['saturated_fat_g']}g")
            if nutrition.get("sodium_mg") is not None:
                nutrition_summary.append(f"Sodium: {nutrition['sodium_mg']}mg")
            if nutrition.get("protein_g") is not None:
                nutrition_summary.append(f"Protein: {nutrition['protein_g']}g")
            if nutrition.get("fiber_g") is not None:
                nutrition_summary.append(f"Fiber: {nutrition['fiber_g']}g")

        additive_names = []
        allergen_names = []
        harmful_names = []
        if ingredient_analysis:
            additive_names = [item.get("name") or item.get("ingredient") for item in ingredient_analysis.get("additives", [])]
            allergen_names = [item.get("name") or item.get("ingredient") for item in ingredient_analysis.get("allergens", [])]
            harmful_names = [item.get("name") or item.get("ingredient") for item in ingredient_analysis.get("harmful", [])]

        prompt = (
            f"Generate a SHORT (1-2 sentences), honest, friendly, and slightly witty summary of this food label.\n\n"
            f"Product: {product_name}\n"
            f"Verdict: {verdict} ({score}/100)\n"
        )

        if nutrition_summary:
            prompt += "Nutrition facts: " + "; ".join(nutrition_summary) + "\n"
        if harmful_names:
            prompt += "Harmful ingredients: " + ", ".join(harmful_names) + "\n"
        if additive_names:
            prompt += "Potential additives: " + ", ".join(additive_names) + "\n"
        if allergen_names:
            prompt += "Allergens: " + ", ".join(allergen_names) + "\n"
        if insights:
            prompt += "Key insights: " + ", ".join(insights[:4]) + "\n"
        if misleading_claims:
            claims_list = [c.get('claim') or str(c) for c in misleading_claims]
            prompt += "Misleading claims: " + ", ".join(claims_list) + "\n"

        prompt += (
            "\nRULES:\n"
            "- Write as a real human friend giving a quick food label review.\n"
            "- Mention if the item is generally good or not for health.\n"
            "- If sugar is present, compare it to teaspoons or tablespoons.\n"
            "- If calories are present, compare them to running or burning off.\n"
            "- Mention if additives or suspicious chemicals are found.\n"
            "- Use a friendly, conversational tone.\n"
            "- Keep it short and positive when possible.\n"
            "- Do not invent nutrition facts.\n"
            "\nExamples:\n"
            "- \"This is tasty, but it has about 20g of sugar, which is like 5 teaspoons. Not a daily choice.\"\n"
            "- \"It looks okay, but the ingredient list has a few artificial additives, so keep it as an occasional snack.\"\n"
            "- \"Nice protein and fiber, but the sugar is still high enough that you'd need a short run to burn it off.\"\n"
            "\nGenerate one short response:\n"
        )

        return prompt
    
    def _generate_with_openai(self, prompt: str) -> str:
        """Generate message using OpenAI API directly."""
        if not self.api_key:
            raise Exception("OpenAI API key is not configured.")

        payload = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.8,
            "max_tokens": 100,
        }

        request = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                body = response.read().decode("utf-8")
                data = json.loads(body)
                return data["choices"][0]["message"]["content"].strip()
        except urllib.error.HTTPError as err:
            error_body = err.read().decode("utf-8")
            raise Exception(f"OpenAI HTTP error {err.code}: {error_body}")
        except Exception as exc:
            raise Exception(f"OpenAI request failed: {exc}")
    
    def _generate_with_anthropic(self, prompt: str) -> str:
        """Generate message using Anthropic."""
        if not self.api_key:
            raise Exception("Anthropic API key is not configured.")

        # Use direct HTTP request if the official client is unavailable.
        payload = {
            "model": "claude-3.5-sonnet",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "max_tokens_to_sample": 100,
        }
        request = urllib.request.Request(
            "https://api.anthropic.com/v1/complete",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "X-API-Key": self.api_key,
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                body = response.read().decode("utf-8")
                data = json.loads(body)
                return data["completion"].strip()
        except urllib.error.HTTPError as err:
            error_body = err.read().decode("utf-8")
            raise Exception(f"Anthropic HTTP error {err.code}: {error_body}")
        except Exception as exc:
            raise Exception(f"Anthropic request failed: {exc}")
    
    def _generate_fallback_message(self, verdict: str, score: int, misleading_claims: list,
                                   nutrition: Optional[Dict[str, Any]] = None,
                                   ingredient_analysis: Optional[Dict[str, Any]] = None) -> str:
        """Generate message without LLM."""
        
        if verdict == "Healthy":
            fallback = "This is actually a decent choice. No major red flags here."
        elif verdict == "Okay":
            fallback = "Could be better, but okay in moderation."
        else:  # Unhealthy
            fallback = "Not the healthiest choice, especially if it has added sugar or additives."

        extra = []
        if nutrition and nutrition.get("sugar_g") is not None:
            extra.append(f"It has about {nutrition['sugar_g']}g sugar.")
        if nutrition and nutrition.get("energy_kcal") is not None:
            extra.append(f"That is roughly {nutrition['energy_kcal']} calories.")
        if ingredient_analysis:
            harmful = [item.get("name") or item.get("ingredient") for item in ingredient_analysis.get("harmful", [])]
            additives = [item.get("name") or item.get("ingredient") for item in ingredient_analysis.get("additives", [])]
            if harmful:
                extra.append(f"Watch those ingredients: {', '.join(harmful)}.")
            elif additives:
                extra.append(f"It also includes additives like {', '.join(additives)}.")

        if misleading_claims and len(misleading_claims) > 0:
            extra.append(f"Also, {misleading_claims[0].get('claim', 'a claim')} looks misleading.")

        if extra:
            return f"{fallback} {' '.join(extra)}"

        return fallback
