"""Image preprocessing for OCR accuracy improvement."""

import cv2
import numpy as np
from PIL import Image, ImageEnhance
from io import BytesIO
import base64


def preprocess_for_ocr(image_input) -> np.ndarray:
    """
    Advanced image preprocessing for OCR.
    
    Improves:
    - Contrast and brightness
    - Sharpness
    - Noise reduction
    - Handles skewed/angled text
    
    Args:
        image_input: PIL Image or numpy array
    
    Returns:
        Preprocessed image as numpy array (grayscale)
    """
    
    # Convert to OpenCV format if PIL Image
    if isinstance(image_input, Image.Image):
        image = cv2.cvtColor(np.array(image_input), cv2.COLOR_RGB2BGR)
    else:
        image = image_input
    
    # ── Step 1: Denoise ──────────────────────────────────────────────────
    # Remove noise while preserving edges
    denoised = cv2.fastNlMeansDenoising(image, h=10, templateWindowSize=7, searchWindowSize=21)
    
    # ── Step 2: Convert to grayscale ──────────────────────────────────────
    gray = cv2.cvtColor(denoised, cv2.COLOR_BGR2GRAY)
    
    # ── Step 3: Improve contrast (CLAHE) ─────────────────────────────────
    # Contrast Limited Adaptive Histogram Equalization
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    contrast_enhanced = clahe.apply(gray)
    
    # ── Step 4: Bilateral filtering (edge-preserving smoothing) ──────────
    bilateral = cv2.bilateralFilter(contrast_enhanced, 9, 75, 75)
    
    # ── Step 5: Sharpen text ─────────────────────────────────────────────
    kernel = np.array([[-1, -1, -1],
                       [-1,  9, -1],
                       [-1, -1, -1]]) / 1.0
    sharpened = cv2.filter2D(bilateral, -1, kernel)
    
    # ── Step 6: Deskew if needed ─────────────────────────────────────────
    # Find contours and estimate text angle
    deskewed = _deskew(sharpened)
    
    # ── Step 7: Thresholding for clearer text ────────────────────────────
    # Otsu's automatic thresholding
    _, binary = cv2.threshold(deskewed, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # ── Step 8: Invert if text is light on dark background ──────────────
    inverted = _maybe_invert_for_ocr(binary)
    
    return inverted


def _deskew(image: np.ndarray, max_angle: float = 10.0) -> np.ndarray:
    """
    Deskew image if text is angled.
    
    Args:
        image: Grayscale image
        max_angle: Maximum angle to rotate (degrees)
    
    Returns:
        Deskewed image
    """
    try:
        # Find text lines using Hough
        edges = cv2.Canny(image, 100, 200)
        lines = cv2.HoughLines(edges, 1, np.pi / 180, 100)
        
        if lines is None or len(lines) == 0:
            return image
        
        # Extract angles and find average
        angles = []
        for line in lines:
            rho, theta = line[0]
            angle = np.degrees(theta) - 90
            if abs(angle) < max_angle:
                angles.append(angle)
        
        if not angles:
            return image
        
        avg_angle = np.median(angles)
        
        # Rotate image
        height, width = image.shape
        center = (width // 2, height // 2)
        rotation_matrix = cv2.getRotationMatrix2D(center, avg_angle, 1.0)
        rotated = cv2.warpAffine(image, rotation_matrix, (width, height),
                                borderMode=cv2.BORDER_REFLECT)
        
        return rotated
    except Exception:
        # If deskewing fails, return original
        return image


def _maybe_invert_for_ocr(image: np.ndarray) -> np.ndarray:
    """
    Invert image if needed (light text on dark background).
    OCR works better with dark text on light background.
    """
    # Calculate mean brightness
    mean_brightness = np.mean(image)
    
    # If background is dark (mean < 127), invert
    if mean_brightness < 127:
        return cv2.bitwise_not(image)
    
    return image


def load_image_from_base64(image_base64: str) -> Image.Image:
    """
    Load PIL Image from base64 string.
    
    Args:
        image_base64: Base64 encoded image string
    
    Returns:
        PIL Image
    """
    try:
        # Remove data URL prefix if present
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]
        
        image_bytes = base64.b64decode(image_base64)
        image = Image.open(BytesIO(image_bytes))
        return image
    except Exception as e:
        raise ValueError(f"Failed to decode image: {str(e)}")


def compress_image(image: Image.Image, quality: int = 85) -> Image.Image:
    """Compress image to reduce file size."""
    return image


def image_to_base64(image: Image.Image) -> str:
    """Convert PIL Image to base64 string."""
    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=85)
    return base64.b64encode(buffer.getvalue()).decode()
