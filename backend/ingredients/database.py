"""Ingredient database with health risk assessment."""

from typing import Dict, List, Optional
import json


class IngredientDatabase:
    """
    Structured database of ingredients with health profiles.
    """
    
    def __init__(self):
        """Initialize ingredient database."""
        self.additives = self._load_additives()
        self.harmful_ingredients = self._load_harmful()
        self.warnings = self._load_warnings()
    
    def _load_additives(self) -> Dict:
        """Common food additives (E-numbers, INS)."""
        return {
            "e102": {"name": "Tartrazine", "risk": "high", "warning": "Artificial dye, may cause hyperactivity"},
            "e110": {"name": "Sunset Yellow", "risk": "high", "warning": "Artificial dye"},
            "e129": {"name": "Allura Red", "risk": "high", "warning": "Artificial dye"},
            "e150d": {"name": "Caramel IV", "risk": "medium", "warning": "May contain ammonia compounds"},
            "e621": {"name": "MSG", "risk": "medium", "warning": "Excitotoxin, may cause reactions"},
            "e322": {"name": "Lecithin", "risk": "low", "warning": "Often GMO derived"},
            "e330": {"name": "Citric acid", "risk": "low", "warning": "Generally safe"},
            "e631": {"name": "Guanosinate", "risk": "medium", "warning": "Excitotoxin-related"},
            "e635": {"name": "Disodium 5'-ribonucleotide", "risk": "medium", "warning": "Flavor enhancer"},
            "bht": {"name": "Butylated hydroxytoluene", "risk": "high", "warning": "Preservative, linked to cancer"},
            "bha": {"name": "Butylated hydroxyanisole", "risk": "high", "warning": "Preservative, likely carcinogen"},
        }
    
    def _load_harmful(self) -> Dict:
        """Harmful ingredients to watch for."""
        return {
            "sugar": {"risk": "high", "warning": "Excessive added sugar increases obesity/diabetes risk"},
            "high fructose corn syrup": {"risk": "high", "warning": "Metabolized differently, may cause fatty liver"},
            "palm oil": {"risk": "medium", "warning": "High saturated fat, environmental damage"},
            "sodium": {"risk": "medium", "warning": "High sodium increases blood pressure risk"},
            "saturated fat": {"risk": "medium", "warning": "Excess saturated fat increases heart disease risk"},
            "trans fat": {"risk": "high", "warning": "Artificial trans fats are harmful (most banned)"},
            "corn syrup": {"risk": "high", "warning": "Basically liquid sugar with minimal nutrients"},
            "refined white flour": {"risk": "medium", "warning": "Lacks fiber, spikes blood sugar"},
            "artificial sweeteners": {"risk": "medium", "warning": "May alter gut bacteria"},
            "hydrogenated oil": {"risk": "high", "warning": "Contains trans fats, should be banned"},
            "sodium nitrite": {"risk": "high", "warning": "Preservative, may form carcinogens"},
            "sodium benzoate": {"risk": "medium", "warning": "Preservative, may combine with vitamin C to form benzene"},
            "sulfites": {"risk": "medium", "warning": "Preservative, may trigger asthma in sensitive people"},
        }
    
    def _load_warnings(self) -> Dict:
        """Allergens and common warnings."""
        return {
            "peanuts": "Common allergen",
            "tree nuts": "Common allergen",
            "milk": "Common allergen",
            "eggs": "Common allergen",
            "shellfish": "Common allergen",
            "fish": "Common allergen",
            "gluten": "Triggers celiac disease",
            "soy": "Common allergen",
        }
    
    def get_ingredient_risk(self, ingredient: str) -> Optional[Dict]:
        """
        Get risk profile for an ingredient.
        
        Args:
            ingredient: Ingredient name
        
        Returns:
            Risk profile dict or None
        """
        ingredient_lower = ingredient.lower().strip()
        
        # Check harmful ingredients
        for harmful_ing, risk_data in self.harmful_ingredients.items():
            if harmful_ing in ingredient_lower:
                return {
                    "ingredient": ingredient,
                    "name": ingredient,
                    "type": "harmful",
                    **risk_data
                }
        
        # Check additives (E-numbers)
        import re
        additive_match = re.search(r'e(\d+)', ingredient_lower)
        if additive_match:
            additive_code = f"e{additive_match.group(1)}"
            if additive_code in self.additives:
                return {
                    "ingredient": ingredient,
                    "name": self.additives[additive_code].get("name", ingredient),
                    "type": "additive",
                    **self.additives[additive_code]
                }
        
        # Check warnings (allergens)
        for warning_ingredient, warning_msg in self.warnings.items():
            if warning_ingredient in ingredient_lower:
                return {
                    "ingredient": ingredient,
                    "name": ingredient,
                    "type": "allergen",
                    "risk": "high",
                    "warning": warning_msg
                }
        
        return None
    
    def analyze_ingredients(self, ingredients: List[str]) -> Dict:
        """
        Analyze list of ingredients.
        
        Returns:
            Dict with categorized ingredients
        """
        harmful = []
        allergens = []
        additives = []
        
        for ingredient in ingredients:
            risk = self.get_ingredient_risk(ingredient)
            if risk:
                if risk["type"] == "harmful":
                    harmful.append(risk)
                elif risk["type"] == "allergen":
                    allergens.append(risk)
                elif risk["type"] == "additive":
                    additives.append(risk)
        
        return {
            "harmful": harmful,
            "allergens": allergens,
            "additives": additives,
            "total_risky": len(harmful) + len(allergens) + len(additives),
        }
