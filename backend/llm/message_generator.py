"""LLM integration for generating final witty messages."""

import os
from typing import Optional
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
                              misleading_claims: list = None) -> str:
        """
        Generate short, witty final message.
        
        Args:
            verdict: "Healthy", "Okay", or "Unhealthy"
            score: 0-100 score
            insights: List of insights
            product_name: Product name
            misleading_claims: Any misleading claims found
        
        Returns:
            Short, witty message (1-2 sentences max)
        """
        
        # Build prompt for LLM
        prompt = self._build_prompt(verdict, score, insights, product_name, misleading_claims)
        
        try:
            if self.provider == "openai":
                return self._generate_with_openai(prompt)
            elif self.provider == "anthropic":
                return self._generate_with_anthropic(prompt)
        except Exception as e:
            # Fallback to rule-based message
            print(f"⚠️  LLM call failed: {e}. Using fallback message.")
            return self._generate_fallback_message(verdict, score, misleading_claims)
    
    def _build_prompt(self, verdict: str, score: int, insights: list,
                     product_name: str, misleading_claims: list) -> str:
        """Build the prompt for LLM."""
        
        prompt = f"""Generate a SHORT (1-2 sentences), HONEST, and slightly WITTY message for this food product analysis.

Product: {product_name}
Verdict: {verdict} (Score: {score}/100)
Key insights: {', '.join(insights[:3])}
"""
        
        if misleading_claims:
            prompt += f"\nMisleading claims found: {misleading_claims[0]['claim']}\n"
        
        prompt += """
RULES:
- Be short and punchy (1-2 sentences max)
- Be honest, not sales-y
- Add light humor if appropriate
- No emojis
- Make it sound human

Example outputs:
- "This has sugar equal to 3 teaspoons. Basically a candy bar in disguise."
- "Marketing says fruit. Ingredients say otherwise."
- "This is basically ultra-processed food."
- "Could be worse, but you're not doing yourself a favor."

Generate the message:"""
        
        return prompt
    
    def _generate_with_openai(self, prompt: str) -> str:
        """Generate message using OpenAI."""
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key)
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=100,
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            raise Exception(f"OpenAI error: {str(e)}")
    
    def _generate_with_anthropic(self, prompt: str) -> str:
        """Generate message using Anthropic."""
        try:
            from anthropic import Anthropic
            client = Anthropic(api_key=self.api_key)
            
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=100,
                messages=[
                    {"role": "user", "content": prompt}
                ],
            )
            
            return response.content[0].text.strip()
        except Exception as e:
            raise Exception(f"Anthropic error: {str(e)}")
    
    def _generate_fallback_message(self, verdict: str, score: int, misleading_claims: list) -> str:
        """Generate message without LLM."""
        
        if verdict == "Healthy":
            return "This is actually a decent choice. No major red flags here."
        elif verdict == "Okay":
            messages = [
                "Could be better, but not the worst option.",
                "Fine in moderation, but don't make it a habit.",
                "Okay-ish. Not great, not terrible.",
            ]
        else:  # Unhealthy
            messages = [
                "Yeah... this is basically junk food in disguise.",
                "Marketing is doing heavy lifting here. Ingredients tell a different story.",
                "Not gonna lie, this is ultra-processed stuff.",
            ]
        
        if misleading_claims and len(misleading_claims) > 0:
            return f"{messages[0]} (And {misleading_claims[0]['claim']} is misleading.)"
        
        import random
        return random.choice(messages)
