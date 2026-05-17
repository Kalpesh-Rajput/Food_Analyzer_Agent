# """
# Utility functions for image loading, encoding, and validation.
# """

# import base64
# import os
# from pathlib import Path
# from typing import Optional, List
# from PIL import Image, ImageEnhance, ImageFilter
# import io


# SUPPORTED_FORMATS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}
# MAX_FILE_SIZE_MB = 20
# MAX_DIMENSION = 4096


# def _load_ocr_dependencies():
#     try:
#         import numpy as np
#         import cv2
#         import easyocr
#     except ImportError as exc:
#         raise ImportError(
#             "OCR dependencies are missing. Install them with: "
#             "pip install easyocr opencv-python-headless numpy"
#         ) from exc

#     return easyocr, cv2, np


# def _get_ocr_languages(language: str) -> list[str]:
#     language = language.strip().lower() if language else "english"
#     if language == "hindi":
#         return ["hi"]
#     if language == "hinglish":
#         return ["en", "hi"]
#     return ["en"]


# def _enhance_image_for_ocr(image_path: str, cv2, np) -> np.ndarray:
#     """Load and enhance an image for OCR with contrast, sharpening, and denoising."""
#     img = cv2.imdecode(np.fromfile(image_path, dtype=np.uint8), cv2.IMREAD_COLOR)
#     if img is None:
#         raise ValueError(f"Could not open image for OCR: {image_path}")

#     # Resize large images for better OCR performance.
#     height, width = img.shape[:2]
#     max_dim = max(width, height)
#     if max_dim > 1800:
#         scale = 1800 / max_dim
#         img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)

#     gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
#     sharpen_kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
#     sharpened = cv2.filter2D(gray, -1, sharpen_kernel)
#     denoised = cv2.fastNlMeansDenoising(sharpened, h=12, templateWindowSize=7, searchWindowSize=21)
#     clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
#     enhanced = clahe.apply(denoised)

#     return enhanced


# def _run_easyocr(image_array, language_codes: list[str], easyocr):
#     reader = easyocr.Reader(language_codes, gpu=False, verbose=False)
#     results = reader.readtext(image_array, detail=0, paragraph=True)
#     return [line.strip() for line in results if line and line.strip()]


# def extract_text_from_images(image_paths: list[str], language: str = "english") -> str:
#     """Run OCR on one or more images using EasyOCR with preprocessing.

#     Returns a combined text block for all images.
#     """
#     easyocr, cv2, np = _load_ocr_dependencies()
#     language_codes = _get_ocr_languages(language)

#     all_texts: List[str] = []
#     for path in image_paths:
#         if not Path(path).exists():
#             continue

#         print(f"   🔧 OCR preprocessing image: {path}")
#         original_img = cv2.imdecode(np.fromfile(path, dtype=np.uint8), cv2.IMREAD_COLOR)
#         if original_img is None:
#             print(f"   ⚠️  Skipping unreadable image: {path}")
#             continue

#         enhanced_img = _enhance_image_for_ocr(path, cv2, np)

#         original_text = _run_easyocr(original_img, language_codes, easyocr)
#         enhanced_text = _run_easyocr(enhanced_img, language_codes, easyocr)

#         chosen_text = original_text if len("\n".join(original_text)) >= len("\n".join(enhanced_text)) else enhanced_text
#         if not chosen_text:
#             chosen_text = enhanced_text or original_text

#         if chosen_text:
#             image_block = [f"--- IMAGE: {Path(path).name} ---"]
#             image_block.extend(chosen_text)
#             all_texts.append("\n".join(image_block))

#     return "\n\n".join(all_texts)


# def detect_valid_label_images(image_paths: list[str], language: str = "english", min_chars: int = 30, min_lines: int = 2) -> dict:
#     """Run OCR per image and detect whether the image likely contains a food label
#     (nutrition facts, ingredient list, or product text).

#     Returns a dict with keys:
#       - valid: list of image paths considered valid
#       - invalid: list of {path, reason}
#       - texts: mapping path -> extracted text (may be empty)
#     """
#     easyocr, cv2, np = _load_ocr_dependencies()
#     language_codes = _get_ocr_languages(language)

#     guard_keywords = [
#         "ingredient",
#         "ingredients",
#         "ingredients:",
#         "nutrition",
#         "nutrition facts",
#         "nutrition information",
#         "per 100",
#         "per serving",
#         "energy",
#         "calories",
#         "kcal",
#         "protein",
#         "fat",
#         "saturated",
#         "trans",
#         "sodium",
#         "mg",
#         "sugar",
#         "carbohydrate",
#         "carbohydrates",
#         "serving",
#         "serving size",
#     ]

#     # Add some common Hindi keywords for labels
#     hindi_keywords = ["घटक", "सामग्री", "पोषण", "पोषण तथ्य", "per", "सेवा"]
#     if language and language.strip().lower() in ("hindi", "hinglish"):
#         guard_keywords.extend(hindi_keywords)

#     valid = []
#     invalid = []
#     texts = {}

#     for path in image_paths:
#         p = Path(path)
#         if not p.exists():
#             invalid.append({"path": path, "reason": "file not found"})
#             texts[path] = ""
#             continue

#         try:
#             img = cv2.imdecode(np.fromfile(path, dtype=np.uint8), cv2.IMREAD_COLOR)
#             if img is None:
#                 invalid.append({"path": path, "reason": "unreadable image"})
#                 texts[path] = ""
#                 continue

#             enhanced = _enhance_image_for_ocr(path, cv2, np)

#             # Run OCR on both original and enhanced images and combine results
#             orig_lines = _run_easyocr(img, language_codes, easyocr)
#             enh_lines = _run_easyocr(enhanced, language_codes, easyocr)
#             # Merge keeping order but dedupe similar lines
#             combined = []
#             for ln in orig_lines + enh_lines:
#                 s = ln.strip()
#                 if not s:
#                     continue
#                 if not any(s == ex for ex in combined):
#                     combined.append(s)

#             lines = combined
#             text = "\n".join(lines).strip()
#             texts[path] = text

#             char_count = len(text)
#             line_count = len([l for l in lines if len(l.strip()) > 2])
#             lower = text.lower()

#             # Numeric/unit pattern detection (e.g., '10 g', '100mg', '250 kcal', '30%')
#             import re

#             unit_pattern = re.search(r"\d+[\d\.,]*\s*(g|mg|kcal|kj|%|ml|serving|servings|teaspoon|tbsp)", lower)

#             has_keyword = any(k in lower for k in guard_keywords)

#             reasons = []
#             if char_count < min_chars:
#                 reasons.append(f"too little text ({char_count} chars)")
#             if line_count < min_lines:
#                 reasons.append(f"insufficient lines ({line_count})")
#             if not has_keyword and not unit_pattern:
#                 reasons.append("missing label keywords or numeric nutrition patterns")

#             # Relaxation: if numeric/unit patterns are present and minimal text exists, accept as valid
#             if not reasons or (unit_pattern and char_count >= max(12, int(min_chars / 2))):
#                 valid.append(path)
#             else:
#                 invalid.append({"path": path, "reason": ", ".join(reasons)})

#         except Exception as e:
#             invalid.append({"path": path, "reason": f"ocr error: {e}"})
#             texts[path] = ""

#     return {"valid": valid, "invalid": invalid, "texts": texts}


# def load_image_as_base64(image_path: str) -> tuple[str, str]:
#     """
#     Load an image file and return (base64_string, media_type).
#     Resizes if too large. Converts to JPEG for consistency.
    
#     Returns:
#         (base64_data, media_type) tuple
    
#     Raises:
#         ValueError: if file not found, not supported, or too large
#     """
#     path = Path(image_path)

#     if not path.exists():
#         raise ValueError(f"Image file not found: {image_path}")

#     if path.suffix.lower() not in SUPPORTED_FORMATS:
#         raise ValueError(
#             f"Unsupported format '{path.suffix}'. "
#             f"Supported: {', '.join(SUPPORTED_FORMATS)}"
#         )

#     file_size_mb = path.stat().st_size / (1024 * 1024)
#     if file_size_mb > MAX_FILE_SIZE_MB:
#         raise ValueError(f"File too large: {file_size_mb:.1f}MB (max {MAX_FILE_SIZE_MB}MB)")

#     with Image.open(path) as img:
#         # Convert to RGB (handles RGBA, palette mode, etc.)
#         if img.mode not in ("RGB", "L"):
#             img = img.convert("RGB")

#         # Resize if dimensions too large (keeps aspect ratio)
#         if max(img.size) > MAX_DIMENSION:
#             img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

#         # Save to bytes as JPEG
#         buffer = io.BytesIO()
#         img.save(buffer, format="JPEG", quality=85)
#         buffer.seek(0)
#         image_bytes = buffer.read()

#     b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
#     return b64, "image/jpeg"


# def validate_image_paths(paths: list[str]) -> list[str]:
#     """Validate a list of image paths, return only valid ones with warnings."""
#     valid = []
#     for p in paths:
#         try:
#             path = Path(p)
#             if not path.exists():
#                 print(f"⚠️  Skipping (not found): {p}")
#                 continue
#             if path.suffix.lower() not in SUPPORTED_FORMATS:
#                 print(f"⚠️  Skipping (unsupported format): {p}")
#                 continue
#             valid.append(p)
#         except Exception as e:
#             print(f"⚠️  Skipping {p}: {e}")
#     return valid


# def image_to_anthropic_block(image_path: str) -> dict:
#     """
#     Convert an image path to an Anthropic API image content block.
    
#     Returns:
#         dict compatible with Anthropic messages API
#     """
#     b64_data, media_type = load_image_as_base64(image_path)
#     return {
#         "type": "image",
#         "source": {
#             "type": "base64",
#             "media_type": media_type,
#             "data": b64_data,
#         }
#     }


# def safe_json_parse(text: str) -> Optional[dict]:
#     """
#     Safely parse JSON from LLM output.
#     Strips markdown fences if present.
#     """
#     import json
    
#     # Strip markdown code fences
#     cleaned = text.strip()
#     if cleaned.startswith("```"):
#         lines = cleaned.split("\n")
#         # Remove first line (```json or ```) and last line (```)
#         cleaned = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
    
#     try:
#         return json.loads(cleaned)
#     except json.JSONDecodeError as e:
#         # Try to find JSON object in the text
#         start = cleaned.find("{")
#         end = cleaned.rfind("}") + 1
#         if start != -1 and end > start:
#             try:
#                 return json.loads(cleaned[start:end])
#             except json.JSONDecodeError:
#                 pass
#         return None



# new code 


"""
Utility functions for image loading, encoding, preprocessing, OCR, and validation.

Performance notes:
  - EasyOCR Reader is a module-level singleton per (language_codes, gpu) pair.
    Loading the model takes ~2-3 s and ~150 MB RAM. Caching it means the cost
    is paid once per process, not once per image.
  - OCR results are cached per (absolute_path, mtime) so detect_valid_label_images
    and extract_text_from_images never re-process the same file in the same run.
  - All imports that were previously inside functions (re, json) are now module-level.
  - EXIF orientation is corrected before any processing — critical for phone photos.
"""

import base64
import io
import json
import logging
import re
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

from PIL import Image, ImageOps

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────

SUPPORTED_FORMATS  = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}
MAX_FILE_SIZE_MB   = 20
MAX_DIMENSION      = 4096
OCR_MAX_DIMENSION  = 1800   # resize ceiling before sending to EasyOCR

# Keywords that signal a food label is present
_LABEL_KEYWORDS_EN = frozenset([
    "ingredient", "ingredients", "nutrition", "nutrition facts",
    "nutrition information", "per 100", "per serving", "energy",
    "calories", "kcal", "protein", "fat", "saturated", "trans",
    "sodium", "sugar", "carbohydrate", "carbohydrates", "serving",
    "serving size", "dietary fibre", "fiber", "added sugar",
])
_LABEL_KEYWORDS_HI = frozenset([
    "घटक", "सामग्री", "पोषण", "पोषण तथ्य", "सेवा",
])

# Regex compiled once at import — matches nutrition unit patterns e.g. "10 g", "250kcal"
_UNIT_PATTERN = re.compile(
    r"\d[\d.,]*\s*(g|mg|kcal|kj|%|ml|serving|servings|teaspoon|tbsp)",
    re.IGNORECASE,
)


# ─────────────────────────────────────────────────────────────────────────────
# LAZY DEPENDENCY LOADER
# cv2 / easyocr / numpy are only imported when actually needed.
# Raises a helpful error if not installed.
# ─────────────────────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _load_cv2_numpy():
    """Return (cv2, numpy). Cached after first import."""
    try:
        import cv2
        import numpy as np
        return cv2, np
    except ImportError as exc:
        raise ImportError(
            "OpenCV / NumPy are missing. Install with: "
            "pip install opencv-python-headless numpy"
        ) from exc


@lru_cache(maxsize=1)
def _load_easyocr():
    """Return the easyocr module. Cached after first import."""
    try:
        import easyocr
        return easyocr
    except ImportError as exc:
        raise ImportError(
            "EasyOCR is missing. Install with: pip install easyocr"
        ) from exc


# ─────────────────────────────────────────────────────────────────────────────
# EASYOCR READER CACHE
# One Reader per (language_codes_tuple, gpu) pair.
# Creating a Reader loads ~150 MB of model weights — do it once.
# ─────────────────────────────────────────────────────────────────────────────

_reader_cache: dict[tuple, Any] = {}


def _get_reader(language_codes: tuple[str, ...], gpu: bool = False):
    """
    Return a cached EasyOCR Reader for the given language set.
    Thread-safe enough for single-process LangGraph use.
    """
    key = (language_codes, gpu)
    if key not in _reader_cache:
        logger.info("Initialising EasyOCR Reader for languages=%s (first call)", language_codes)
        easyocr = _load_easyocr()
        _reader_cache[key] = easyocr.Reader(list(language_codes), gpu=gpu, verbose=False)
    return _reader_cache[key]


# ─────────────────────────────────────────────────────────────────────────────
# OCR RESULT CACHE
# Keyed by (absolute_path, file_mtime_ns) — invalidated automatically if
# the file changes on disk.
# ─────────────────────────────────────────────────────────────────────────────

_ocr_cache: dict[tuple, list[str]] = {}


def _cache_key(path: str) -> tuple:
    p = Path(path)
    return (str(p.resolve()), p.stat().st_mtime_ns)


# ─────────────────────────────────────────────────────────────────────────────
# LANGUAGE HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _get_ocr_language_codes(language: str) -> tuple[str, ...]:
    lang = (language or "english").strip().lower()
    if lang == "hindi":
        return ("hi",)
    if lang == "hinglish":
        return ("en", "hi")
    return ("en",)


def _get_label_keywords(language: str) -> frozenset[str]:
    lang = (language or "english").strip().lower()
    if lang == "hindi":
        return _LABEL_KEYWORDS_HI
    if lang == "hinglish":
        return _LABEL_KEYWORDS_EN | _LABEL_KEYWORDS_HI
    return _LABEL_KEYWORDS_EN


# ─────────────────────────────────────────────────────────────────────────────
# IMAGE PREPROCESSING
# ─────────────────────────────────────────────────────────────────────────────

def _fix_exif_orientation(pil_image: Image.Image) -> Image.Image:
    """
    Correct rotation/flip based on EXIF orientation tag.
    Critical for phone photos — without this, portrait images arrive rotated 90°.
    """
    return ImageOps.exif_transpose(pil_image)


def _pil_to_cv2(pil_image: Image.Image):
    """Convert an RGB PIL Image to a BGR NumPy array for OpenCV."""
    cv2, np = _load_cv2_numpy()
    rgb = pil_image.convert("RGB")
    return cv2.cvtColor(np.array(rgb), cv2.COLOR_RGB2BGR)


def _resize_for_ocr(img, cv2, np):
    """Downscale to OCR_MAX_DIMENSION on the longest edge (preserves aspect ratio)."""
    h, w = img.shape[:2]
    longest = max(h, w)
    if longest <= OCR_MAX_DIMENSION:
        return img
    scale = OCR_MAX_DIMENSION / longest
    return cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)


def _enhance_for_ocr(bgr_img):
    """
    Return an enhanced grayscale image optimised for text recognition.
    Pipeline: resize → grayscale → sharpen → denoise → CLAHE contrast.
    """
    cv2, np = _load_cv2_numpy()

    img = _resize_for_ocr(bgr_img, cv2, np)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Unsharp mask (sharpen edges without amplifying noise)
    blur = cv2.GaussianBlur(gray, (0, 0), sigmaX=2)
    sharpened = cv2.addWeighted(gray, 1.5, blur, -0.5, 0)

    # Non-local means denoising
    denoised = cv2.fastNlMeansDenoising(
        sharpened, h=10, templateWindowSize=7, searchWindowSize=21
    )

    # CLAHE — local contrast enhancement (helps uneven lighting from phone photos)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    return clahe.apply(denoised)


def _adaptive_threshold(gray_img):
    """
    Alternative enhancement: binarise with adaptive thresholding.
    Works well on high-contrast labels; use alongside CLAHE for voting.
    """
    cv2, _ = _load_cv2_numpy()
    return cv2.adaptiveThreshold(
        gray_img, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, blockSize=15, C=8,
    )


# ─────────────────────────────────────────────────────────────────────────────
# CORE OCR RUNNER
# ─────────────────────────────────────────────────────────────────────────────

def _run_ocr_on_array(img_array, language_codes: tuple[str, ...]) -> list[str]:
    """Run EasyOCR on a NumPy array and return cleaned text lines."""
    reader = _get_reader(language_codes)
    results = reader.readtext(img_array, detail=0, paragraph=True)
    return [line.strip() for line in results if line and line.strip()]


def _deduplicate_lines(lines: list[str]) -> list[str]:
    """
    Remove duplicate lines while preserving order.
    Uses a set for O(1) lookup instead of the original O(n²) any() loop.
    """
    seen: set[str] = set()
    out: list[str] = []
    for line in lines:
        s = line.strip()
        if s and s not in seen:
            seen.add(s)
            out.append(s)
    return out


def _ocr_image_file(path: str, language_codes: tuple[str, ...]) -> list[str]:
    """
    Full OCR pipeline for a single image file.
    Runs on both CLAHE-enhanced and original arrays; picks the richer result.
    Result is cached by (path, mtime).
    """
    cache_key = (*_cache_key(path), language_codes)
    if cache_key in _ocr_cache:
        logger.debug("OCR cache hit: %s", path)
        return _ocr_cache[cache_key]

    cv2, np = _load_cv2_numpy()

    # Load via PIL first so we get EXIF correction for free
    try:
        with Image.open(path) as pil_img:
            pil_img = _fix_exif_orientation(pil_img)
            bgr = _pil_to_cv2(pil_img)
    except Exception as exc:
        logger.warning("Could not open %s via PIL: %s", path, exc)
        _ocr_cache[cache_key] = []
        return []

    # Build two candidate arrays
    enhanced  = _enhance_for_ocr(bgr)
    resized   = _resize_for_ocr(bgr, cv2, np)   # colour original, just resized

    lines_enh  = _run_ocr_on_array(enhanced, language_codes)
    lines_orig = _run_ocr_on_array(resized,  language_codes)

    # Merge: take whichever produced more content, then dedup the union
    if len("\n".join(lines_orig)) >= len("\n".join(lines_enh)):
        merged = lines_orig + [l for l in lines_enh if l not in set(lines_orig)]
    else:
        merged = lines_enh + [l for l in lines_orig if l not in set(lines_enh)]

    result = _deduplicate_lines(merged)
    _ocr_cache[cache_key] = result
    logger.debug("OCR done: %s → %d lines", Path(path).name, len(result))
    return result


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC API — OCR
# ─────────────────────────────────────────────────────────────────────────────

def extract_text_from_images(image_paths: list[str], language: str = "english") -> str:
    """
    Run OCR on one or more images. Returns a single combined text block.

    Each image's text is wrapped in a named block:
        --- IMAGE: filename.jpg ---
        ...extracted text...

    Results are cached — calling this after detect_valid_label_images on the
    same files costs zero additional OCR time.
    """
    language_codes = _get_ocr_language_codes(language)
    blocks: list[str] = []

    for path in image_paths:
        if not Path(path).exists():
            logger.warning("extract_text_from_images: file not found — %s", path)
            continue

        logger.info("Running OCR: %s", Path(path).name)
        lines = _ocr_image_file(path, language_codes)

        if lines:
            block = f"--- IMAGE: {Path(path).name} ---\n" + "\n".join(lines)
            blocks.append(block)
        else:
            logger.warning("No text extracted from: %s", Path(path).name)

    return "\n\n".join(blocks)


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC API — LABEL DETECTION / VALIDATION
# ─────────────────────────────────────────────────────────────────────────────

def detect_valid_label_images(
    image_paths: list[str],
    language: str = "english",
    min_chars: int = 30,
    min_lines: int = 2,
) -> dict[str, Any]:
    """
    OCR each image and decide whether it looks like a food label.

    Validation criteria (any one is sufficient to pass):
      1. Contains at least one known label keyword AND min_chars / min_lines.
      2. Contains a nutrition unit pattern (e.g. "10 g", "250 kcal") AND min_chars ÷ 2.

    Returns a dict:
        {
          "valid":   ["/path/to/good.jpg", ...],
          "invalid": [{"path": "...", "reason": "..."}, ...],
          "texts":   {"/path/to/img.jpg": "extracted text", ...},
        }

    OCR results are shared with extract_text_from_images via the module cache —
    no image is ever OCR-processed twice.
    """
    language_codes = _get_ocr_language_codes(language)
    keywords       = _get_label_keywords(language)

    valid:   list[str]  = []
    invalid: list[dict] = []
    texts:   dict[str, str] = {}

    for path in image_paths:
        p = Path(path)

        if not p.exists():
            invalid.append({"path": path, "reason": "file not found"})
            texts[path] = ""
            continue

        try:
            lines = _ocr_image_file(path, language_codes)
        except Exception as exc:
            logger.exception("OCR error on %s", path)
            invalid.append({"path": path, "reason": f"OCR error: {exc}"})
            texts[path] = ""
            continue

        text  = "\n".join(lines).strip()
        lower = text.lower()
        texts[path] = text

        char_count  = len(text)
        line_count  = sum(1 for l in lines if len(l.strip()) > 2)
        has_keyword = any(kw in lower for kw in keywords)
        unit_match  = bool(_UNIT_PATTERN.search(lower))

        reasons: list[str] = []

        if char_count < min_chars:
            reasons.append(f"too little text ({char_count} chars, need {min_chars})")
        if line_count < min_lines:
            reasons.append(f"too few lines ({line_count}, need {min_lines})")
        if not has_keyword and not unit_match:
            reasons.append("no label keywords or numeric nutrition patterns found")

        # Relaxation: numeric unit pattern + half the char threshold → still valid
        relaxed_pass = unit_match and char_count >= max(12, min_chars // 2)

        if not reasons or relaxed_pass:
            valid.append(path)
            logger.info(
                "Valid label: %s (%d chars, %d lines, keyword=%s, unit=%s)",
                p.name, char_count, line_count, has_keyword, unit_match,
            )
        else:
            invalid.append({"path": path, "reason": "; ".join(reasons)})
            logger.warning("Invalid label: %s — %s", p.name, "; ".join(reasons))

    logger.info(
        "detect_valid_label_images: %d valid, %d invalid out of %d",
        len(valid), len(invalid), len(image_paths),
    )
    return {"valid": valid, "invalid": invalid, "texts": texts}


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC API — IMAGE LOADING / ENCODING
# ─────────────────────────────────────────────────────────────────────────────

def load_image_as_base64(image_path: str) -> tuple[str, str]:
    """
    Load, EXIF-correct, resize-if-needed, and base64-encode an image.

    Returns:
        (base64_string, media_type)  — always JPEG for consistency.

    Raises:
        ValueError: file not found / unsupported format / too large.
    """
    path = Path(image_path)

    if not path.exists():
        raise ValueError(f"Image file not found: {image_path}")

    if path.suffix.lower() not in SUPPORTED_FORMATS:
        raise ValueError(
            f"Unsupported format '{path.suffix}'. "
            f"Supported: {', '.join(sorted(SUPPORTED_FORMATS))}"
        )

    file_size_mb = path.stat().st_size / (1024 * 1024)
    if file_size_mb > MAX_FILE_SIZE_MB:
        raise ValueError(
            f"File too large: {file_size_mb:.1f} MB (max {MAX_FILE_SIZE_MB} MB)"
        )

    with Image.open(path) as img:
        img = _fix_exif_orientation(img)

        # Normalise colour mode
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")

        # Resize if oversized
        if max(img.size) > MAX_DIMENSION:
            img = img.copy()
            img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85, optimize=True)
        buffer.seek(0)
        image_bytes = buffer.read()

    b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
    logger.debug("Encoded %s → %d bytes base64", path.name, len(b64))
    return b64, "image/jpeg"


def validate_image_paths(paths: list[str]) -> list[str]:
    """
    Filter a list of paths to only those that are readable image files.
    Logs a warning for each rejected path.
    """
    valid: list[str] = []
    for p in paths:
        try:
            path = Path(p)
            if not path.exists():
                logger.warning("Skipping (not found): %s", p)
                continue
            if path.suffix.lower() not in SUPPORTED_FORMATS:
                logger.warning("Skipping (unsupported format '%s'): %s", path.suffix, p)
                continue
            valid.append(p)
        except Exception as exc:
            logger.warning("Skipping %s: %s", p, exc)
    return valid


def image_to_anthropic_block(image_path: str) -> dict:
    """
    Convert an image path to an Anthropic Messages API content block.

    Returns:
        {"type": "image", "source": {"type": "base64", "media_type": ..., "data": ...}}
    """
    b64_data, media_type = load_image_as_base64(image_path)
    return {
        "type": "image",
        "source": {
            "type":       "base64",
            "media_type": media_type,
            "data":       b64_data,
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC API — JSON PARSING
# ─────────────────────────────────────────────────────────────────────────────

def safe_json_parse(text: str) -> Optional[dict]:
    """
    Robustly extract a JSON object from LLM output.

    Strategy (in order):
      1. Strip markdown code fences (```json … ```) and parse directly.
      2. Find the outermost { … } span using a brace-counter and parse that.
      3. Return None if all attempts fail.

    This handles the three most common LLM output styles:
      - Clean JSON
      - JSON wrapped in ```json … ``` fences
      - JSON preceded/followed by explanation text
    """
    if not text:
        return None

    # ── Step 1: strip markdown fences ─────────────────────────────────────────
    cleaned = text.strip()
    fence_match = re.match(r"^```(?:json)?\s*\n?(.*?)\n?```$", cleaned, re.DOTALL)
    if fence_match:
        cleaned = fence_match.group(1).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # ── Step 2: brace-counter extraction ──────────────────────────────────────
    # Finds the first '{' and walks forward counting braces to find the matching '}'.
    # More reliable than rfind('}') on nested JSON.
    start = cleaned.find("{")
    if start == -1:
        logger.warning("safe_json_parse: no opening brace found in LLM output")
        return None

    depth = 0
    in_string = False
    escape_next = False

    for i, ch in enumerate(cleaned[start:], start=start):
        if escape_next:
            escape_next = False
            continue
        if ch == "\\" and in_string:
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                candidate = cleaned[start : i + 1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError as exc:
                    logger.warning("safe_json_parse: brace-extracted JSON invalid — %s", exc)
                    return None

    logger.warning("safe_json_parse: unmatched braces in LLM output")
    return None