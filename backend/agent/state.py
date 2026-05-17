# """
# State definition for the Food Analyzer LangGraph agent.
# """

# from typing import TypedDict, Optional, List


# class ExtractedNutrition(TypedDict):
#     """Structured nutrition data extracted from the image."""
#     energy_kcal_per_100g: Optional[float]
#     carbs_g: Optional[float]
#     sugar_g: Optional[float]
#     fat_g: Optional[float]
#     saturated_fat_g: Optional[float]
#     trans_fat_g: Optional[float]
#     sodium_mg: Optional[float]
#     protein_g: Optional[float]
#     fiber_g: Optional[float]
#     serving_size_g: Optional[float]
#     servings_per_package: Optional[int]


# class ExtractedIngredients(TypedDict):
#     """Structured ingredients data extracted from the image."""
#     raw_ingredients_text: str
#     ingredient_list: List[str]
#     additives: List[str]          # INS numbers, E-numbers etc
#     allergens: List[str]
#     preservatives: List[str]


# class FoodAnalysis(TypedDict):
#     """AI analysis result."""
#     overall_verdict: str          # "HEALTHY" | "OKAY" | "UNHEALTHY" | "JUNK"
#     verdict_emoji: str
#     verdict_color: str            # for UI: green / yellow / red
#     harmful_ingredients: List[dict]   # [{name, why_harmful}]
#     okay_ingredients: List[str]
#     nutrition_insights: List[str]     # fun one-liners
#     fun_comparisons: List[str]        # "sugar = 3 teaspoons", "walk 2km to burn"
#     buy_or_avoid: str                 # one-line action advice
#     short_summary: str                # 2-3 line honest summary


# class FoodAgentState(TypedDict):
#     """Main agent state passed through the graph."""
#     # INPUT
#     image_paths: List[str]           # paths or base64 strings
#     user_message: Optional[str]      # optional user text
#     language: str                    # "english" | "hindi" | "hinglish"

#     # EXTRACTED DATA (after OCR node)
#     raw_ocr_text: str
#     extracted_nutrition: Optional[ExtractedNutrition]
#     extracted_ingredients: Optional[ExtractedIngredients]
#     product_name: Optional[str]

#     # ANALYSIS (after analysis node)
#     food_analysis: Optional[FoodAnalysis]

#     # OUTPUT
#     final_response: Optional[str]    # formatted response for display
#     error: Optional[str]             # any error message



"""
State definitions for the Food Analyzer LangGraph agent.

Hierarchy:
  FoodAgentState          ← top-level graph state (passed between every node)
    ├─ ExtractedNutrition ← structured nutrition panel from OCR
    ├─ ExtractedIngredients← ingredient list, additives, allergens
    ├─ HarmfulIngredient  ← one entry in the harmful_ingredients list
    ├─ PositivePoint      ← one entry in the positives list
    └─ FoodAnalysis       ← full health verdict from the analysis node

Design rules:
  - Every field that a node *writes* must be declared here.
  - Input fields are Required; intermediate/output fields use NotRequired.
  - Sub-TypedDicts use total=False so callers can build them incrementally.
  - No default values here — defaults belong in node logic.
"""

from typing import List, Literal, NotRequired, Optional, Required, TypedDict


# ─────────────────────────────────────────────────────────────────────────────
# SUPPORTED VALUE SETS
# Single source of truth — import these in nodes/graph instead of repeating strings.
# ─────────────────────────────────────────────────────────────────────────────

VerdictType   = Literal["HEALTHY", "OKAY", "UNHEALTHY", "JUNK", "UNKNOWN"]
VerdictColor  = Literal["green", "yellow", "red"]
VerdictEmoji  = Literal["😍", "👍", "😬", "🚫", "🤔"]
RiskLevel     = Literal["high", "moderate", "low"]
LanguageType  = Literal["english", "hindi", "hinglish"]


# ─────────────────────────────────────────────────────────────────────────────
# SUB-SCHEMAS — nested structures stored inside FoodAgentState
# ─────────────────────────────────────────────────────────────────────────────

class ExtractedNutrition(TypedDict, total=False):
    """
    Structured nutrition panel data extracted from the food label.
    All fields are optional — OCR may not capture every value.
    Values are always stored in the units shown in the field name.
    """
    # Energy
    energy_kcal_per_100g:    Optional[float]   # primary benchmark value
    energy_kcal_per_serving: Optional[float]   # as printed on pack

    # Carbohydrates
    carbs_g:                 Optional[float]
    sugar_g:                 Optional[float]   # total sugars
    added_sugar_g:           Optional[float]   # declared separately on some labels
    sugar_alcohols_g:        Optional[float]   # maltitol, sorbitol, etc.

    # Fats
    fat_g:                   Optional[float]   # total fat
    saturated_fat_g:         Optional[float]
    trans_fat_g:             Optional[float]   # any non-zero → flag immediately

    # Other macros
    sodium_mg:               Optional[float]
    protein_g:               Optional[float]
    fiber_g:                 Optional[float]

    # Micronutrients (not always printed, but extract if visible)
    calcium_mg:              Optional[float]
    iron_mg:                 Optional[float]
    vitamin_c_mg:            Optional[float]

    # Serving info
    serving_size_g:          Optional[float]
    servings_per_package:    Optional[float]   # float to handle "≈2.5" values


class ExtractedIngredients(TypedDict, total=False):
    """
    Ingredient and additive data extracted from the food label.
    """
    raw_ingredients_text:    str            # verbatim text from the label
    ingredient_list:         List[str]      # parsed individual ingredients
    additives:               List[str]      # INS / E-numbers  e.g. "INS 412"
    allergens:               List[str]      # declared allergens e.g. "wheat", "milk"
    preservatives:           List[str]      # subset of additives
    artificial_colors:       List[str]      # e.g. "Sunset Yellow FCF", "Tartrazine"
    artificial_sweeteners:   List[str]      # e.g. "aspartame", "sucralose"


class HarmfulIngredient(TypedDict, total=False):
    """One entry in FoodAnalysis.harmful_ingredients."""
    name:             str          # ingredient or additive name
    risk_level:       RiskLevel    # "high" | "moderate" | "low"
    why_harmful:      str          # plain-English reason, max 15 words
    who_should_avoid: str          # e.g. "children, diabetics" or "everyone"


class PositivePoint(TypedDict, total=False):
    """One entry in FoodAnalysis.positives."""
    icon:  str   # always "✅"
    point: str   # short positive fact, max 10 words


class FoodAnalysis(TypedDict, total=False):
    """
    Complete health verdict produced by the analysis node.
    All fields populated by the LLM; defaults set in nodes.py fallback dict.
    """
    # Verdict
    overall_verdict:          VerdictType    # "HEALTHY" | "OKAY" | "UNHEALTHY" | "JUNK"
    verdict_emoji:            VerdictEmoji
    verdict_color:            VerdictColor   # used by the UI for colour coding
    health_score:             int            # 1–10 composite score

    # Ingredient breakdown
    positives:                List[PositivePoint]
    harmful_ingredients:      List[HarmfulIngredient]
    okay_ingredients:         List[str]

    # Insights
    nutrition_insights:       List[str]      # crisp one-liners, max 12 words each
    fun_comparisons:          List[str]      # relatable analogies e.g. "Sugar = 4 tsp"

    # Risk & recommendation
    regular_consumption_risk: str            # 1 sentence: what daily eating does long-term
    best_for:                 str            # who/when this product suits best
    buy_or_avoid:             str            # 1-line action: buy / okay occasionally / skip
    healthier_swap:           str            # specific realistic alternative
    short_summary:            str            # 2 sentences: sentence 1 = good, 2 = concern


# ─────────────────────────────────────────────────────────────────────────────
# TOP-LEVEL GRAPH STATE
# ─────────────────────────────────────────────────────────────────────────────

class FoodAgentState(TypedDict, total=False):
    """
    Master state passed through every node in the Food Analyzer graph.

    Field lifecycle:
    ┌─────────────────────┬──────────────────────────────────────────────────┐
    │ Field               │ Written by                                       │
    ├─────────────────────┼──────────────────────────────────────────────────┤
    │ image_paths         │ Caller (required input)                          │
    │ language            │ Caller → normalised by validate_input            │
    │ user_message        │ Caller (optional)                                │
    ├─────────────────────┼──────────────────────────────────────────────────┤
    │ validation_failed   │ validate_input                                   │
    ├─────────────────────┼──────────────────────────────────────────────────┤
    │ raw_ocr_text        │ extract_food_data                                │
    │ product_name        │ extract_food_data                                │
    │ brand               │ extract_food_data                                │
    │ fssai_number        │ extract_food_data                                │
    │ net_weight_g        │ extract_food_data                                │
    │ nutritional_claims  │ extract_food_data                                │
    │ extracted_nutrition │ extract_food_data                                │
    │ extracted_ingredients│ extract_food_data                               │
    │ skipped_images      │ extract_food_data                                │
    ├─────────────────────┼──────────────────────────────────────────────────┤
    │ analysis_result     │ analyze_food                                     │
    ├─────────────────────┼──────────────────────────────────────────────────┤
    │ formatted_response  │ format_response / handle_error                   │
    ├─────────────────────┼──────────────────────────────────────────────────┤
    │ error               │ Any node (set on failure, cleared on success)    │
    └─────────────────────┴──────────────────────────────────────────────────┘
    """

    # ── Required inputs (caller must supply these) ────────────────────────────
    image_paths:              Required[List[str]]   # file paths or base64 strings
    language:                 Required[LanguageType]

    # ── Optional input ────────────────────────────────────────────────────────
    user_message:             NotRequired[Optional[str]]  # free-text context from user

    # ── Validation node ───────────────────────────────────────────────────────
    validation_failed:        NotRequired[bool]

    # ── Extraction node ───────────────────────────────────────────────────────
    raw_ocr_text:             NotRequired[str]
    product_name:             NotRequired[Optional[str]]
    brand:                    NotRequired[Optional[str]]
    fssai_number:             NotRequired[Optional[str]]
    net_weight_g:             NotRequired[Optional[float]]
    nutritional_claims:       NotRequired[List[str]]       # e.g. ["high protein", "no added sugar"]
    extracted_nutrition:      NotRequired[Optional[ExtractedNutrition]]
    extracted_ingredients:    NotRequired[Optional[ExtractedIngredients]]
    skipped_images:           NotRequired[List[str]]       # filenames skipped by guardrails

    # ── Analysis node ─────────────────────────────────────────────────────────
    analysis_result:          NotRequired[Optional[FoodAnalysis]]

    # ── Output ────────────────────────────────────────────────────────────────
    formatted_response:       NotRequired[Optional[str]]   # final text shown to user

    # ── Error channel (any node may write; cleared by next successful node) ───
    error:                    NotRequired[Optional[str]]