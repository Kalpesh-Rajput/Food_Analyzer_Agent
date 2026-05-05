import os
import sys
import shutil
import base64
import re
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
    from models import AnalyzeRequest, AnalyzeResponse, IngredientsData, Insight, MisleadingClaim, NutritionData
    from ocr.preprocessor import load_image_from_base64, preprocess_for_ocr
except ModuleNotFoundError:
    from backend import config
    from backend.ingredients.database import IngredientDatabase
    from backend.analysis.claim_detector import MisleadingClaimDetector
    from backend.analysis.rule_engine import RuleEngine
    from backend.llm.message_generator import MessageGenerator
    from backend.models import AnalyzeRequest, AnalyzeResponse, IngredientsData, Insight, MisleadingClaim, NutritionData
    from backend.ocr.preprocessor import load_image_from_base64, preprocess_for_ocr

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


def _parse_product_name(text: str) -> str:
    for line in text.splitlines():
        line = line.strip()
        if line and len(line) < 80:
            return line
    return "Food Product"


def _parse_nutrition(text: str) -> Dict[str, Any]:
    normalized = text.replace("\r", "\n").lower()
    data: Dict[str, Any] = {
        "energy_kcal": 0,
        "sugar_g": 0,
        "fat_g": 0,
        "saturated_fat_g": 0,
        "sodium_mg": 0,
        "protein_g": 0,
        "fiber_g": 0,
        "serving_size_g": 0,
    }

    patterns = {
        "energy_kcal": [
            r"(?:energy|total energy|calories|cal)\s*[:\-]?\s*(\d+(?:\.\d+)?)",
            r"(\d+(?:\.\d+)?)\s*(?:kcal|calories|cal)\b",
        ],
        "sugar_g": [
            r"(?:total\s*)?(?:sugars?|sugar)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:g|grams?)",
            r"(?:total\s*)?(?:sugars?|sugar)\s*[:\-]?\s*(\d+(?:\.\d+)?)\b",
        ],
        "fat_g": [
            r"(?:total\s*)?fat\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:g|grams?)",
        ],
        "saturated_fat_g": [
            r"saturated\s*fat\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:g|grams?)",
        ],
        "sodium_mg": [
            r"sodium\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*mg",
            r"sodium\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g",
            r"salt\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*mg",
            r"salt\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g",
        ],
        "protein_g": [
            r"protein\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:g|grams?)",
        ],
        "fiber_g": [
            r"(?:dietary\s*)?fiber\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:g|grams?)",
        ],
        "serving_size_g": [
            r"serving\s*size\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:g|grams?)",
        ],
    }

    for key, patterns_for_key in patterns.items():
        for pattern in patterns_for_key:
            match = re.search(pattern, normalized)
            if match:
                try:
                    value = float(match.group(1))
                    if key == "sodium_mg" and "g" in match.group(0).lower():
                        value *= 1000
                    data[key] = value
                except ValueError:
                    data[key] = 0
                break

    # Fallback if values are hidden behind different labels
    if not data["energy_kcal"]:
        match = re.search(r"(\d+(?:\.\d+)?)\s*(?:kcal|calories|cal)\b", normalized)
        if match:
            try:
                data["energy_kcal"] = float(match.group(1))
            except ValueError:
                pass

    if not data["sugar_g"]:
        match = re.search(r"(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*(?:sugar|sugars)\b", normalized)
        if match:
            try:
                data["sugar_g"] = float(match.group(1))
            except ValueError:
                pass

    return data


def _parse_ingredients(text: str) -> List[str]:
    normalized = text.replace("\r", "\n")
    match = re.search(
        r"(?:ingredients|contains|may contain)\s*[:\-]?\s*(.+?)(?:\n\s*(?:nutrition|serving|allergens|directions|$))",
        normalized,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if match:
        ingredients_text = match.group(1)
    else:
        lines = [line.strip() for line in normalized.splitlines() if line.strip()]
        ingredients_text = " ".join(lines[:6])

    # Remove parentheticals and hidden markup
    ingredients_text = re.sub(r"\(.*?\)", "", ingredients_text)
    items = [item.strip() for item in re.split(r",|;|\n|\band\b", ingredients_text) if item.strip()]
    return items


def _extract_claims(text: str) -> List[str]:
    found: List[str] = []
    claim_patterns = [
        r"100%\s*fruit",
        r"all\s*fruit",
        r"natural(?!ly)",
        r"no\s*sugar",
        r"sugar\s*free",
        r"high\s*protein",
        r"organic",
        r"low\s*fat",
        r"fat\s*free",
    ]

    lower = text.lower()
    for pattern in claim_patterns:
        match = re.search(pattern, lower)
        if match:
            claim = match.group(0)
            if claim not in found:
                found.append(claim)

    return found


@app.post("/analyze-food", response_model=AnalyzeResponse)
def analyze_food(request: AnalyzeRequest) -> AnalyzeResponse:
    raw_ocr_text = _ocr_text_from_image_base64(request.image_base64)
    product_name = _parse_product_name(raw_ocr_text)
    nutrition = _parse_nutrition(raw_ocr_text)
    ingredients = _parse_ingredients(raw_ocr_text)
    claims = _extract_claims(raw_ocr_text)

    ingredient_analysis = ingredient_db.analyze_ingredients(ingredients)
    verdict, score, insights = rule_engine.score_food(nutrition, ingredient_analysis, product_name)
    misleading_claims = claim_detector.detect_mismatches(claims, ingredients, nutrition)

    if not insights:
        insights = ["No clear nutrition issues detected from the label text."]

    final_message = message_generator.generate_final_message(
        verdict=verdict,
        score=score,
        insights=insights,
        product_name=product_name,
        misleading_claims=misleading_claims,
        nutrition=nutrition,
        ingredient_analysis=ingredient_analysis,
    )

    return AnalyzeResponse(
        verdict=verdict,
        score="🟢" if score >= 70 else "🟡" if score >= 50 else "🔴",
        health_score=int(score),
        product_name=product_name,
        insights=[Insight(icon="🟢" if score >= 70 else "🟡" if score >= 50 else "🔴", text=insight) for insight in insights],
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
            preservatives=[],
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
