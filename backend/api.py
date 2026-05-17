import os
import uuid
import tempfile
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from agent.graph import food_analyzer
from agent.state import FoodAgentState

load_dotenv()

app = FastAPI(
    title="Food Analyzer API",
    description="Backend API for the premium Food Analyzer web application.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeResponse(BaseModel):
    product_name: Optional[str]
    final_response: Optional[str]
    raw_ocr_text: Optional[str]
    food_analysis: Optional[dict]
    error: Optional[str]


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "food-analyzer-backend"}


def _save_upload(file: UploadFile, tmp_dir: Path) -> str:
    target_file = tmp_dir / f"{uuid.uuid4().hex}_{Path(file.filename).name}"
    with target_file.open("wb") as f:
        f.write(file.file.read())
    return str(target_file)


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_food_label(
    files: List[UploadFile] = File(...),
    message: Optional[str] = Form(None),
    language: Optional[str] = Form("english"),
):
    if not files:
        raise HTTPException(status_code=400, detail="Upload at least one image file.")

    language = language.strip().lower() if language else "english"
    if language not in {"english", "hindi", "hinglish"}:
        language = "english"

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        image_paths = []

        for upload in files:
            if upload.content_type.split("/")[0] != "image":
                continue
            image_paths.append(_save_upload(upload, temp_path))

        if not image_paths:
            raise HTTPException(status_code=400, detail="No valid image files were uploaded.")

        initial_state: FoodAgentState = {
            "image_paths": image_paths,
            "user_message": message,
            "language": language,
            "raw_ocr_text": "",
            "extracted_nutrition": None,
            "extracted_ingredients": None,
            "product_name": None,
            "food_analysis": None,
            "final_response": None,
            "error": None,
        }

        try:
            result = food_analyzer.invoke(initial_state)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc))

    return AnalyzeResponse(
        product_name=result.get("product_name"),
        final_response=result.get("final_response"),
        raw_ocr_text=result.get("raw_ocr_text"),
        food_analysis=result.get("food_analysis"),
        error=result.get("error"),
    )
