"""
Utility functions for image loading, encoding, and validation.
"""

import base64
import os
from pathlib import Path
from typing import Optional
from PIL import Image
import io


SUPPORTED_FORMATS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}
MAX_FILE_SIZE_MB = 20
MAX_DIMENSION = 4096


def load_image_as_base64(image_path: str) -> tuple[str, str]:
    """
    Load an image file and return (base64_string, media_type).
    Resizes if too large. Converts to JPEG for consistency.
    
    Returns:
        (base64_data, media_type) tuple
    
    Raises:
        ValueError: if file not found, not supported, or too large
    """
    path = Path(image_path)

    if not path.exists():
        raise ValueError(f"Image file not found: {image_path}")

    if path.suffix.lower() not in SUPPORTED_FORMATS:
        raise ValueError(
            f"Unsupported format '{path.suffix}'. "
            f"Supported: {', '.join(SUPPORTED_FORMATS)}"
        )

    file_size_mb = path.stat().st_size / (1024 * 1024)
    if file_size_mb > MAX_FILE_SIZE_MB:
        raise ValueError(f"File too large: {file_size_mb:.1f}MB (max {MAX_FILE_SIZE_MB}MB)")

    with Image.open(path) as img:
        # Convert to RGB (handles RGBA, palette mode, etc.)
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")

        # Resize if dimensions too large (keeps aspect ratio)
        if max(img.size) > MAX_DIMENSION:
            img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

        # Save to bytes as JPEG
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85)
        buffer.seek(0)
        image_bytes = buffer.read()

    b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
    return b64, "image/jpeg"


def validate_image_paths(paths: list[str]) -> list[str]:
    """Validate a list of image paths, return only valid ones with warnings."""
    valid = []
    for p in paths:
        try:
            path = Path(p)
            if not path.exists():
                print(f"⚠️  Skipping (not found): {p}")
                continue
            if path.suffix.lower() not in SUPPORTED_FORMATS:
                print(f"⚠️  Skipping (unsupported format): {p}")
                continue
            valid.append(p)
        except Exception as e:
            print(f"⚠️  Skipping {p}: {e}")
    return valid


def image_to_anthropic_block(image_path: str) -> dict:
    """
    Convert an image path to an Anthropic API image content block.
    
    Returns:
        dict compatible with Anthropic messages API
    """
    b64_data, media_type = load_image_as_base64(image_path)
    return {
        "type": "image",
        "source": {
            "type": "base64",
            "media_type": media_type,
            "data": b64_data,
        }
    }


def safe_json_parse(text: str) -> Optional[dict]:
    """
    Safely parse JSON from LLM output.
    Strips markdown fences if present.
    """
    import json
    
    # Strip markdown code fences
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        # Remove first line (```json or ```) and last line (```)
        cleaned = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
    
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        # Try to find JSON object in the text
        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(cleaned[start:end])
            except json.JSONDecodeError:
                pass
        return None
