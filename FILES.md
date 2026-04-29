# 📑 PROJECT FILES INDEX

## 📄 Documentation Files

### 1. **README.md** (Main Project Documentation)
- Overview of the entire system
- Feature list
- Quick start guide
- Architecture diagram
- Deployment options
- Troubleshooting guide
- **👉 START HERE**

### 2. **QUICKSTART.md** (2-Minute Fast Track)
- For the impatient
- Copy-paste commands
- Common errors and fixes
- Expected output examples
- **🏃 For Quick Setup**

### 3. **SETUP.md** (Detailed Setup Guide)
- Step-by-step installation
- Tesseract OCR setup (Windows/Mac/Linux)
- Backend configuration
- Frontend installation
- Environment variable reference
- Troubleshooting matrix
- Testing workflow
- **📋 For Complete Reference**

### 4. **ARCHITECTURE.md** (System Design)
- End-to-end data flow diagram
- Component breakdown
- Design principles
- Performance metrics
- Deployment checklist
- **🏗️ For Understanding How It Works**

### 5. **.env.example** (Configuration Template)
- Template for environment variables
- All configurable options
- Comments explaining each setting
- **⚙️ Copy to .env and customize**

---

## 💾 Backend Files (Python/FastAPI)

### Core Application
```
backend/
├── main.py ⭐
│   Entry point. Runs FastAPI server on port 8000
│   - Initializes all services
│   - Defines /health and /analyze-food endpoints
│   - Handles errors and CORS
│   - Line count: ~200
│
├── config.py
│   Configuration management
│   - Settings class loads from .env
│   - All environment variables defined here
│   - Line count: ~40
│
├── models.py
│   Pydantic data models (request/response schemas)
│   - AnalyzeRequest: Input model
│   - AnalyzeResponse: Output model
│   - NutritionData, IngredientsData: Sub-models
│   - Line count: ~80
│
└── requirements.txt
    Python dependencies
    - fastapi, uvicorn (web server)
    - pillow, opencv (image processing)
    - pytesseract (OCR)
    - openai, anthropic (LLM)
```

### OCR Module (`ocr/`)
```
ocr/
├── preprocessor.py 🔧
│   Image preprocessing for OCR accuracy
│   
│   Main function: preprocess_for_ocr(image)
│   Steps:
│   1. Denoise with fastNlMeansDenoising
│   2. Convert to grayscale
│   3. Apply CLAHE (contrast enhancement)
│   4. Bilateral filtering (edge-preserving)
│   5. Sharpen with kernel filter
│   6. Deskew rotated text
│   7. Otsu's automatic thresholding
│   8. Invert if needed (dark bg → light bg)
│   
│   Helper functions:
│   - _deskew(): Fix angled text using Hough lines
│   - _maybe_invert_for_ocr(): Check if inversion needed
│   - load_image_from_base64(): Decode base64 images
│   
│   Line count: ~250
│
└── engine.py 🧠
    Multi-OCR engine with fallback strategy
    
    Main class: MultiOCREngine
    
    Methods:
    - extract_text(image): Get text with confidence
    - extract_structured_data(image): Parse nutrition/ingredients
    - _extract_nutrition(text): Regex parsing for nutrition facts
    - _extract_ingredients(text): Parse ingredient list
    - _extract_claims(text): Find marketing claims
    
    Features:
    - Tesseract OCR (primary)
    - Vision API fallback
    - Confidence scoring
    - Text cleaning
    
    Line count: ~300
```

### Ingredients Module (`ingredients/`)
```
ingredients/
└── database.py 📊
    Ingredient risk database and lookup
    
    Main class: IngredientDatabase
    
    Built-in databases:
    - _load_additives(): E-numbers, INS codes
      * E102 (Tartrazine)
      * E110 (Sunset Yellow)
      * E621 (MSG)
      * etc. (~20 entries)
    
    - _load_harmful(): Harmful ingredients
      * Sugar, salt, palm oil, corn syrup
      * Trans fats, artificial sweeteners
      * Preservatives (sodium nitrite, benzoate)
      * etc. (~15 entries)
    
    - _load_warnings(): Allergens
      * Peanuts, tree nuts, milk, eggs, shellfish
      * Fish, gluten, soy
    
    Methods:
    - get_ingredient_risk(ingredient): Check one ingredient
    - analyze_ingredients(list): Categorize ingredient list
    
    Output: Harmful, allergens, additives (categorized)
    
    Line count: ~250
```

### Analysis Module (`analysis/`)
```
analysis/
├── rule_engine.py ⭐ (Core Logic!)
│   Deterministic health scoring (NOT LLM-based)
│   
│   Main class: RuleEngine
│   
│   Key method: score_food(nutrition, ingredients)
│   
│   Scoring Formula:
│   - Start at 100 points
│   - Sugar > 15g: -30 points
│   - Sugar 5-15g: -1.5 per gram
│   - Sodium > 500mg: -25 points
│   - High saturated fat: -20 points
│   - Harmful ingredient: -10 each
│   - Allergen: -5 each
│   - High-risk additive: -8 each
│   - Ultra-processed (>5 additives): -20 points
│   - Good protein (>10g): +5 points
│   - Good fiber (>3g): +5 points
│   
│   Verdict:
│   - ≥70: 🟢 Healthy
│   - 50-69: 🟡 Okay
│   - <50: 🔴 Unhealthy
│   
│   Helper methods:
│   - get_calorie_comparison(): "About a meal"
│   - get_sugar_comparison(): "3 tsp sugar"
│   - get_sodium_comparison(): "40% of daily limit"
│   
│   Line count: ~200
│
└── claim_detector.py 🚨
    Misleading marketing claim detection
    
    Main class: MisleadingClaimDetector
    
    Detects:
    1. "100% Fruit" claim with high sugar
    2. "Natural" claim with additives
    3. "No Sugar" claim with actual sugar
    4. "High Protein" when <15% of calories
    5. "Organic" with synthetic additives
    6. "Low Fat" compensated with sugar
    
    Methods:
    - detect_mismatches(claims, ingredients, nutrition)
    - _check_fruit_claim()
    - _check_natural_claim()
    - _check_sugar_free_claim()
    - _check_high_protein_claim()
    - _check_organic_claim()
    - _check_lowfat_claim()
    - _estimate_fruit_content()
    
    Output: List of MisleadingClaim objects
    Each with: claim, reality, severity (high/medium/low)
    
    Line count: ~220
```

### LLM Module (`llm/`)
```
llm/
└── message_generator.py 💬
    LLM integration for final messages ONLY
    
    Main class: MessageGenerator
    
    IMPORTANT: LLM is ONLY used for final message tone!
    - NOT for health scoring
    - NOT for ingredient analysis
    - ONLY for witty one-liners
    
    Methods:
    - generate_final_message(verdict, score, insights, ...)
    - _generate_with_openai(prompt)
    - _generate_with_anthropic(prompt)
    - _generate_fallback_message()
    
    Features:
    - Provider selection (OpenAI or Anthropic)
    - Automatic fallback if LLM fails
    - Rule-based witty messages as backup
    
    Example output:
    "This has 3 tsp of sugar. Marketing says organic, 
     ingredients say artificial dyes. Choose wisdom."
    
    Line count: ~200
```

---

## 🎨 Frontend Files (React/Vite)

### Configuration
```
frontend/
├── package.json
│   Node.js dependencies and scripts
│   Dependencies:
│   - react, react-dom (UI)
│   - vite (bundler)
│   - axios (HTTP client)
│   - react-router-dom (navigation)
│
├── vite.config.js
│   Vite build configuration
│   - Dev server on port 3000
│   - Proxy to backend /api
│   - React plugin enabled
│
└── index.html
    HTML entry point
    - Loads src/main.jsx
    - Sets title and favicon
```

### React App Structure
```
frontend/src/
│
├── main.jsx
│   React entry point
│   - Mounts App to #root
│   - Loads global styles
│
├── index.css
│   Global styles
│   - Reset defaults
│   - Typography
│   - Colors
│
├── App.jsx ⭐ (Main Component)
│   Route management between HomePage and ChatPage
│   - Tracks current page state
│   - Passes data between pages
│   - No complex logic
│
├── App.css
│   Main app styles
│
├── pages/
│   Page components (full-screen views)
│   
│   ├── HomePage.jsx 📸
│   │   Upload/Camera screen
│   │   
│   │   Features:
│   │   - Big colorful buttons for camera/upload
│   │   - File/camera input handling
│   │   - Image preview
│   │   - Loading animation during compression
│   │   
│   │   Functions:
│   │   - handleCameraClick(): Open device camera
│   │   - handleFileClick(): Open file picker
│   │   - handleImageSelect(): Process image, route to chat
│   │   
│   │   Hooks: useState, useRef
│   │   Line count: ~80
│   │
│   └── ChatPage.jsx 💬
│       Results display page
│       
│       Features:
│       - Displays user image
│       - Shows "Analyzing..." loading
│       - Displays result
│       - Back button
│       
│       Functions:
│       - analyzeImage(): Call backend API
│       - useEffect(): Auto-analyze on mount
│       
│       Child components: MessageBubble, ResultCard
│       Hooks: useState, useEffect
│       Line count: ~100
│
├── components/
│   Reusable UI components
│   
│   ├── MessageBubble.jsx 💬
│   │   Chat message bubble component
│   │   
│   │   Props: message object
│   │   
│   │   Message types:
│   │   - "user": User uploaded image
│   │   - "assistant": AI response
│   │   - "loading": Typing animation
│   │   - "error": Error message
│   │   
│   │   Features:
│   │   - Image display with preview
│   │   - Typing animation
│   │   - Error styling
│   │   
│   │   Line count: ~60
│   │
│   └── ResultCard.jsx 📊 (Complex!)
│       Results display card
│       
│       Sections:
│       1. Verdict header (color-coded)
│       2. Main message
│       3. Key insights (bullet points)
│       4. Misleading claims (if any)
│       5. Nutrition facts grid
│       6. Ingredients list
│       7. Allergen alerts
│       8. Debug: Raw OCR text
│       
│       Props: result object (from API response)
│       
│       Features:
│       - Color-coded severity indicators
│       - Responsive grid layout
│       - Expandable debug section
│       - Icon system (🟢🟡🔴)
│       
│       Line count: ~150
│
├── services/
│   Business logic and API integration
│   
│   └── api.js
│       API client functions
│       
│       Functions:
│       - analyzeFood(imageBase64, userMessage)
│         POST /analyze-food
│         Returns: Full analysis result
│       
│       - healthCheck()
│         GET /health
│         Returns: Service status
│       
│       Error handling: try/catch, console errors
│       Line count: ~30
│
└── utils/
    Utility functions
    
    └── imageUtils.js
        Image processing utilities
        
        Functions:
        - compressImage(file, quality)
          Reduce file size using HTML5 Canvas
          Default quality: 0.85
        
        - fileToBase64(file)
          Convert File object to base64 string
        
        Line count: ~40
```

---

## 📂 Directory Structure Summary

```
food_analyzer_agent/
│
├── 📄 README.md ..................... Main documentation
├── 📄 QUICKSTART.md ................. Fast setup guide
├── 📄 SETUP.md ...................... Detailed setup
├── 📄 ARCHITECTURE.md ............... System design
├── 📄 .env.example .................. Config template
├── 📄 .gitignore .................... Git ignore rules
│
├── backend/ ......................... Python FastAPI
│   ├── main.py ...................... 🚀 Start here
│   ├── config.py
│   ├── models.py
│   ├── requirements.txt
│   │
│   ├── ocr/
│   │   ├── preprocessor.py .......... Image preprocessing
│   │   └── engine.py ............... Multi-OCR
│   │
│   ├── ingredients/
│   │   └── database.py ............. Ingredient DB
│   │
│   ├── analysis/
│   │   ├── rule_engine.py .......... Health scoring ⭐
│   │   └── claim_detector.py ....... Misleading claims
│   │
│   └── llm/
│       └── message_generator.py .... Witty messages
│
└── frontend/ ........................ React Vite
    ├── package.json
    ├── vite.config.js
    ├── index.html
    │
    └── src/
        ├── main.jsx
        ├── index.css
        ├── App.jsx ................. 🚀 Start here
        ├── App.css
        │
        ├── pages/
        │   ├── HomePage.jsx ........ 📸 Upload screen
        │   ├── HomePage.css
        │   ├── ChatPage.jsx ........ 💬 Results screen
        │   └── ChatPage.css
        │
        ├── components/
        │   ├── MessageBubble.jsx ... Chat bubbles
        │   ├── MessageBubble.css
        │   ├── ResultCard.jsx ...... Results display ⭐
        │   └── ResultCard.css
        │
        ├── services/
        │   └── api.js ............. API client
        │
        └── utils/
            └── imageUtils.js ....... Image compression
```

---

## 🎯 Quick File Reference

### "Where do I...?"

| Need | File |
|------|------|
| Start the app? | README.md → SETUP.md |
| Understand architecture? | ARCHITECTURE.md |
| Change health scoring? | backend/analysis/rule_engine.py |
| Add harmful ingredient? | backend/ingredients/database.py |
| Customize UI? | frontend/src/components/ResultCard.jsx |
| Change API endpoint? | frontend/src/services/api.js |
| Add new claim detection? | backend/analysis/claim_detector.py |
| Improve OCR? | backend/ocr/preprocessor.py |
| Handle errors? | backend/main.py (exception handlers) |
| Test the API? | README.md → API Reference section |

---

**Total Lines of Code: ~2,000+**
**Production Ready: ✅ Yes**
**Last Updated: April 2026**
