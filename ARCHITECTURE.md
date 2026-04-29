# 🏗️ ARCHITECTURE & SYSTEM DESIGN

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                          END-TO-END FOOD ANALYZER                          │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User Upload / Camera              React Frontend (Port 3000)              │
│        │                                   │                               │
│        │                        ┌──────────▼──────────┐                    │
│        │                        │   Home Screen       │                    │
│        │                        │  - 📸 Scan Camera   │                    │
│        │                        │  - 📤 Upload File   │                    │
│        │                        └──────────┬──────────┘                    │
│        │                                   │                               │
│        │                        Image Compression                          │
│        │                        (Reduce size for API)                      │
│        │                                   │                               │
│        └───────────────────────────────────┼───────────────────────────────┘
│                                            │
│                              HTTP POST /analyze-food
│                                  (base64 image)
│                                            │
│        ┌───────────────────────────────────▼───────────────────────────────┐
│        │                                                                   │
│        │              FastAPI Backend (Port 8000)                         │
│        │                                                                   │
│        ├─────────────────────────────────────────────────────────────────┤
│        │                                                                 │
│        │  1. IMAGE PREPROCESSING                                        │
│        │     ┌─────────────────────────────────────────────────────┐   │
│        │     │ OCR Preprocessor                                    │   │
│        │     ├─────────────────────────────────────────────────────┤   │
│        │     │ • Denoise (fastNlMeansDenoising)                    │   │
│        │     │ • Convert to grayscale                              │   │
│        │     │ • Enhance contrast (CLAHE)                          │   │
│        │     │ • Bilateral filtering (edge-preserving)            │   │
│        │     │ • Sharpen text (kernel filter)                     │   │
│        │     │ • Deskew rotated text (Hough line detection)      │   │
│        │     │ • Automatic thresholding (Otsu's method)          │   │
│        │     │ • Invert if needed                                 │   │
│        │     └─────────────────────────────────────────────────────┘   │
│        │                         │                                       │
│        │                         ▼                                       │
│        │                                                                 │
│        │  2. MULTI-ENGINE OCR                                           │
│        │     ┌─────────────────────────────────────────────────────┐   │
│        │     │ MultiOCREngine                                      │   │
│        │     ├─────────────────────────────────────────────────────┤   │
│        │     │ Engine 1: Tesseract OCR                            │   │
│        │     │  └─ Best for: Structured labels, ingredient lists │   │
│        │     │  └─ Confidence scoring                            │   │
│        │     │                                                    │   │
│        │     │ Engine 2: Vision API (Fallback)                   │   │
│        │     │  └─ Used if: Tesseract not available              │   │
│        │     │  └─ Better for: Rotated, blurry images            │   │
│        │     │                                                    │   │
│        │     │ Merge Strategy:                                    │   │
│        │     │  └─ Tesseract = Primary (if available)            │   │
│        │     │  └─ Combine low-confidence words                  │   │
│        │     └─────────────────────────────────────────────────────┘   │
│        │                         │                                       │
│        │                         ▼                                       │
│        │                                                                 │
│        │  3. TEXT EXTRACTION & PARSING                                  │
│        │     ┌─────────────────────────────────────────────────────┐   │
│        │     │ Nutrition Parser                                    │   │
│        │     │  - Sugar, Sodium, Fat, Protein, Fiber             │   │
│        │     │  - Energy/Calories                                 │   │
│        │     │  - Regex pattern matching                          │   │
│        │     │                                                    │   │
│        │     │ Ingredients Parser                                 │   │
│        │     │  - Split by commas/semicolons                      │   │
│        │     │  - Clean percentages and quantities                │   │
│        │     │  - Categorize (main, additives, preservatives)    │   │
│        │     │                                                    │   │
│        │     │ Claims Extractor                                   │   │
│        │     │  - Find marketing claims ("natural", "organic")   │   │
│        │     │  - Front-of-pack messages                         │   │
│        │     └─────────────────────────────────────────────────────┘   │
│        │                         │                                       │
│        │         ┌───────────────┼───────────────┐                      │
│        │         │               │               │                      │
│        │         ▼               ▼               ▼                      │
│        │                                                                 │
│        │  4a. INGREDIENT ANALYSIS           4b. RULE ENGINE             │
│        │  ┌─────────────────────┐          ┌──────────────────┐        │
│        │  │ IngredientDatabase  │          │ RuleEngine       │        │
│        │  ├─────────────────────┤          ├──────────────────┤        │
│        │  │ • Harmful list      │          │ Scoring Rules:   │        │
│        │  │ • E-number database │          │ • Base: 100 pts  │        │
│        │  │ • Additives catalog │          │ • Sugar: -30     │        │
│        │  │ • Allergens DB      │          │ • Sodium: -25    │        │
│        │  │                     │          │ • Additives: -8  │        │
│        │  │ Lookup each         │          │ • Harmful: -10   │        │
│        │  │ ingredient:         │          │ • Protein: +5    │        │
│        │  │  - Risk level       │          │ • Fiber: +5      │        │
│        │  │  - Warning msg      │          │                  │        │
│        │  │  - Category         │          │ Result: 0-100    │        │
│        │  │                     │          │ Verdict:         │        │
│        │  │ Returns:            │          │ ≥70 = 🟢 Health │        │
│        │  │  - Harmful items    │          │ 50-69 = 🟡 Okay  │        │
│        │  │  - Allergens        │          │ <50 = 🔴 Sick    │        │
│        │  │  - Additives        │          │                  │        │
│        │  │  - Risk count       │          │ + Insights gen   │        │
│        │  └─────────────────────┘          └──────────────────┘        │
│        │         │                                  │                   │
│        │         └──────────────┬──────────────────┘                    │
│        │                        │                                       │
│        │                        ▼                                       │
│        │                                                                 │
│        │  4c. MISLEADING CLAIM DETECTION                               │
│        │      ┌─────────────────────────────────────────────────┐      │
│        │      │ MisleadingClaimDetector                         │      │
│        │      ├─────────────────────────────────────────────────┤      │
│        │      │ Checks for common deceptions:                   │      │
│        │      │                                                 │      │
│        │      │ 1. "100% Fruit" → Check sugar levels          │      │
│        │      │    If high sugar + fillers = LIE              │      │
│        │      │                                                 │      │
│        │      │ 2. "Natural" → Check for additives            │      │
│        │      │    If contains E-numbers = LIE                │      │
│        │      │                                                 │      │
│        │      │ 3. "No Sugar" → Check nutrition facts         │      │
│        │      │    If has sugar = LIE                         │      │
│        │      │                                                 │      │
│        │      │ 4. "High Protein" → Check % of calories      │      │
│        │      │    If <15% = LIE                              │      │
│        │      │                                                 │      │
│        │      │ 5. "Organic" → Check for synthetics           │      │
│        │      │    If has BHT/BHA = LIE                       │      │
│        │      │                                                 │      │
│        │      │ 6. "Low Fat" + High Sugar = COMPENSATED       │      │
│        │      │                                                 │      │
│        │      │ Returns:                                        │      │
│        │      │  - List of misleading claims                   │      │
│        │      │  - Reality explanation                         │      │
│        │      │  - Severity (high/medium/low)                  │      │
│        │      │                                                 │      │
│        │      │ Penalty: -10 pts per HIGH severity claim       │      │
│        │      └─────────────────────────────────────────────────┘      │
│        │         │                                                      │
│        │         └──────────────┬──────────────────────────────────────┘│
│        │                        │                                       │
│        │                        ▼                                       │
│        │                                                                 │
│        │  5. LLM MESSAGE GENERATION (Final Only!)                      │
│        │     ┌─────────────────────────────────────────────────────┐   │
│        │     │ MessageGenerator                                    │   │
│        │     ├─────────────────────────────────────────────────────┤   │
│        │     │ LLM USED FOR: Final witty message only             │   │
│        │     │ LLM NOT USED: Health scoring, ingredient analysis  │   │
│        │     │                                                    │   │
│        │     │ Input:                                             │   │
│        │     │  - Verdict (Healthy/Okay/Unhealthy)              │   │
│        │     │  - Score (0-100)                                  │   │
│        │     │  - Top insights                                   │   │
│        │     │  - Misleading claims                              │   │
│        │     │                                                    │   │
│        │     │ LLM Prompt:                                        │   │
│        │     │  "Generate a SHORT (1-2 sentences), HONEST,       │   │
│        │     │   slightly WITTY message about this product"       │   │
│        │     │                                                    │   │
│        │     │ Output:                                            │   │
│        │     │  "This has 3 tsp of sugar. Basically candy in     │   │
│        │     │   disguise with artificial dyes."                 │   │
│        │     │                                                    │   │
│        │     │ Fallback (if LLM fails):                           │   │
│        │     │  Rule-based witty messages                         │   │
│        │     └─────────────────────────────────────────────────────┘   │
│        │                         │                                       │
│        │                         ▼                                       │
│        │                                                                 │
│        │  6. FORMAT RESPONSE (JSON)                                     │
│        │     ┌─────────────────────────────────────────────────────┐   │
│        │     │ {                                                   │   │
│        │     │   "verdict": "Unhealthy",                          │   │
│        │     │   "score": "🔴",                                   │   │
│        │     │   "health_score": 35,                             │   │
│        │     │   "insights": [...],                              │   │
│        │     │   "nutrition": {...},                             │   │
│        │     │   "ingredients": {...},                           │   │
│        │     │   "misleading_claims": [...],                     │   │
│        │     │   "message": "..."                                │   │
│        │     │ }                                                  │   │
│        │     └─────────────────────────────────────────────────────┘   │
│        │                                                                 │
│        └──────────────────────────────┬─────────────────────────────────┘
│                                       │
│                             JSON Response
│                            (over HTTP)
│                                       │
│        ┌──────────────────────────────▼───────────────────────────────┐
│        │                                                              │
│        │             React Frontend (Display Results)               │
│        │                                                              │
│        │  ┌──────────────────────────────────────────────────────┐  │
│        │  │ ResultCard Component                               │  │
│        │  ├──────────────────────────────────────────────────────┤  │
│        │  │ • Color-coded verdict (🟢🟡🔴)                     │  │
│        │  │ • Score 0-100 with progress bar                    │  │
│        │  │ • Key insights (bullet points)                     │  │
│        │  │ • Nutrition facts (grid layout)                    │  │
│        │  │ • Ingredients with warnings                        │  │
│        │  │ • Allergen alerts                                  │  │
│        │  │ • Misleading claims section (if any)              │  │
│        │  │ • Final witty message                              │  │
│        │  │ • Expandable raw OCR text (debug)                 │  │
│        │  └──────────────────────────────────────────────────────┘  │
│        │                                                              │
│        └──────────────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Design Principles

### 1. **Separation of Concerns**
- OCR layer: Image → Text
- Parsing layer: Text → Structured data
- Analysis layer: Data → Judgment
- Formatting layer: Judgment → Response

### 2. **Rule-Based, Not LLM-Based**
- ✅ Deterministic health scoring (reproducible)
- ✅ Fast (no LLM latency for scoring)
- ✅ No "AI hallucinations"
- ✅ Transparent (users understand why)
- ❌ NOT using LLM for health decision

- ⚠️ LLM ONLY for: Final message tone/wit
- ✅ Fallback: If LLM fails, uses rule-based message

### 3. **Multi-Layer Verification**
- OCR engine 1: Tesseract (accurate for structured text)
- OCR engine 2: Vision API (fallback, better at distorted images)
- Confidence scoring for each extracted value
- Fallback messages if confidence too low

### 4. **Ingredient Intelligence**
- Database of 40+ harmful ingredients
- E-number and INS code lookup
- Severity levels (high/medium/low risk)
- Allergen database
- Context-aware warnings

### 5. **Misleading Claim Detection**
- Pre-defined claim patterns (10+ types)
- Fact-checking against actual ingredients
- Severity rating system
- Points deduction from health score

---

## Data Flow Example

### Input
```json
{
  "image_base64": "data:image/jpeg;base64,/9j/...",
  "user_message": null
}
```

### After OCR
```json
{
  "raw_ocr_text": "Sugar 12g\nSodium 380mg\nIngredients: Sugar, Corn Syrup, Artificial Dyes E102...",
  "nutrition": {
    "sugar_g": 12,
    "sodium_mg": 380,
    "fat_g": 2
  },
  "ingredients": ["sugar", "corn syrup", "e102", "e110"],
  "claims": ["natural", "no artificial colors"]
}
```

### After Ingredient Analysis
```json
{
  "harmful": [
    {"ingredient": "sugar", "risk": "high", "warning": "High sugar content"},
    {"ingredient": "corn syrup", "risk": "high", "warning": "Basically liquid sugar"}
  ],
  "additives": [
    {"ingredient": "e102", "name": "Tartrazine", "risk": "high"},
    {"ingredient": "e110", "name": "Sunset Yellow", "risk": "high"}
  ],
  "allergens": [],
  "total_risky": 4
}
```

### After Rule Engine
```json
{
  "verdict": "Unhealthy",
  "score": "🔴",
  "health_score": 25,
  "insights": [
    "🔴 Sugar: 12g = 3 tsp",
    "⚠️ High sugar (12g)",
    "🚨 E102, E110 (artificial dyes)",
    "🚨 Ultra-processed (4+ additives)"
  ]
}
```

### After Claim Detection
```json
{
  "misleading_claims": [
    {
      "claim": "Natural",
      "reality": "Contains 2 artificial dyes (E102, E110)",
      "severity": "high"
    },
    {
      "claim": "No Artificial Colors",
      "reality": "Contains E102 (yellow) and E110 (orange)",
      "severity": "high"
    }
  ]
}
```

### After LLM
```
"Marketing says natural and no artificial colors. Reality: This product is basically sugar with artificial dyes. High fructose corn syrup + E102 + E110. Just terrible."
```

### Final Response
```json
{
  "verdict": "Unhealthy",
  "score": "🔴",
  "health_score": 15,  // Reduced from 25 due to misleading claims
  "insights": [...],
  "misleading_claims": [...],
  "message": "Marketing says natural and no artificial colors. Reality: This product is basically sugar with artificial dyes..."
}
```

---

## Performance Characteristics

| Component | Time | Notes |
|-----------|------|-------|
| Image compression | 100-300ms | Client-side (frontend) |
| Image preprocessing | 200-500ms | Denoise, contrast, sharpen |
| OCR (Tesseract) | 1-3 seconds | Depends on image quality |
| Ingredient parsing | 100-200ms | Regex patterns |
| Rule engine scoring | 50-100ms | Simple calculations |
| Claim detection | 100-200ms | Pattern matching |
| LLM message gen | 1-3 seconds | API call to OpenAI/Claude |
| **Total** | **3-8 seconds** | Mostly dominated by OCR + LLM |

### To Optimize:
- Cache LLM messages for common products
- Pre-process images on mobile before upload
- Implement batch processing for multiple products

---

## Deployment Readiness

### ✅ Production Ready
- Error handling for all steps
- Fallback mechanisms (no LLM? use rules)
- CORS configured
- Environment variable security
- Logging and monitoring hooks

### 🚀 Deployment Checklist
- [ ] Set `DEBUG=false` in .env
- [ ] Use production LLM API keys
- [ ] Set up error logging/Sentry
- [ ] Configure CDN for frontend
- [ ] Enable API rate limiting
- [ ] Add request validation
- [ ] Database for result history (optional)

---

**Architecture Version:** 1.0
**Last Updated:** April 2026
