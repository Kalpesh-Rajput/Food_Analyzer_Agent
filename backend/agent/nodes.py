"""
LangGraph node functions for the Food Analyzer agent.

Nodes:
  1. extract_food_data  — Vision + OCR: reads food label from image
  2. analyze_food       — Analysis: judges health, flags bad stuff
  3. format_response    — Formats final user-facing response

Each node receives the full FoodAgentState and returns a partial state update.
"""

import json
import os
from typing import Any

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from agent.state import FoodAgentState
from agent.prompts import (
    EXTRACTION_SYSTEM_PROMPT,
    EXTRACTION_USER_PROMPT,
    ANALYSIS_SYSTEM_PROMPT,
    ANALYSIS_USER_PROMPT,
    FORMAT_SYSTEM_PROMPT,
    FORMAT_USER_PROMPT,
)
from utils.image_utils import image_to_anthropic_block, safe_json_parse


# ─────────────────────────────────────────────────────────────────────────────
# Shared LLM clients
# ─────────────────────────────────────────────────────────────────────────────

def get_llm(provider: str = "openai", temperature: float = 0.2):
    """
    Universal LLM loader
    provider: "openai" | "anthropic"
    """

    if provider == "openai":
        return ChatOpenAI(
            model="gpt-4o-mini",
            temperature=temperature,
            api_key=os.environ.get("OPENAI_API_KEY"),
        )

    elif provider == "anthropic":
        return ChatOpenAI(
            model="gpt-4o-mini",
            temperature=temperature,
            api_key=os.environ.get("OPENAI_API_KEY"),
        )

    else:
        raise ValueError("Invalid provider")


# ─────────────────────────────────────────────────────────────────────────────
# NODE 1: extract_food_data
# ─────────────────────────────────────────────────────────────────────────────

def extract_food_data(state: FoodAgentState) -> dict[str, Any]:
    """
    Vision node: sends food packaging images to Claude Vision.
    Extracts product name, nutrition facts, and ingredients via OCR.
    
    Input state fields used:  image_paths
    Output state fields set:  raw_ocr_text, extracted_nutrition,
                               extracted_ingredients, product_name
    """
    print("\n🔍 [Node 1/3] Extracting food label data from image(s)...")

    image_paths = state.get("image_paths", [])
    if not image_paths:
        return {"error": "No images provided. Please upload at least one food label image."}

    llm = get_llm(provider="openai", temperature=0.3)

    # Build content blocks: images first, then the prompt
    content_blocks = []
    
    for path in image_paths:
        try:
            image_block = image_to_anthropic_block(path)
            content_blocks.append(image_block)
            print(f"   ✅ Loaded image: {path}")
        except ValueError as e:
            print(f"   ⚠️  Could not load {path}: {e}")
            continue

    if not content_blocks:
        return {"error": "Could not load any of the provided images."}

    # Add text prompt
    content_blocks.append({"type": "text", "text": EXTRACTION_USER_PROMPT})

    messages = [
        SystemMessage(content=EXTRACTION_SYSTEM_PROMPT),
        HumanMessage(content=content_blocks),
    ]

    try:
        response = llm.invoke(messages)
        raw_text = response.content
        print(f"   📄 Raw extraction response received ({len(raw_text)} chars)")
    except Exception as e:
        return {"error": f"Vision API call failed: {str(e)}"}

    # Parse JSON response
    parsed = safe_json_parse(raw_text)
    if not parsed:
        print(f"   ⚠️  JSON parse failed, using raw text")
        return {
            "raw_ocr_text": raw_text,
            "extracted_nutrition": None,
            "extracted_ingredients": None,
            "product_name": "Unknown Product",
            "error": None,
        }

    # Map parsed data to state fields
    nutrition_raw = parsed.get("nutrition", {})
    ingredients_raw = parsed.get("ingredients", {})

    extracted_nutrition = {
        "energy_kcal_per_100g": nutrition_raw.get("energy_kcal_per_100g"),
        "carbs_g": nutrition_raw.get("carbs_g"),
        "sugar_g": nutrition_raw.get("sugar_g"),
        "fat_g": nutrition_raw.get("fat_g"),
        "saturated_fat_g": nutrition_raw.get("saturated_fat_g"),
        "trans_fat_g": nutrition_raw.get("trans_fat_g"),
        "sodium_mg": nutrition_raw.get("sodium_mg"),
        "protein_g": nutrition_raw.get("protein_g"),
        "fiber_g": nutrition_raw.get("fiber_g"),
        "serving_size_g": parsed.get("serving_size_g"),
        "servings_per_package": parsed.get("servings_per_package"),
    }

    extracted_ingredients = {
        "raw_ingredients_text": ingredients_raw.get("raw_text", ""),
        "ingredient_list": ingredients_raw.get("ingredient_list", []),
        "additives": ingredients_raw.get("additives", []),
        "allergens": ingredients_raw.get("allergens", []),
        "preservatives": ingredients_raw.get("preservatives", []),
    }

    print(f"   ✅ Extracted: {parsed.get('product_name', 'Unknown')} | "
          f"{len(extracted_ingredients['ingredient_list'])} ingredients | "
          f"{len(extracted_ingredients['additives'])} additives")

    return {
        "raw_ocr_text": json.dumps(parsed, indent=2),
        "extracted_nutrition": extracted_nutrition,
        "extracted_ingredients": extracted_ingredients,
        "product_name": parsed.get("product_name", "Unknown Product"),
        "error": None,
    }


# ─────────────────────────────────────────────────────────────────────────────
# NODE 2: analyze_food
# ─────────────────────────────────────────────────────────────────────────────

def analyze_food(state: FoodAgentState) -> dict[str, Any]:
    print("\n🧪 [Node 2/3] Analyzing nutritional data and ingredients...")

    if state.get("error"):
        return {}

    extracted_data = {
        "product_name": state.get("product_name", "Unknown"),
        "nutrition": state.get("extracted_nutrition", {}),
        "ingredients": state.get("extracted_ingredients", {}),
    }

    llm = get_llm(provider="openai", temperature=0.3)

    messages = [
        SystemMessage(content=ANALYSIS_SYSTEM_PROMPT),
        HumanMessage(
            content=ANALYSIS_USER_PROMPT.format(
                extracted_data=json.dumps(extracted_data, indent=2)
            )
        ),
    ]

    try:
        response = llm.invoke(messages)
        raw_text = response.content
        print(f"   📊 Analysis response received ({len(raw_text)} chars)")
    except Exception as e:
        return {"error": f"Analysis API call failed: {str(e)}"}

    parsed = safe_json_parse(raw_text)
    if not parsed:
        print("   ⚠️  Could not parse analysis JSON, using defaults")
        parsed = {
            "overall_verdict": "UNKNOWN",
            "verdict_emoji": "🤔",
            "verdict_color": "yellow",
            "harmful_ingredients": [],
            "okay_ingredients": [],
            "nutrition_insights": ["Could not fully analyze this product."],
            "fun_comparisons": [],
            "buy_or_avoid": "Unable to give a confident recommendation.",
            "short_summary": "Analysis incomplete. Try uploading a clearer image.",
        }

    print(f"   ✅ Verdict: {parsed.get('verdict_emoji', '')} {parsed.get('overall_verdict', '')}")

    return {
        "food_analysis": parsed,
        "error": None,
    }


# ─────────────────────────────────────────────────────────────────────────────
# NODE 3: format_response
# ─────────────────────────────────────────────────────────────────────────────

def format_response(state: FoodAgentState) -> dict[str, Any]:
    print("\n✍️  [Node 3/3] Formatting final response...")

    if state.get("error"):
        return {
            "final_response": (
                f"❌ Something went wrong:\n{state['error']}\n\n"
                "Please try uploading a clearer image of the food label."
            )
        }

    analysis = state.get("food_analysis")
    if not analysis:
        return {
            "final_response": (
                "❌ Could not analyze this product.\n"
                "Please make sure the image clearly shows the nutrition facts and ingredients."
            )
        }

    llm = get_llm(provider="openai", temperature=0.3)

    language = state.get("language", "english")
    messages = [
        SystemMessage(content=FORMAT_SYSTEM_PROMPT),
        HumanMessage(
            content=FORMAT_USER_PROMPT.format(
                analysis_data=json.dumps(analysis, indent=2),
                product_name=state.get("product_name", "this product"),
                language=language,
            )
        ),
    ]

    try:
        response = llm.invoke(messages)
        formatted_text = response.content.strip()
        print("   ✅ Response formatted successfully")
    except Exception as e:
        formatted_text = _build_fallback_response(
            analysis, state.get("product_name", "this product")
        )

    return {"final_response": formatted_text}


def _build_fallback_response(analysis: dict, product_name: str) -> str:
    verdict = analysis.get("overall_verdict", "UNKNOWN")
    emoji = analysis.get("verdict_emoji", "🤔")

    verdict_map = {
        "HEALTHY": "🟢",
        "OKAY": "🟡",
        "UNHEALTHY": "🔴",
        "JUNK": "🔴",
    }
    color_dot = verdict_map.get(verdict, "⚪")

    lines = [
        f"{color_dot} VERDICT: {verdict} {emoji}",
        f"Product: {product_name}",
        "",
        analysis.get("short_summary", ""),
        "",
    ]

    harmful = analysis.get("harmful_ingredients", [])
    if harmful:
        lines.append("⚠️  Watch out for:")
        for item in harmful[:3]:
            lines.append(f"  • {item.get('name', '')}: {item.get('why_harmful', '')}")
        lines.append("")

    comparisons = analysis.get("fun_comparisons", [])
    if comparisons:
        lines.append("📊 By the numbers:")
        for c in comparisons[:4]:
            lines.append(f"  • {c}")
        lines.append("")

    lines.append(f"👉 {analysis.get('buy_or_avoid', '')}")

    return "\n".join(lines)

