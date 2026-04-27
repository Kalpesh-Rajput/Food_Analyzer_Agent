"""
State definition for the Food Analyzer LangGraph agent.
"""

from typing import TypedDict, Optional, List


class ExtractedNutrition(TypedDict):
    """Structured nutrition data extracted from the image."""
    energy_kcal_per_100g: Optional[float]
    carbs_g: Optional[float]
    sugar_g: Optional[float]
    fat_g: Optional[float]
    saturated_fat_g: Optional[float]
    trans_fat_g: Optional[float]
    sodium_mg: Optional[float]
    protein_g: Optional[float]
    fiber_g: Optional[float]
    serving_size_g: Optional[float]
    servings_per_package: Optional[int]


class ExtractedIngredients(TypedDict):
    """Structured ingredients data extracted from the image."""
    raw_ingredients_text: str
    ingredient_list: List[str]
    additives: List[str]          # INS numbers, E-numbers etc
    allergens: List[str]
    preservatives: List[str]


class FoodAnalysis(TypedDict):
    """AI analysis result."""
    overall_verdict: str          # "HEALTHY" | "OKAY" | "UNHEALTHY" | "JUNK"
    verdict_emoji: str
    verdict_color: str            # for UI: green / yellow / red
    harmful_ingredients: List[dict]   # [{name, why_harmful}]
    okay_ingredients: List[str]
    nutrition_insights: List[str]     # fun one-liners
    fun_comparisons: List[str]        # "sugar = 3 teaspoons", "walk 2km to burn"
    buy_or_avoid: str                 # one-line action advice
    short_summary: str                # 2-3 line honest summary


class FoodAgentState(TypedDict):
    """Main agent state passed through the graph."""
    # INPUT
    image_paths: List[str]           # paths or base64 strings
    user_message: Optional[str]      # optional user text
    language: str                    # "english" | "hindi" | "hinglish"

    # EXTRACTED DATA (after OCR node)
    raw_ocr_text: str
    extracted_nutrition: Optional[ExtractedNutrition]
    extracted_ingredients: Optional[ExtractedIngredients]
    product_name: Optional[str]

    # ANALYSIS (after analysis node)
    food_analysis: Optional[FoodAnalysis]

    # OUTPUT
    final_response: Optional[str]    # formatted response for display
    error: Optional[str]             # any error message
