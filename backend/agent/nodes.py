# """
# LangGraph node functions for the Food Analyzer agent.

# Nodes:
#   1. extract_food_data  — Vision + OCR: reads food label from image
#   2. analyze_food       — Analysis: judges health, flags bad stuff
#   3. format_response    — Formats final user-facing response

# Each node receives the full FoodAgentState and returns a partial state update.
# """

# import json
# import os
# from typing import Any
# from pathlib import Path

# from langchain_openai import ChatOpenAI
# from langchain_core.messages import HumanMessage, SystemMessage

# from agent.state import FoodAgentState
# from agent.prompts import (
#     EXTRACTION_SYSTEM_PROMPT,
#     EXTRACTION_USER_PROMPT,
#     ANALYSIS_SYSTEM_PROMPT,
#     ANALYSIS_USER_PROMPT,
#     FORMAT_SYSTEM_PROMPT,
#     FORMAT_USER_PROMPT,
# )
# from utils.image_utils import extract_text_from_images, detect_valid_label_images, safe_json_parse


# # ─────────────────────────────────────────────────────────────────────────────
# # Shared LLM clients
# # ─────────────────────────────────────────────────────────────────────────────

# def get_llm(provider: str = "openai", temperature: float = 0.2):
#     """
#     Universal LLM loader
#     provider: "openai" | "anthropic"
#     """

#     if provider == "openai":
#         return ChatOpenAI(
#             model="gpt-4o-mini",
#             temperature=temperature,
#             api_key=os.environ.get("OPENAI_API_KEY"),
#         )

#     elif provider == "anthropic":
#         return ChatOpenAI(
#             model="gpt-4o-mini",
#             temperature=temperature,
#             api_key=os.environ.get("OPENAI_API_KEY"),
#         )

#     else:
#         raise ValueError("Invalid provider")


# # ─────────────────────────────────────────────────────────────────────────────
# # NODE 1: extract_food_data
# # ─────────────────────────────────────────────────────────────────────────────

# def extract_food_data(state: FoodAgentState) -> dict[str, Any]:
#     """
#     OCR node: extracts text from food label images then parses the fields.
#     Input state fields used:  image_paths
#     Output state fields set:  raw_ocr_text, extracted_nutrition,
#                                extracted_ingredients, product_name
#     """
#     print("\n🔍 [Node 1/3] Extracting food label data from image(s)...")

#     image_paths = state.get("image_paths", [])
#     if not image_paths:
#         return {"error": "No images provided. Please upload at least one food label image."}

#     language = state.get("language", "english")
#     # Run per-image validation to detect label-like images.
#     try:
#         validity = detect_valid_label_images(image_paths, language=language)
#     except Exception as e:
#         return {"error": f"OCR failed: {str(e)}"}

#     valid_images = validity.get("valid", [])
#     invalid_images = validity.get("invalid", [])
#     texts_map = validity.get("texts", {})

#     if not valid_images:
#         # No usable images found - respond with a clear guardrail message and include reasons
#         reasons = ", ".join([f"{Path(i['path']).name}: {i['reason']}" for i in invalid_images])
#         return {
#             "error": f"INVALID_IMAGES: Please upload photos that clearly show the nutrition facts table, ingredient list, or product label. Reasons: {reasons}",
#             "raw_ocr_text": "\n\n".join([f"--- {Path(p).name} ---\n{texts_map.get(p, '')}" for p in texts_map]),
#         }

#     # If some images were invalid, note which ones were skipped so we can inform the user later.
#     skipped = [Path(i["path"]).name for i in invalid_images] if invalid_images else []

#     try:
#         # Run OCR on only the valid images to build the prompt
#         ocr_text = extract_text_from_images(valid_images, language=language)
#     except Exception as e:
#         return {"error": f"OCR failed: {str(e)}"}

#     print(f"   🔎 OCR extracted text from {len(image_paths)} image(s)")
#     llm = get_llm(provider="openai", temperature=0.3)

#     prompt = EXTRACTION_USER_PROMPT.replace("{ocr_text}", ocr_text)
#     messages = [
#         SystemMessage(content=EXTRACTION_SYSTEM_PROMPT),
#         HumanMessage(content=prompt),
#     ]

#     try:
#         response = llm.invoke(messages)
#         raw_text = response.content
#         print(f"   📄 Raw extraction response received ({len(raw_text)} chars)")
#     except Exception as e:
#         return {"error": f"Extraction API call failed: {str(e)}"}

#     # Parse JSON response
#     parsed = safe_json_parse(raw_text)
#     if not parsed:
#         print(f"   ⚠️  JSON parse failed, using raw text")
#         return {
#             "raw_ocr_text": raw_text,
#             "extracted_nutrition": None,
#             "extracted_ingredients": None,
#             "product_name": "Unknown Product",
#             "error": None,
#         }

#     # Map parsed data to state fields
#     nutrition_raw = parsed.get("nutrition", {})
#     ingredients_raw = parsed.get("ingredients", {})

#     extracted_nutrition = {
#         "energy_kcal_per_100g": nutrition_raw.get("energy_kcal_per_100g"),
#         "carbs_g": nutrition_raw.get("carbs_g"),
#         "sugar_g": nutrition_raw.get("sugar_g"),
#         "fat_g": nutrition_raw.get("fat_g"),
#         "saturated_fat_g": nutrition_raw.get("saturated_fat_g"),
#         "trans_fat_g": nutrition_raw.get("trans_fat_g"),
#         "sodium_mg": nutrition_raw.get("sodium_mg"),
#         "protein_g": nutrition_raw.get("protein_g"),
#         "fiber_g": nutrition_raw.get("fiber_g"),
#         "serving_size_g": parsed.get("serving_size_g"),
#         "servings_per_package": parsed.get("servings_per_package"),
#     }

#     extracted_ingredients = {
#         "raw_ingredients_text": ingredients_raw.get("raw_text", ""),
#         "ingredient_list": ingredients_raw.get("ingredient_list", []),
#         "additives": ingredients_raw.get("additives", []),
#         "allergens": ingredients_raw.get("allergens", []),
#         "preservatives": ingredients_raw.get("preservatives", []),
#     }

#     print(f"   ✅ Extracted: {parsed.get('product_name', 'Unknown')} | "
#           f"{len(extracted_ingredients['ingredient_list'])} ingredients | "
#           f"{len(extracted_ingredients['additives'])} additives")

#     return {
#         "raw_ocr_text": json.dumps(parsed, indent=2),
#         "extracted_nutrition": extracted_nutrition,
#         "extracted_ingredients": extracted_ingredients,
#         "product_name": parsed.get("product_name", "Unknown Product"),
#         "error": None,
#         "skipped_images": skipped or [],
#     }


# # ─────────────────────────────────────────────────────────────────────────────
# # NODE 2: analyze_food
# # ─────────────────────────────────────────────────────────────────────────────

# def analyze_food(state: FoodAgentState) -> dict[str, Any]:
#     print("\n🧪 [Node 2/3] Analyzing nutritional data and ingredients...")

#     if state.get("error"):
#         return {}

#     extracted_data = {
#         "product_name": state.get("product_name", "Unknown"),
#         "nutrition": state.get("extracted_nutrition", {}),
#         "ingredients": state.get("extracted_ingredients", {}),
#     }

#     llm = get_llm(provider="openai", temperature=0.3)

#     messages = [
#         SystemMessage(content=ANALYSIS_SYSTEM_PROMPT),
#         HumanMessage(
#             content=ANALYSIS_USER_PROMPT.format(
#                 extracted_data=json.dumps(extracted_data, indent=2)
#             )
#         ),
#     ]

#     try:
#         response = llm.invoke(messages)
#         raw_text = response.content
#         print(f"   📊 Analysis response received ({len(raw_text)} chars)")
#     except Exception as e:
#         return {"error": f"Analysis API call failed: {str(e)}"}

#     parsed = safe_json_parse(raw_text)
#     if not parsed:
#         print("   ⚠️  Could not parse analysis JSON, using defaults")
#         parsed = {
#             "overall_verdict": "UNKNOWN",
#             "verdict_emoji": "🤔",
#             "verdict_color": "yellow",
#             "harmful_ingredients": [],
#             "okay_ingredients": [],
#             "nutrition_insights": ["Could not fully analyze this product."],
#             "fun_comparisons": [],
#             "buy_or_avoid": "Unable to give a confident recommendation.",
#             "short_summary": "Analysis incomplete. Try uploading a clearer image.",
#         }

#     print(f"   ✅ Verdict: {parsed.get('verdict_emoji', '')} {parsed.get('overall_verdict', '')}")

#     return {
#         "food_analysis": parsed,
#         "error": None,
#     }


# # ─────────────────────────────────────────────────────────────────────────────
# # NODE 3: format_response
# # ─────────────────────────────────────────────────────────────────────────────

# def format_response(state: FoodAgentState) -> dict[str, Any]:
#     print("\n✍️  [Node 3/3] Formatting final response...")

#     if state.get("error"):
#         err = state.get("error") or "An unknown error occurred."
#         # Present a cleaner, user-friendly message when guardrails detect invalid images
#         if isinstance(err, str) and err.startswith("INVALID_IMAGES:"):
#             friendly = err.split(":", 1)[1].strip()
#             return {"final_response": f"❌ Invalid images — {friendly}"}

#         return {
#             "final_response": (
#                 f"❌ Something went wrong:\n{err}\n\n"
#                 "Please try uploading a clearer image of the food label."
#             )
#         }

#     analysis = state.get("food_analysis")
#     if not analysis:
#         return {
#             "final_response": (
#                 "❌ Could not analyze this product.\n"
#                 "Please make sure the image clearly shows the nutrition facts and ingredients."
#             )
#         }

#     llm = get_llm(provider="openai", temperature=0.3)

#     language = state.get("language", "english")
#     messages = [
#         SystemMessage(content=FORMAT_SYSTEM_PROMPT),
#         HumanMessage(
#             content=FORMAT_USER_PROMPT.format(
#                 analysis_data=json.dumps(analysis, indent=2),
#                 product_name=state.get("product_name", "this product"),
#                 language=language,
#             )
#         ),
#     ]

#     try:
#         response = llm.invoke(messages)
#         formatted_text = response.content.strip()
#         print("   ✅ Response formatted successfully")
#     except Exception as e:
#         formatted_text = _build_fallback_response(
#             analysis, state.get("product_name", "this product")
#         )

#     # If some uploaded images were skipped due to guardrails, append a short note.
#     skipped = state.get("skipped_images") or []
#     if skipped:
#         note = (
#             "\n\nNote: Some uploaded images were skipped because they didn't appear to contain label text: "
#             + ", ".join(skipped)
#             + ". If you intended those images to be analyzed, try uploading clearer photos of the nutrition facts or ingredient list."
#         )
#         formatted_text = formatted_text + note

#     return {"final_response": formatted_text}


# def _build_fallback_response(analysis: dict, product_name: str) -> str:
#     verdict = analysis.get("overall_verdict", "UNKNOWN")
#     emoji = analysis.get("verdict_emoji", "🤔")

#     verdict_map = {
#         "HEALTHY": "🟢",
#         "OKAY": "🟡",
#         "UNHEALTHY": "🔴",
#         "JUNK": "🔴",
#     }
#     color_dot = verdict_map.get(verdict, "⚪")

#     lines = [
#         f"{color_dot} VERDICT: {verdict} {emoji}",
#         f"Product: {product_name}",
#         "",
#         analysis.get("short_summary", ""),
#         "",
#     ]

#     harmful = analysis.get("harmful_ingredients", [])
#     if harmful:
#         lines.append("⚠️  Watch out for:")
#         for item in harmful[:3]:
#             lines.append(f"  • {item.get('name', '')}: {item.get('why_harmful', '')}")
#         lines.append("")

#     comparisons = analysis.get("fun_comparisons", [])
#     if comparisons:
#         lines.append("📊 By the numbers:")
#         for c in comparisons[:4]:
#             lines.append(f"  • {c}")
#         lines.append("")

#     lines.append(f"👉 {analysis.get('buy_or_avoid', '')}")

#     return "\n".join(lines)

# new code 


"""
LangGraph node functions for the Food Analyzer agent.

Nodes:
  1. extract_food_data  — Vision + OCR: reads food label from image(s)
  2. analyze_food       — Analysis: health verdict, scores, flags harmful stuff
  3. format_response    — Formats final multilingual user-facing response

Each node receives the full FoodAgentState and returns a partial state dict.

Performance notes:
  - LLM clients are module-level singletons (one instance per provider/model).
  - All LLM calls are wrapped with tenacity retry (3 attempts, exponential back-off).
  - Logging replaces print() — wire up structlog / JSON handler in production.
"""

import json
import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from agent.state import FoodAgentState
from agent.prompts import (
    EXTRACTION_SYSTEM_PROMPT,
    EXTRACTION_USER_PROMPT,
    ANALYSIS_SYSTEM_PROMPT,
    ANALYSIS_USER_PROMPT,
    FORMAT_SYSTEM_PROMPT,
    FORMAT_USER_PROMPT,
)
from utils.image_utils import (
    extract_text_from_images,
    detect_valid_label_images,
    safe_json_parse,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# LLM CLIENT REGISTRY
# Clients are cached at module level — one instance per (provider, model).
# lru_cache on a tiny key-set is effectively a singleton per configuration.
# ─────────────────────────────────────────────────────────────────────────────

class LLMConfig:
    """Central model/temperature config — change here, not scattered across nodes."""
    OPENAI_MODEL      = "gpt-4o"          # upgrade from gpt-4o-mini for better JSON fidelity
    ANTHROPIC_MODEL   = "claude-sonnet-4-20250514"
    EXTRACT_TEMP      = 0.1               # low: faithfulness to label text is paramount
    ANALYZE_TEMP      = 0.2               # slight creativity for nuanced verdicts
    FORMAT_TEMP       = 0.4               # more warmth/personality in the final response


@lru_cache(maxsize=8)
def _get_cached_llm(provider: str, model: str, temperature: float):
    """
    Return a cached LLM client. Called with hashable primitives so lru_cache works.
    Never call this directly — use get_llm() below.
    """
    if provider == "openai":
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise EnvironmentError("OPENAI_API_KEY environment variable is not set.")
        return ChatOpenAI(model=model, temperature=temperature, api_key=api_key)

    if provider == "anthropic":
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise EnvironmentError("ANTHROPIC_API_KEY environment variable is not set.")
        return ChatAnthropic(model=model, temperature=temperature, api_key=api_key)

    raise ValueError(f"Unsupported LLM provider: '{provider}'. Use 'openai' or 'anthropic'.")


def get_llm(provider: str = "openai", temperature: float = LLMConfig.ANALYZE_TEMP):
    """
    Public accessor for LLM clients. Resolves the correct model string
    per provider and returns the shared cached instance.
    """
    model_map = {
        "openai":    LLMConfig.OPENAI_MODEL,
        "anthropic": LLMConfig.ANTHROPIC_MODEL,
    }
    if provider not in model_map:
        raise ValueError(f"Unknown provider '{provider}'. Choose 'openai' or 'anthropic'.")

    return _get_cached_llm(provider, model_map[provider], temperature)


# ─────────────────────────────────────────────────────────────────────────────
# RETRY DECORATOR
# Applied to every LLM invoke call. Retries on transient network/API errors;
# does NOT retry on ValueError (bad prompt / bad JSON — logic errors).
# ─────────────────────────────────────────────────────────────────────────────

_llm_retry = retry(
    retry=retry_if_exception_type((TimeoutError, ConnectionError, OSError)),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    stop=stop_after_attempt(3),
    reraise=True,
)


@_llm_retry
def _invoke_llm(llm, messages: list) -> str:
    """Thin wrapper so the retry decorator can target just the network call."""
    return llm.invoke(messages).content


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _is_extraction_usable(nutrition: dict, ingredients: dict) -> bool:
    """
    Return True if the extraction has enough data to feed the analysis node.
    Requires at least one non-null nutrition value OR a non-empty ingredient list.
    """
    has_nutrition = any(v is not None for v in (nutrition or {}).values())
    has_ingredients = bool((ingredients or {}).get("ingredient_list"))
    return has_nutrition or has_ingredients


def _build_extracted_data_payload(state: FoodAgentState) -> dict:
    """Assemble the full extraction payload sent to the analysis prompt."""
    return {
        "product_name":        state.get("product_name", "Unknown"),
        "brand":               state.get("brand"),
        "fssai_number":        state.get("fssai_number"),
        "net_weight_g":        state.get("net_weight_g"),
        "nutritional_claims":  state.get("nutritional_claims", []),
        "nutrition":           state.get("extracted_nutrition", {}),
        "ingredients":         state.get("extracted_ingredients", {}),
    }


# ─────────────────────────────────────────────────────────────────────────────
# NODE 1 — extract_food_data
# ─────────────────────────────────────────────────────────────────────────────

def extract_food_data(state: FoodAgentState) -> dict[str, Any]:
    """
    OCR node: validates images, runs OCR, calls LLM to parse the label.

    State reads : image_paths, language
    State writes: raw_ocr_text, extracted_nutrition, extracted_ingredients,
                  product_name, brand, fssai_number, net_weight_g,
                  nutritional_claims, skipped_images, error
    """
    logger.info("[Node 1/3] extract_food_data — start")

    image_paths = state.get("image_paths", [])
    language    = state.get("language", "english")

    # ── Image validation ──────────────────────────────────────────────────────
    try:
        validity = detect_valid_label_images(image_paths, language=language)
    except Exception as exc:
        logger.exception("detect_valid_label_images raised unexpectedly")
        return {"error": f"Image validation failed: {exc}"}

    valid_images   = validity.get("valid", [])
    invalid_images = validity.get("invalid", [])
    texts_map      = validity.get("texts", {})

    if not valid_images:
        reasons = "; ".join(
            f"{Path(i['path']).name}: {i['reason']}" for i in invalid_images
        )
        logger.warning("No valid label images found. Reasons: %s", reasons)
        return {
            "error": (
                "INVALID_IMAGES: Please upload photos that clearly show the nutrition "
                f"facts table or ingredient list. Details — {reasons}"
            ),
            "raw_ocr_text": "\n\n".join(
                f"--- {Path(p).name} ---\n{texts_map.get(p, '')}"
                for p in texts_map
            ),
        }

    skipped = [Path(i["path"]).name for i in invalid_images]
    if skipped:
        logger.info("Skipping %d image(s) that failed validation: %s", len(skipped), skipped)

    # ── OCR ───────────────────────────────────────────────────────────────────
    try:
        ocr_text = extract_text_from_images(valid_images, language=language)
    except Exception as exc:
        logger.exception("extract_text_from_images failed")
        return {"error": f"OCR failed: {exc}"}

    logger.info("OCR complete — %d char(s) from %d image(s)", len(ocr_text), len(valid_images))

    # ── LLM extraction call ───────────────────────────────────────────────────
    llm      = get_llm(provider="openai", temperature=LLMConfig.EXTRACT_TEMP)
    prompt   = EXTRACTION_USER_PROMPT.format(ocr_text=ocr_text)
    messages = [SystemMessage(content=EXTRACTION_SYSTEM_PROMPT), HumanMessage(content=prompt)]

    try:
        raw_text = _invoke_llm(llm, messages)
        logger.info("Extraction LLM responded (%d chars)", len(raw_text))
    except Exception as exc:
        logger.exception("Extraction LLM call failed after retries")
        return {"error": f"Extraction API call failed: {exc}"}

    # ── Parse JSON ────────────────────────────────────────────────────────────
    parsed = safe_json_parse(raw_text)
    if not parsed:
        logger.warning("safe_json_parse returned None — returning raw OCR text only")
        return {
            "raw_ocr_text":          ocr_text,
            "extracted_nutrition":   None,
            "extracted_ingredients": None,
            "product_name":          "Unknown Product",
            "error":                 "Could not parse structured data from the label. "
                                     "Try a clearer image.",
        }

    # ── Map to state fields ───────────────────────────────────────────────────
    nutrition_raw    = parsed.get("nutrition", {}) or {}
    ingredients_raw  = parsed.get("ingredients", {}) or {}

    extracted_nutrition = {
        # Core macros
        "energy_kcal_per_100g":  nutrition_raw.get("energy_kcal_per_100g"),
        "energy_kcal_per_serving": nutrition_raw.get("energy_kcal_per_serving"),
        "carbs_g":               nutrition_raw.get("carbs_g"),
        "sugar_g":               nutrition_raw.get("sugar_g"),
        "added_sugar_g":         nutrition_raw.get("added_sugar_g"),
        "sugar_alcohols_g":      nutrition_raw.get("sugar_alcohols_g"),
        "fat_g":                 nutrition_raw.get("fat_g"),
        "saturated_fat_g":       nutrition_raw.get("saturated_fat_g"),
        "trans_fat_g":           nutrition_raw.get("trans_fat_g"),
        "sodium_mg":             nutrition_raw.get("sodium_mg"),
        "protein_g":             nutrition_raw.get("protein_g"),
        "fiber_g":               nutrition_raw.get("fiber_g"),
        # Micronutrients
        "calcium_mg":            nutrition_raw.get("calcium_mg"),
        "iron_mg":               nutrition_raw.get("iron_mg"),
        "vitamin_c_mg":          nutrition_raw.get("vitamin_c_mg"),
        # Serving info
        "serving_size_g":        parsed.get("serving_size_g"),
        "servings_per_package":  parsed.get("servings_per_package"),
    }

    extracted_ingredients = {
        "raw_ingredients_text": ingredients_raw.get("raw_text", ""),
        "ingredient_list":      ingredients_raw.get("ingredient_list", []),
        "additives":            ingredients_raw.get("additives", []),
        "allergens":            ingredients_raw.get("allergens", []),
        "preservatives":        ingredients_raw.get("preservatives", []),
        "artificial_colors":    ingredients_raw.get("artificial_colors", []),
        "artificial_sweeteners": ingredients_raw.get("artificial_sweeteners", []),
    }

    # Warn if extraction is thin — analysis will still run but may be shallow
    if not _is_extraction_usable(extracted_nutrition, extracted_ingredients):
        logger.warning("Extraction data is very sparse — analysis quality may be low")

    logger.info(
        "Extraction done — product='%s' | %d ingredients | %d additives",
        parsed.get("product_name", "Unknown"),
        len(extracted_ingredients["ingredient_list"]),
        len(extracted_ingredients["additives"]),
    )

    return {
        "raw_ocr_text":          json.dumps(parsed, indent=2),
        "extracted_nutrition":   extracted_nutrition,
        "extracted_ingredients": extracted_ingredients,
        "product_name":          parsed.get("product_name") or "Unknown Product",
        "brand":                 parsed.get("brand"),
        "fssai_number":          parsed.get("fssai_number"),
        "net_weight_g":          parsed.get("net_weight_g"),
        "nutritional_claims":    parsed.get("nutritional_claims", []),
        "skipped_images":        skipped,
        "error":                 None,
    }


# ─────────────────────────────────────────────────────────────────────────────
# NODE 2 — analyze_food
# ─────────────────────────────────────────────────────────────────────────────

_ANALYSIS_FALLBACK: dict = {
    "overall_verdict":         "UNKNOWN",
    "verdict_emoji":           "🤔",
    "verdict_color":           "yellow",
    "health_score":            0,
    "positives":               [],
    "harmful_ingredients":     [],
    "okay_ingredients":        [],
    "nutrition_insights":      ["Could not fully analyze this product."],
    "fun_comparisons":         [],
    "regular_consumption_risk": "Insufficient data to assess long-term risk.",
    "best_for":                "Unknown",
    "buy_or_avoid":            "Unable to give a confident recommendation.",
    "healthier_swap":          "Try whole, minimally-processed foods.",
    "short_summary":           "Analysis incomplete. Try uploading a clearer image.",
}


def analyze_food(state: FoodAgentState) -> dict[str, Any]:
    """
    Analysis node: sends structured extraction data to LLM and gets health verdict.

    State reads : extracted_nutrition, extracted_ingredients, product_name,
                  brand, fssai_number, net_weight_g, nutritional_claims
    State writes: analysis_result, error
    """
    logger.info("[Node 2/3] analyze_food — start")

    # graph.py guarantees no error in state here, but guard defensively
    if state.get("error"):
        logger.warning("analyze_food called with pre-existing error — skipping")
        return {}

    extracted_data = _build_extracted_data_payload(state)

    llm = get_llm(provider="openai", temperature=LLMConfig.ANALYZE_TEMP)
    messages = [
        SystemMessage(content=ANALYSIS_SYSTEM_PROMPT),
        HumanMessage(
            content=ANALYSIS_USER_PROMPT.format(
                extracted_data=json.dumps(extracted_data, indent=2)
            )
        ),
    ]

    try:
        raw_text = _invoke_llm(llm, messages)
        logger.info("Analysis LLM responded (%d chars)", len(raw_text))
    except Exception as exc:
        logger.exception("Analysis LLM call failed after retries")
        return {"error": f"Analysis API call failed: {exc}"}

    parsed = safe_json_parse(raw_text)
    if not parsed:
        logger.warning("safe_json_parse returned None for analysis — using fallback")
        parsed = _ANALYSIS_FALLBACK.copy()

    # Ensure every expected key is present (forward-compat if prompt adds new fields)
    for key, default in _ANALYSIS_FALLBACK.items():
        parsed.setdefault(key, default)

    logger.info(
        "Analysis done — verdict=%s %s | score=%s/10",
        parsed.get("overall_verdict"),
        parsed.get("verdict_emoji"),
        parsed.get("health_score"),
    )

    return {
        "analysis_result": parsed,
        "error":           None,
    }


# ─────────────────────────────────────────────────────────────────────────────
# NODE 3 — format_response
# ─────────────────────────────────────────────────────────────────────────────

def format_response(state: FoodAgentState) -> dict[str, Any]:
    """
    Formatting node: converts analysis_result into a friendly multilingual briefing.
    Also handles error states passed in from handle_error (graph.py) when needed.

    State reads : analysis_result, product_name, language, skipped_images, error
    State writes: formatted_response
    """
    logger.info("[Node 3/3] format_response — start")

    # ── Error pass-through (should normally be handled by handle_error node) ──
    if state.get("error"):
        err = state["error"]
        if isinstance(err, str) and err.startswith("INVALID_IMAGES:"):
            friendly = err.split(":", 1)[1].strip()
            logger.info("Rendering INVALID_IMAGES error message")
            return {"formatted_response": f"❌ {friendly}"}
        logger.warning("format_response reached with error: %s", err)
        return {
            "formatted_response": (
                f"❌ Something went wrong:\n{err}\n\n"
                "Please try uploading a clearer image of the food label."
            )
        }

    analysis = state.get("analysis_result")
    if not analysis:
        logger.error("format_response: analysis_result is missing from state")
        return {
            "formatted_response": (
                "❌ Could not analyze this product.\n"
                "Please make sure the image clearly shows the nutrition facts and ingredients."
            )
        }

    # ── LLM formatting call ───────────────────────────────────────────────────
    language = state.get("language", "english")
    llm      = get_llm(provider="openai", temperature=LLMConfig.FORMAT_TEMP)
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
        formatted_text = _invoke_llm(llm, messages).strip()
        logger.info("Formatting LLM responded (%d chars)", len(formatted_text))
    except Exception as exc:
        logger.exception("Formatting LLM call failed after retries — using fallback renderer")
        formatted_text = _build_fallback_response(
            analysis, state.get("product_name", "this product")
        )

    # ── Append skipped-image notice ───────────────────────────────────────────
    skipped = state.get("skipped_images") or []
    if skipped:
        skipped_names = ", ".join(skipped)
        formatted_text += (
            f"\n\n📎 Note: {len(skipped)} image(s) were skipped because they didn't "
            f"appear to contain label text ({skipped_names}). "
            "Upload a clearer photo of the nutrition facts or ingredient list if needed."
        )

    logger.info("format_response — done")
    return {"formatted_response": formatted_text}


# ─────────────────────────────────────────────────────────────────────────────
# FALLBACK RENDERER
# Used when the formatting LLM call fails entirely.
# Renders a clean, readable summary directly from the analysis dict.
# ─────────────────────────────────────────────────────────────────────────────

_VERDICT_DOT = {"HEALTHY": "🟢", "OKAY": "🟡", "UNHEALTHY": "🔴", "JUNK": "🔴"}


def _build_fallback_response(analysis: dict, product_name: str) -> str:
    verdict    = analysis.get("overall_verdict", "UNKNOWN")
    emoji      = analysis.get("verdict_emoji", "🤔")
    score      = analysis.get("health_score", "?")
    color_dot  = _VERDICT_DOT.get(verdict, "⚪")

    lines: list[str] = [
        f"{color_dot} {verdict} {emoji}  —  Health Score: {score}/10",
        f"Product: {product_name}",
        "",
        analysis.get("short_summary", ""),
        "",
    ]

    positives = analysis.get("positives", [])
    if positives:
        lines.append("✅ What's Good")
        for p in positives[:3]:
            lines.append(f"  • {p.get('point', '')}")
        lines.append("")

    harmful = analysis.get("harmful_ingredients", [])
    if harmful:
        lines.append("⚠️  Watch Out For")
        for item in harmful[:4]:
            risk = item.get("risk_level", "").upper()
            lines.append(
                f"  • {item.get('name', '')} [{risk}] — "
                f"{item.get('why_harmful', '')}. "
                f"Avoid if: {item.get('who_should_avoid', 'sensitive individuals')}."
            )
        lines.append("")

    comparisons = analysis.get("fun_comparisons", [])
    if comparisons:
        lines.append("📊 By the Numbers")
        for c in comparisons[:3]:
            lines.append(f"  • {c}")
        lines.append("")

    risk = analysis.get("regular_consumption_risk")
    if risk:
        lines += [f"⏳ Daily habit risk: {risk}", ""]

    swap = analysis.get("healthier_swap")
    if swap:
        lines += [f"💡 Better alternative: {swap}", ""]

    lines.append(f"🏁 {analysis.get('buy_or_avoid', '')}")
    best_for = analysis.get("best_for")
    if best_for:
        lines.append(f"   Best for: {best_for}")

    return "\n".join(lines)
