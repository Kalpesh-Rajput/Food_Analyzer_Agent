"""Detect misleading marketing claims vs actual ingredients."""

from typing import List, Dict
import re


class MisleadingClaimDetector:
    """
    Detect mismatches between marketing claims and actual content.
    E.g., "100% fruit" but ingredients show mostly sugar.
    """
    
    def __init__(self):
        """Initialize detector."""
        pass
    
    def detect_mismatches(self,
                         claims: List[str],
                         ingredients: List[str],
                         nutrition: Dict) -> List[Dict]:
        """
        Find misleading claims.
        
        Args:
            claims: Marketing claims found on package
            ingredients: Actual ingredients list
            nutrition: Nutrition facts
        
        Returns:
            List of misleading claims detected
        """
        
        mismatches = []
        
        if not claims:
            return mismatches
        
        for claim in claims:
            claim_lower = claim.lower()
            
            # ─── "100% Fruit" check ─────────────────────────────────────────
            if "100% fruit" in claim_lower or "all fruit" in claim_lower:
                mismatch = self._check_fruit_claim(ingredients, nutrition)
                if mismatch:
                    mismatches.append(mismatch)
            
            # ─── "Natural" claim ────────────────────────────────────────────
            elif "natural" in claim_lower and "all natural" not in claim_lower:
                mismatch = self._check_natural_claim(ingredients)
                if mismatch:
                    mismatches.append(mismatch)
            
            # ─── "No Sugar" or "Sugar Free" ─────────────────────────────────
            elif "no sugar" in claim_lower or "sugar free" in claim_lower:
                mismatch = self._check_sugar_free_claim(nutrition, ingredients)
                if mismatch:
                    mismatches.append(mismatch)
            
            # ─── "High Protein" ────────────────────────────────────────────
            elif "high protein" in claim_lower:
                mismatch = self._check_high_protein_claim(nutrition)
                if mismatch:
                    mismatches.append(mismatch)
            
            # ─── "Organic" with synthetic additives ──────────────────────────
            elif "organic" in claim_lower:
                mismatch = self._check_organic_claim(ingredients)
                if mismatch:
                    mismatches.append(mismatch)
            
            # ─── "Low Fat" but high sugar ───────────────────────────────────
            elif "low fat" in claim_lower or "fat free" in claim_lower:
                mismatch = self._check_lowfat_claim(nutrition)
                if mismatch:
                    mismatches.append(mismatch)
        
        return mismatches
    
    def _check_fruit_claim(self, ingredients: List[str], nutrition: Dict) -> Dict:
        """Check if '100% fruit' claim is real."""
        
        # If fruit is claimed to be 100%, but sugar is high and ingredients are mostly fillers
        sugar_g = nutrition.get("sugar_g", 0)
        
        # Actual fruit has ~12g sugar per 100g naturally
        # If it has more sugar + cheap fillers, it's a lie
        has_fillers = any(filler in str(ingredients).lower() 
                         for filler in ["corn syrup", "sugar", "dextrose", "glucose"])
        
        if sugar_g > 15 and has_fillers:
            return {
                "claim": "100% Fruit",
                "reality": f"Only {self._estimate_fruit_content(sugar_g)}% actual fruit. Rest is sugar.",
                "severity": "high"
            }
        
        return None
    
    def _check_natural_claim(self, ingredients: List[str]) -> Dict:
        """Check if 'natural' claim is real."""
        
        artificial = [ing for ing in ingredients 
                     if any(x in ing.lower() for x in ["e-", "e1", "artificial", "synthetic", "dye"])]
        
        if artificial:
            return {
                "claim": "Natural",
                "reality": f"Contains {len(artificial)} artificial additive(s): {', '.join(artificial[:2])}...",
                "severity": "high"
            }
        
        return None
    
    def _check_sugar_free_claim(self, nutrition: Dict, ingredients: List[str]) -> Dict:
        """Check if sugar-free claim is true."""
        
        sugar_g = nutrition.get("sugar_g", 0)
        
        if sugar_g and sugar_g > 0.5:  # Trace amounts are OK
            # Check for artificial sweeteners (hidden sugar replacement)
            has_sweeteners = any(sweet in str(ingredients).lower() 
                               for sweet in ["aspartame", "sucralose", "stevia", "sugar alcohol"])
            
            if has_sweeteners:
                return {
                    "claim": "Sugar Free",
                    "reality": f"Contains {sugar_g}g sugar + artificial sweeteners",
                    "severity": "medium"
                }
            elif sugar_g > 2:
                return {
                    "claim": "Sugar Free",
                    "reality": f"Actually contains {sugar_g}g sugar",
                    "severity": "high"
                }
        
        return None
    
    def _check_high_protein_claim(self, nutrition: Dict) -> Dict:
        """Check if high protein claim matches actual content."""
        
        protein_g = nutrition.get("protein_g", 0)
        calories = nutrition.get("energy_kcal", 0)
        
        # High protein typically means >15% of calories from protein
        if protein_g and calories:
            protein_calories = protein_g * 4  # 4 cal per gram
            protein_percent = (protein_calories / calories) * 100 if calories else 0
            
            if protein_percent < 15:
                return {
                    "claim": "High Protein",
                    "reality": f"Only {protein_percent:.0f}% of calories from protein",
                    "severity": "medium"
                }
        
        return None
    
    def _check_organic_claim(self, ingredients: List[str]) -> Dict:
        """Check if organic claim conflicts with synthetic ingredients."""
        
        synthetics = [ing for ing in ingredients 
                     if any(x in ing.lower() for x in ["e-", "bht", "bha", "synthetic", "artificial"])]
        
        if synthetics:
            return {
                "claim": "Organic",
                "reality": f"Contains synthetic additives: {synthetics[0]}",
                "severity": "high"
            }
        
        return None
    
    def _check_lowfat_claim(self, nutrition: Dict) -> Dict:
        """Check if low-fat claim is paired with excess sugar."""
        
        sugar_g = nutrition.get("sugar_g", 0)
        
        # Low-fat products often compensate with sugar
        if sugar_g and sugar_g > 12:
            return {
                "claim": "Low Fat",
                "reality": f"Compensated with {sugar_g}g sugar",
                "severity": "medium"
            }
        
        return None
    
    def _estimate_fruit_content(self, sugar_g: float) -> int:
        """Estimate fruit percentage based on sugar content."""
        # Rough estimate: real fruit ~12g sugar per 100g
        # If total sugar is higher, rest is added
        
        natural_fruit_sugar = min(sugar_g, 12)
        estimated_fruit = (natural_fruit_sugar / 12) * 100
        
        return int(max(0, estimated_fruit))
