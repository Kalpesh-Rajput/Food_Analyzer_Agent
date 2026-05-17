# import os
# import uuid
# import tempfile
# from pathlib import Path
# from typing import List, Optional

# from fastapi import FastAPI, File, Form, HTTPException, UploadFile
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from dotenv import load_dotenv

# from agent.graph import food_analyzer
# from agent.state import FoodAgentState

# load_dotenv()

# app = FastAPI(
#     title="Food Analyzer API",
#     description="Backend API for the premium Food Analyzer web application.",
#     version="0.1.0",
# )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# class AnalyzeResponse(BaseModel):
#     product_name: Optional[str]
#     final_response: Optional[str]
#     raw_ocr_text: Optional[str]
#     food_analysis: Optional[dict]
#     error: Optional[str]


# @app.get("/health")
# def health_check():
#     return {"status": "ok", "service": "food-analyzer-backend"}


# def _save_upload(file: UploadFile, tmp_dir: Path) -> str:
#     target_file = tmp_dir / f"{uuid.uuid4().hex}_{Path(file.filename).name}"
#     with target_file.open("wb") as f:
#         f.write(file.file.read())
#     return str(target_file)


# @app.post("/analyze", response_model=AnalyzeResponse)
# async def analyze_food_label(
#     files: List[UploadFile] = File(...),
#     message: Optional[str] = Form(None),
#     language: Optional[str] = Form("english"),
# ):
#     if not files:
#         raise HTTPException(status_code=400, detail="Upload at least one image file.")

#     language = language.strip().lower() if language else "english"
#     if language not in {"english", "hindi", "hinglish"}:
#         language = "english"

#     with tempfile.TemporaryDirectory() as temp_dir:
#         temp_path = Path(temp_dir)
#         image_paths = []

#         for upload in files:
#             if upload.content_type.split("/")[0] != "image":
#                 continue
#             image_paths.append(_save_upload(upload, temp_path))

#         if not image_paths:
#             raise HTTPException(status_code=400, detail="No valid image files were uploaded.")

#         initial_state: FoodAgentState = {
#             "image_paths": image_paths,
#             "user_message": message,
#             "language": language,
#             "raw_ocr_text": "",
#             "extracted_nutrition": None,
#             "extracted_ingredients": None,
#             "product_name": None,
#             "food_analysis": None,
#             "final_response": None,
#             "error": None,
#         }

#         try:
#             result = food_analyzer.invoke(initial_state)
#         except Exception as exc:
#             raise HTTPException(status_code=500, detail=str(exc))

#     return AnalyzeResponse(
#         product_name=result.get("product_name"),
#         final_response=result.get("final_response"),
#         raw_ocr_text=result.get("raw_ocr_text"),
#         food_analysis=result.get("food_analysis"),
#         error=result.get("error"),
#     )


# new code


"""
FastAPI entry point for the Food Analyzer backend.

Changes from v1:
  - Field names synced with updated state.py (food_analysis→analysis_result,
    final_response→formatted_response).
  - Initial state only sets Required fields — intermediate fields are not
    pre-populated (avoids accidental overwrites in graph nodes).
  - File reading is now fully async (await file.read() instead of file.file.read()).
  - File size capped at MAX_UPLOAD_MB before writing to disk.
  - File extension validated against SUPPORTED_EXTENSIONS (content-type can be spoofed).
  - CORS origins read from CORS_ORIGINS env var (comma-separated); defaults to
    localhost:3000 in dev instead of wildcard "*".
  - /analyze returns skipped_images so the frontend can inform users.
  - Structured logging replaces bare exceptions swallowed by HTTPException.
"""

import logging
import os
import uuid
from pathlib import Path
import tempfile
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agent.graph import food_analyzer
from agent.state import FoodAgentState, LanguageType

load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(name)s | %(message)s")

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

SUPPORTED_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}
SUPPORTED_LANGUAGES:  set[str] = {"english", "hindi", "hinglish"}
DEFAULT_LANGUAGE:     str      = "english"
MAX_UPLOAD_MB:        int      = int(os.getenv("MAX_UPLOAD_MB", "20"))
MAX_UPLOAD_BYTES:     int      = MAX_UPLOAD_MB * 1024 * 1024

# CORS — comma-separated list in env var; fallback to localhost for local dev
_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
CORS_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]


# ─────────────────────────────────────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Food Analyzer API",
    description="Backend API for the Food Analyzer application.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class AnalyzeResponse(BaseModel):
    """
    Response schema for POST /analyze.
    Field names mirror FoodAgentState — keep in sync with state.py.
    """
    # Product identity
    product_name:       Optional[str]  = Field(None, description="Product name extracted from label")
    brand:              Optional[str]  = Field(None, description="Brand name")
    fssai_number:       Optional[str]  = Field(None, description="FSSAI licence number if visible")

    # Analysis
    analysis_result:    Optional[dict] = Field(None, description="Full health verdict dict from analyze_food node")
    food_analysis:      Optional[dict] = Field(None, description="Legacy field: same as analysis_result")

    # Formatted output
    formatted_response: Optional[str]  = Field(None, description="Final multilingual user-facing briefing")
    final_response:     Optional[str]  = Field(None, description="Legacy field: same as formatted_response")

    # Debug / transparency
    raw_ocr_text:       Optional[str]  = Field(None, description="Raw OCR text extracted from images")
    skipped_images:     list[str]      = Field(default_factory=list, description="Filenames skipped by label guardrail")

    # Error
    error:              Optional[str]  = Field(None, description="Error message if analysis failed")


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _validate_language(raw: Optional[str]) -> LanguageType:
    """Normalise and validate language; fall back to default instead of erroring."""
    lang = (raw or DEFAULT_LANGUAGE).strip().lower()
    if lang not in SUPPORTED_LANGUAGES:
        logger.warning("Unsupported language '%s' — falling back to '%s'", lang, DEFAULT_LANGUAGE)
        return DEFAULT_LANGUAGE
    return lang  # type: ignore[return-value]


def _is_valid_upload(upload: UploadFile) -> bool:
    """
    Return True if the upload passes basic type checks.
    Validates both content-type (fast) and file extension (tamper-resistant).
    """
    content_type = upload.content_type or ""
    if not content_type.startswith("image/"):
        return False
    suffix = Path(upload.filename or "").suffix.lower()
    return suffix in SUPPORTED_EXTENSIONS


async def _save_upload_async(upload: UploadFile, tmp_dir: Path) -> Optional[str]:
    """
    Async-safe upload saver with size guard.

    Reads the file content with `await` (non-blocking), then writes to a
    uniquely named temp file. Returns the path, or None if the file exceeds
    MAX_UPLOAD_MB.
    """
    content = await upload.read()

    if len(content) > MAX_UPLOAD_BYTES:
        logger.warning(
            "Upload '%s' exceeds %d MB limit (%d bytes) — skipped",
            upload.filename, MAX_UPLOAD_MB, len(content),
        )
        return None

    safe_name = f"{uuid.uuid4().hex}_{Path(upload.filename or 'upload').name}"
    target    = tmp_dir / safe_name
    target.write_bytes(content)
    logger.debug("Saved upload: %s → %s", upload.filename, target)
    return str(target)


def _build_initial_state(image_paths: list[str], language: LanguageType, message: Optional[str]) -> FoodAgentState:
    """
    Build the minimal required initial state for the graph.

    Only Required fields are set here. Intermediate fields (extracted_nutrition,
    analysis_result, etc.) are intentionally omitted — nodes write them as they run.
    Pre-populating them risks masking bugs where a node fails silently and the
    caller sees a stale pre-populated value instead of None.
    """
    state: FoodAgentState = {
        "image_paths":  image_paths,
        "language":     language,
    }
    if message:
        state["user_message"] = message
    return state


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["infra"])
def health_check() -> dict[str, str]:
    """Liveness probe — no auth required."""
    return {"status": "ok", "service": "food-analyzer-backend"}


@app.post("/analyze", response_model=AnalyzeResponse, tags=["analysis"])
async def analyze_food_label(
    files:    list[UploadFile]  = File(...,  description="One or more food label images"),
    message:  Optional[str]     = Form(None, description="Optional user context"),
    language: Optional[str]     = Form(None, description="'english' | 'hindi' | 'hinglish'"),
) -> AnalyzeResponse:
    """
    Analyse food label image(s) and return a health verdict.

    - Accepts 1–N images (JPEG, PNG, WEBP, GIF, BMP).
    - Runs OCR → extraction → analysis → formatting via LangGraph.
    - Returns a structured health briefing in the requested language.
    """
    if not files:
        raise HTTPException(status_code=400, detail="Upload at least one image file.")

    lang = _validate_language(language)

    # ── Save valid uploads to a temporary directory ───────────────────────────
    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path    = Path(tmp_dir)
        image_paths: list[str] = []
        rejected_types: list[str] = []

        for upload in files:
            if not _is_valid_upload(upload):
                rejected_types.append(upload.filename or "unknown")
                logger.warning(
                    "Rejected file '%s' (content_type=%s)", upload.filename, upload.content_type
                )
                continue

            saved = await _save_upload_async(upload, tmp_path)
            if saved:
                image_paths.append(saved)

        if rejected_types:
            logger.info("Skipped %d non-image file(s): %s", len(rejected_types), rejected_types)

        if not image_paths:
            raise HTTPException(
                status_code=422,
                detail=(
                    "No valid image files could be processed. "
                    f"Accepted formats: {', '.join(sorted(SUPPORTED_EXTENSIONS))}. "
                    f"Max size: {MAX_UPLOAD_MB} MB per file."
                ),
            )

        logger.info(
            "Invoking food_analyzer — %d image(s), lang=%s", len(image_paths), lang
        )

        # ── Invoke graph ──────────────────────────────────────────────────────
        initial_state = _build_initial_state(image_paths, lang, message)

        try:
            result: dict[str, Any] = food_analyzer.invoke(initial_state)
        except Exception as exc:
            logger.exception("food_analyzer.invoke raised an unhandled exception")
            raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc

    # ── Build response (temp dir is now cleaned up) ───────────────────────────
    logger.info(
        "Analysis complete — verdict=%s error=%s",
        result.get("analysis_result", {}).get("overall_verdict") if result.get("analysis_result") else None,
        result.get("error"),
    )

    return AnalyzeResponse(
        product_name       = result.get("product_name"),
        brand              = result.get("brand"),
        fssai_number       = result.get("fssai_number"),
        analysis_result    = result.get("analysis_result"),
        food_analysis      = result.get("analysis_result"),
        formatted_response = result.get("formatted_response"),
        final_response     = result.get("formatted_response"),
        raw_ocr_text       = result.get("raw_ocr_text"),
        skipped_images     = result.get("skipped_images") or [],
        error              = result.get("error"),
    )