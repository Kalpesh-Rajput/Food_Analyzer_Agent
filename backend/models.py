"""Pydantic models for API requests and responses."""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class AnalyzeRequest(BaseModel):
    """Request for food analysis."""
    image_base64: str
    user_message: Optional[str] = None


class NutritionData(BaseModel):
    """Structured nutrition information."""
    energy_kcal_per_100g: Optional[float] = None
    carbs_g: Optional[float] = None
    sugar_g: Optional[float] = None
    fat_g: Optional[float] = None
    saturated_fat_g: Optional[float] = None
    sodium_mg: Optional[float] = None
    protein_g: Optional[float] = None
    fiber_g: Optional[float] = None
    serving_size_g: Optional[float] = None


class IngredientsData(BaseModel):
    """Structured ingredients information."""
    ingredient_list: List[str] = []
    additives: List[str] = []
    allergens: List[str] = []
    preservatives: List[str] = []
    claims: List[str] = []  # Front-of-pack claims


class Insight(BaseModel):
    """Individual insight about the food."""
    icon: str  # 🟢, 🟡, 🔴
    text: str


class MisleadingClaim(BaseModel):
    """Detected misleading marketing claim."""
    claim: str  # e.g., "100% fruit"
    reality: str  # e.g., "Only 30% fruit, rest is sugar"
    severity: str  # "high", "medium", "low"


class AnalyzeResponse(BaseModel):
    """Response from food analysis."""
    verdict: str  # "Healthy", "Okay", "Unhealthy"
    score: str  # 🟢, 🟡, 🔴
    health_score: int  # 0-100
    product_name: str
    insights: List[Insight]
    nutrition: Optional[NutritionData] = None
    ingredients: Optional[IngredientsData] = None
    misleading_claims: List[MisleadingClaim] = []
    message: str  # Short, witty final message
    raw_ocr_text: Optional[str] = None  # For debugging
