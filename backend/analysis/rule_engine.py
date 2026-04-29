"""Rule-based health analysis engine (NOT LLM)."""

from typing import Dict, List, Tuple
from backend.models import NutritionData


class RuleEngine:
    """
    Deterministic rule engine for food health scoring.
    Uses facts, not subjective LLM judgments.
    """
    
    # Sugar conversion: 1 teaspoon = 4g
    SUGAR_PER_TEASPOON = 4
    
    # Daily limits (per serving)
    DAILY_SUGAR_LIMIT_G = 25  # WHO recommendation for added sugar
    DAILY_SODIUM_LIMIT_MG = 2300  # FDA recommendation
    DAILY_CALORIES_LIMIT = 2000  # Average adult
    
    def __init__(self):
        """Initialize rule engine."""
        pass
    
    def score_food(self, 
                  nutrition: Dict,
                  ingredients: Dict,
                  product_name: str = "") -> Tuple[str, int, List[str]]:
        """
        Score food based on rules.
        
        Args:
            nutrition: Nutrition facts dict
            ingredients: Ingredients analysis dict
            product_name: Product name (for context)
        
        Returns:
            Tuple of (verdict, score_0_100, insights)
        """
        
        score = 100  # Start perfect, deduct for problems
        insights = []
        penalties = []
        
        # ─── Sugar Analysis ─────────────────────────────────────────────────
        sugar_g = nutrition.get("sugar_g", 0)
        if sugar_g:
            sugar_tsp = round(sugar_g / self.SUGAR_PER_TEASPOON, 1)
            insights.append(f"Sugar: {sugar_g}g = {sugar_tsp} tsp")
            
            if sugar_g > 15:
                penalty = min(30, (sugar_g - 5) * 2)  # Heavy penalty
                score -= penalty
                penalties.append(f"High sugar ({sugar_g}g)")
            elif sugar_g > 5:
                penalty = (sugar_g - 5) * 1.5
                score -= penalty
                penalties.append(f"Moderate sugar ({sugar_g}g)")
        
        # ─── Sodium Analysis ────────────────────────────────────────────────
        sodium_mg = nutrition.get("sodium_mg", 0)
        if sodium_mg:
            insights.append(f"Sodium: {sodium_mg}mg")
            
            if sodium_mg > 500:
                penalty = min(25, (sodium_mg - 200) / 20)
                score -= penalty
                penalties.append(f"High sodium ({sodium_mg}mg)")
        
        # ─── Fat Analysis ───────────────────────────────────────────────────
        fat_g = nutrition.get("fat_g", 0)
        saturated_fat_g = nutrition.get("saturated_fat_g", 0)
        
        if saturated_fat_g:
            insights.append(f"Saturated fat: {saturated_fat_g}g")
            if saturated_fat_g > 5:
                penalty = min(20, (saturated_fat_g - 2) * 1.5)
                score -= penalty
                penalties.append(f"High saturated fat ({saturated_fat_g}g)")
        
        # ─── Protein Analysis ───────────────────────────────────────────────
        protein_g = nutrition.get("protein_g", 0)
        if protein_g and protein_g > 10:
            insights.append(f"✓ Good protein: {protein_g}g")
            score += 5  # Bonus for good protein
        
        # ─── Fiber Analysis ─────────────────────────────────────────────────
        fiber_g = nutrition.get("fiber_g", 0)
        if fiber_g and fiber_g > 3:
            insights.append(f"✓ Good fiber: {fiber_g}g")
            score += 5
        
        # ─── Ingredient Analysis ────────────────────────────────────────────
        harmful_count = ingredients.get("harmful", [])
        allergen_count = ingredients.get("allergens", [])
        additive_count = ingredients.get("additives", [])
        
        if harmful_count:
            penalty = len(harmful_count) * 10
            score -= penalty
            penalties.append(f"{len(harmful_count)} harmful ingredient(s)")
            for item in harmful_count:
                insights.append(f"🚨 {item['name']}: {item.get('warning', '')}")
        
        if allergen_count:
            penalty = len(allergen_count) * 5
            score -= penalty
            for item in allergen_count:
                insights.append(f"⚠️  {item['warning']}")
        
        if additive_count:
            high_risk = [a for a in additive_count if a.get("risk") == "high"]
            if high_risk:
                penalty = len(high_risk) * 8
                score -= penalty
                for item in high_risk:
                    insights.append(f"⚠️  {item.get('name', '')}: {item.get('warning', '')}")
        
        # ─── Ultra-processed check ──────────────────────────────────────────
        total_additives = len(harmful_count) + len(additive_count)
        if total_additives > 5:
            score -= 20
            penalties.append("Ultra-processed (many additives)")
            insights.append("🚨 This is basically industrial food")
        
        # ─── Final scoring ──────────────────────────────────────────────────
        score = max(0, min(100, score))  # Clamp 0-100
        
        if score >= 70:
            verdict = "Healthy"
            emoji = "🟢"
        elif score >= 50:
            verdict = "Okay"
            emoji = "🟡"
        else:
            verdict = "Unhealthy"
            emoji = "🔴"
        
        return verdict, score, insights
    
    def get_calorie_comparison(self, calories: float) -> str:
        """Get witty calorie comparison."""
        if not calories:
            return ""
        
        if calories < 50:
            return "Basically just air"
        elif calories < 150:
            return "A light snack"
        elif calories < 300:
            return "Quarter of daily calories"
        elif calories < 500:
            return "About a quarter meal"
        else:
            return "Heavy stuff - basically a meal"
    
    def get_sugar_comparison(self, sugar_g: float) -> str:
        """Convert sugar to relatable comparison."""
        if not sugar_g:
            return ""
        
        teaspoons = sugar_g / self.SUGAR_PER_TEASPOON
        return f"{teaspoons:.1f} tsp of sugar"
    
    def get_sodium_comparison(self, sodium_mg: float) -> str:
        """Convert sodium to percentage of daily limit."""
        if not sodium_mg:
            return ""
        
        percent = (sodium_mg / self.DAILY_SODIUM_LIMIT_MG) * 100
        return f"{percent:.0f}% of daily sodium limit"
