import os
import sys
import shutil
import base64
from io import BytesIO
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import pytesseract

# Allow the backend package itself to be imported whether the script is run from
# the backend folder or from the repo root.
CURRENT_DIR = os.path.dirname(__file__)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

try:
    import config
    from ingredients.database import IngredientDatabase
    from analysis.claim_detector import MisleadingClaimDetector
    from analysis.rule_engine import RuleEngine
    from llm.message_generator import MessageGenerator
    from llm.food_agent import FoodAnalysisAgent
    from models import AnalyzeRequest, AnalyzeResponse, IngredientsData, Insight, MisleadingClaim, NutritionData
    from ocr.preprocessor import load_image_from_base64, preprocess_for_ocr
except ModuleNotFoundError:
    import config
    from ingredients.database import IngredientDatabase
    from analysis.claim_detector import MisleadingClaimDetector
    from analysis.rule_engine import RuleEngine
    from llm.message_generator import MessageGenerator
    from llm.food_agent import FoodAnalysisAgent
    from models import AnalyzeRequest, AnalyzeResponse, IngredientsData, Insight, MisleadingClaim, NutritionData
    from ocr.preprocessor import load_image_from_base64, preprocess_for_ocr

app = FastAPI(
    title="Food Analyzer API",
    description="Analyze food packaging images for nutrition, ingredients, and misleading claims.",
    version="0.1.0",
)

if config.settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

ingredient_db = IngredientDatabase()
rule_engine = RuleEngine()
claim_detector = MisleadingClaimDetector()
message_generator = MessageGenerator(provider=config.settings.LLM_PROVIDER)
food_agent = FoodAnalysisAgent(provider=config.settings.LLM_PROVIDER)


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {"status": "ok", "service": "Food Analyzer API"}


def _set_tesseract_path() -> None:
    if config.settings.TESSERACT_PATH:
        path = os.path.expandvars(config.settings.TESSERACT_PATH)
        if os.path.isdir(path):
            binary_name = "tesseract.exe" if os.name == "nt" else "tesseract"
            candidate = os.path.join(path, binary_name)
            if os.path.isfile(candidate):
                path = candidate

        if not os.path.isfile(path):
            raise FileNotFoundError(
                f"Tesseract binary not found at '{config.settings.TESSERACT_PATH}'. "
                "Set TESSERACT_PATH to the executable path, not the folder."
            )

        pytesseract.pytesseract.tesseract_cmd = path
    else:
        found = shutil.which("tesseract")
        if found:
            pytesseract.pytesseract.tesseract_cmd = found


def _ocr_text_from_image_base64(image_base64: str) -> str:
    image = load_image_from_base64(image_base64)
    processed = preprocess_for_ocr(image)

    if config.settings.USE_TESSERACT:
        try:
            _set_tesseract_path()
        except FileNotFoundError as exc:
            raise HTTPException(
                status_code=500,
                detail=str(exc) + "\nInstall Tesseract or set TESSERACT_PATH to the executable.",
            )

    try:
        return pytesseract.image_to_string(processed)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"OCR extraction failed: {exc}")


@app.post("/analyze-food", response_model=AnalyzeResponse)
def analyze_food(request: AnalyzeRequest) -> AnalyzeResponse:
    raw_ocr_text = _ocr_text_from_image_base64(request.image_base64)
    
    # Use LangGraph agent for comprehensive analysis
    analysis_result = food_agent.analyze_food(raw_ocr_text)
    
    # Extract data from agent result
    product_name = analysis_result["product_name"]
    nutrition = analysis_result["nutrition"]
    ingredients = analysis_result["ingredients"]
    claims = analysis_result["claims"]
    ingredient_analysis = analysis_result["ingredient_analysis"]
    health_score = analysis_result["health_score"]
    verdict = analysis_result["verdict"]
    insights = analysis_result["insights"]
    misleading_claims = analysis_result["misleading_claims"]
    final_message = analysis_result["message"]

    return AnalyzeResponse(
        verdict=verdict,
        score="🟢" if health_score >= 70 else "🟡" if health_score >= 50 else "🔴",
        health_score=health_score,
        product_name=product_name,
        insights=[Insight(icon="🟢" if health_score >= 70 else "🟡" if health_score >= 50 else "🔴", text=insight) for insight in insights],
        nutrition=NutritionData(
            energy_kcal_per_100g=nutrition.get("energy_kcal"),
            carbs_g=None,
            sugar_g=nutrition.get("sugar_g"),
            fat_g=nutrition.get("fat_g"),
            saturated_fat_g=nutrition.get("saturated_fat_g"),
            sodium_mg=nutrition.get("sodium_mg"),
            protein_g=nutrition.get("protein_g"),
            fiber_g=nutrition.get("fiber_g"),
            serving_size_g=nutrition.get("serving_size_g"),
        ),
        ingredients=IngredientsData(
            ingredient_list=ingredients,
            additives=[item["ingredient"] for item in ingredient_analysis.get("additives", [])],
            allergens=[item["ingredient"] for item in ingredient_analysis.get("allergens", [])],
            preservatives=ingredient_analysis.get("preservatives", []),
            claims=claims,
        ),
        misleading_claims=[MisleadingClaim(**claim) for claim in misleading_claims],
        message=final_message,
        raw_ocr_text=raw_ocr_text,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=config.settings.HOST,
        port=config.settings.PORT,
        reload=config.settings.DEBUG,
    )
