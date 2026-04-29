# 📋 COMPLETE PROJECT SETUP GUIDE

## ✅ What Was Built

You now have a **complete, production-ready food analyzer application** with:

### ✨ Backend (FastAPI + Python)
- ✅ Advanced OCR pipeline with image preprocessing
- ✅ Multi-engine OCR (Tesseract + Vision API fallback)
- ✅ Ingredient intelligence database (40+ harmful ingredients tracked)
- ✅ Rule-based health scoring (0-100 deterministic scoring)
- ✅ Misleading claim detection (10+ marketing lies detected)
- ✅ LLM integration for witty final messages
- ✅ Full REST API with Pydantic models
- ✅ CORS enabled for frontend integration

### 🎨 Frontend (React + Vite)
- ✅ Mobile-responsive design
- ✅ Camera upload & file upload
- ✅ Real-time image compression
- ✅ Chat-style UI with message bubbles
- ✅ Beautiful result cards with color-coded verdicts
- ✅ Detailed nutrition breakdown
- ✅ Ingredient warnings display
- ✅ Misleading claim alerts

---

## 🚀 STEP-BY-STEP EXECUTION

### PART 1: INSTALL TESSERACT OCR (15 minutes)

#### Windows:
1. Download: https://github.com/UB-Mannheim/tesseract/wiki
2. Run installer
3. **Default path:** `C:\Program Files\Tesseract-OCR\tesseract.exe`
4. Verify: Open Command Prompt and run:
   ```
   tesseract --version
   ```
   Should show version info

#### macOS:
```bash
brew install tesseract
tesseract --version  # Verify
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
tesseract --version  # Verify
```

---

### PART 2: BACKEND SETUP (10 minutes)

#### Step 1: Navigate to backend directory
```bash
cd food_analyzer_agent/backend
```

#### Step 2: Create virtual environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

#### Step 3: Install Python dependencies
```bash
pip install -r requirements.txt
```

This installs:
- fastapi (web framework)
- uvicorn (server)
- pillow & opencv-python (image processing)
- pytesseract (OCR)
- openai & anthropic (LLM clients)
- And more...

#### Step 4: Get your API key

**Choose ONE:**

**Option A: OpenAI (Recommended)**
1. Go to https://platform.openai.com/api/keys
2. Create new API key
3. Copy key

**Option B: Anthropic**
1. Go to https://console.anthropic.com
2. Create API key
3. Copy key

#### Step 5: Create environment file
```bash
# Copy example template
cp .env.example .env

# Edit .env file
```

Add your API key:

```bash
# Windows Command Prompt
notepad .env

# Or any text editor
```

**Windows users:** If Tesseract was installed:
```
TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe
```

File should look like:
```
NODE_ENV=development
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-key-here
ANTHROPIC_API_KEY=
USE_TESSERACT=true
TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe
HOST=127.0.0.1
PORT=8000
DEBUG=true
```

#### Step 6: Start the backend server
```bash
python main.py
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

**Keep this terminal open!**

---

### PART 3: FRONTEND SETUP (5 minutes)

**Open a NEW terminal** (don't close the backend one)

#### Step 1: Navigate to frontend directory
```bash
cd food_analyzer_agent/frontend
```

#### Step 2: Install Node dependencies
```bash
npm install
```

This installs React, Vite, Axios, and other dependencies.

#### Step 3: Start development server
```bash
npm run dev
```

Expected output:
```
  VITE v5.1.0  ready in 234 ms

  ➜  Local:   http://localhost:3000/
  ➜  press h + enter to show help
```

**Keep this terminal open too!**

---

### PART 4: TEST THE APP (2 minutes)

#### Step 1: Open in browser
Go to: **http://localhost:3000**

You should see:
- 🥗 Food Analyzer title
- 📸 "Scan Product" button
- 📤 "Upload Image" button

#### Step 2: Upload a test image

**Option A: Use a real food product image**
- Find a packaged food product
- Take a photo of the nutrition label
- Upload it

**Option B: Use a sample image**
- Find any food packaging image online
- Download and upload

#### Step 3: View results

After upload, you'll see:
- 🎨 Color-coded verdict (🟢🟡🔴)
- 📊 Nutrition facts extracted
- ⚠️ Ingredient warnings
- 🚨 Misleading claims (if any)
- 💬 Witty summary message

---

## 📊 API REFERENCE

### Test the API directly

**With curl:**
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "Food Analyzer API"
}
```

### Full analysis example

Prepare a base64 image (if using curl):
```bash
# Convert image to base64 (Mac/Linux)
base64 -i food_image.jpg | tr -d '\n'

# On Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("food_image.jpg"))
```

Then POST request:
```bash
curl -X POST http://localhost:8000/analyze-food \
  -H "Content-Type: application/json" \
  -d '{
    "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg==...",
    "user_message": null
  }'
```

---

## 🔍 PROJECT STRUCTURE REFERENCE

```
food_analyzer_agent/
│
├── 📄 README.md                    # Full documentation
├── 📄 SETUP.md                     # This file
├── 📄 .env.example                 # Environment template
├── 📄 .env                         # Your config (don't commit)
├── 📄 requirements.txt             # Old deps (for reference)
│
├── backend/                        # Python FastAPI server
│   ├── main.py                     # ⚙️ FastAPI app (RUN THIS)
│   ├── config.py                   # Configuration
│   ├── models.py                   # Pydantic data models
│   ├── requirements.txt            # Python dependencies
│   │
│   ├── ocr/                        # OCR Module
│   │   ├── preprocessor.py         # Image preprocessing
│   │   │   ├── preprocess_for_ocr()     # Main preprocessing
│   │   │   ├── _deskew()               # Fix rotated text
│   │   │   └── _maybe_invert_for_ocr() # Invert dark backgrounds
│   │   │
│   │   └── engine.py               # Multi-OCR engine
│   │       ├── MultiOCREngine
│   │       ├── extract_text()      # Get text from image
│   │       ├── extract_structured_data()  # Parse nutrition/ingredients
│   │       └── Confidence scoring
│   │
│   ├── ingredients/                # Ingredient Database
│   │   └── database.py             # IngredientDatabase class
│   │       ├── _load_additives()   # E-numbers, INS codes
│   │       ├── _load_harmful()     # Harmful ingredients
│   │       ├── get_ingredient_risk()
│   │       └── analyze_ingredients()
│   │
│   ├── analysis/                   # Analysis Module
│   │   ├── rule_engine.py          # ⭐ Health scoring logic
│   │   │   ├── RuleEngine class
│   │   │   ├── score_food()        # 0-100 deterministic scoring
│   │   │   └── Penalty system
│   │   │
│   │   └── claim_detector.py       # 🚨 Misleading claims
│   │       ├── MisleadingClaimDetector
│   │       ├── detect_mismatches()
│   │       ├── _check_fruit_claim()
│   │       ├── _check_natural_claim()
│   │       └── etc.
│   │
│   └── llm/                        # LLM Integration
│       └── message_generator.py    # 💬 Witty messages
│           ├── MessageGenerator
│           ├── generate_final_message()
│           └── Fallback if LLM fails
│
├── frontend/                       # React Vite app
│   ├── package.json                # Node dependencies
│   ├── vite.config.js              # Vite configuration
│   ├── index.html                  # HTML entry point
│   │
│   └── src/
│       ├── main.jsx                # React entry point
│       ├── App.jsx                 # Main app component
│       ├── App.css                 # Main styles
│       │
│       ├── pages/                  # Pages
│       │   ├── HomePage.jsx        # 📸 Upload/Camera
│       │   ├── HomePage.css
│       │   ├── ChatPage.jsx        # 💬 Results display
│       │   └── ChatPage.css
│       │
│       ├── components/             # Reusable components
│       │   ├── ResultCard.jsx      # 📊 Results display
│       │   ├── ResultCard.css
│       │   ├── MessageBubble.jsx   # 💬 Chat messages
│       │   └── MessageBubble.css
│       │
│       ├── services/               # API calls
│       │   └── api.js              # analyzeFood() function
│       │
│       └── utils/                  # Utilities
│           └── imageUtils.js       # compressImage(), fileToBase64()
```

---

## ⚙️ CONFIGURATION OPTIONS

### Backend Settings (.env)

```bash
# LLM Choice
LLM_PROVIDER=openai              # or "anthropic"
LLM_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=claude-xxx

# OCR
USE_TESSERACT=true
TESSERACT_PATH=/path/to/tesseract

# Server
HOST=127.0.0.1
PORT=8000
DEBUG=true

# Image Processing
MAX_IMAGE_SIZE_MB=10
COMPRESSION_QUALITY=85  # Lower = faster, lower quality
```

### Customize Ingredient Database

Edit `backend/ingredients/database.py`:

```python
def _load_harmful(self) -> Dict:
    return {
        "your_ingredient": {
            "risk": "high",  # or "medium", "low"
            "warning": "Your custom warning message"
        },
        # ... more ingredients
    }
```

### Adjust Health Scoring Rules

Edit `backend/analysis/rule_engine.py`:

```python
# Change thresholds
DAILY_SUGAR_LIMIT_G = 25  # WHO recommendation
DAILY_SODIUM_LIMIT_MG = 2300  # FDA recommendation

# Change penalties
score -= 30  # Sugar penalty
score += 5   # Protein bonus
```

---

## 🧪 TESTING WORKFLOW

### Test 1: Backend Only

```bash
# Terminal 1: Backend running
cd backend
python main.py

# Terminal 2: Test API
curl http://localhost:8000/health

# Should respond with:
# {"status":"ok","service":"Food Analyzer API"}
```

### Test 2: Frontend Only

```bash
# With backend running (Terminal 1)

# Terminal 2: Frontend
cd frontend
npm run dev

# Open http://localhost:3000 in browser
```

### Test 3: Full End-to-End

1. **Backend running** on http://127.0.0.1:8000
2. **Frontend running** on http://127.0.0.1:3000
3. **Upload any food image** (or use sample)
4. **View instant results**

---

## 🛠️ TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError: pytesseract` | `pip install -r requirements.txt` |
| `Tesseract not found` | Install Tesseract (see Part 1) or set TESSERACT_PATH in .env |
| `OPENAI_API_KEY not set` | Add key to .env: `OPENAI_API_KEY=sk-xxx` |
| `Port 8000 already in use` | Change PORT in .env to 8001, 8002, etc. |
| `Port 3000 already in use` | Change in vite.config.js: `port: 3001` |
| CORS error | Ensure backend on 127.0.0.1:8000, frontend on 127.0.0.1:3000 |
| Image processing slow | Reduce COMPRESSION_QUALITY in .env to 70 |
| OCR not reading labels | Ensure Tesseract installed and TESSERACT_PATH correct |

---

## 📊 KEY METRICS

### Health Scoring (0-100)

**Deductions:**
- High sugar (>15g): -30 points
- Moderate sugar (5-15g): -1.5 per gram
- High sodium (>500mg): -25 points
- High saturated fat: -20 points
- Harmful ingredient: -10 points each
- Allergen: -5 points each
- High-risk additive: -8 points each
- Ultra-processed (>5 additives): -20 points

**Bonuses:**
- Good protein (>10g): +5 points
- Good fiber (>3g): +5 points

**Result:**
- ≥70 = 🟢 Healthy
- 50-69 = 🟡 Okay  
- <50 = 🔴 Unhealthy

---

## 🚀 NEXT STEPS (After Local Testing)

### Option 1: Deploy Backend
1. Push to GitHub
2. Deploy to: Render, Railway, or Heroku
3. Set environment variables on platform
4. Update frontend API endpoint

### Option 2: Deploy Frontend
1. Run: `npm run build` → Creates `dist/` folder
2. Deploy `dist/` to: Vercel, Netlify
3. Point to your backend URL

### Option 3: Build Mobile App
- React Native (use same React components)
- Or Flutter with HTTP calls to backend

---

## 📞 QUICK REFERENCE

### Start Everything
```bash
# Terminal 1
cd backend && python main.py

# Terminal 2
cd frontend && npm run dev

# Browser: http://localhost:3000
```

### Stop Everything
```
Ctrl+C (in both terminals)
```

### Common Ports
- Backend API: http://127.0.0.1:8000
- Frontend: http://127.0.0.1:3000
- Database: N/A (file-based ingredient DB)

---

**Status:** ✅ Ready to use
**Last Updated:** April 2026
