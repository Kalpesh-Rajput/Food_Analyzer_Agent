# 🥗 Food Analyzer - Know What You're Eating

> Advanced food product analyzer using AI vision, OCR, and intelligent health scoring.
> Detects misleading marketing claims and provides honest nutritional insights.

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green?logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.9+-blue?logo=python)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎯 Features


✅ **AI-Powered Analysis** - LangGraph agent orchestrates intelligent multi-step food analysis
✅ **Mobile & Desktop Friendly** - Works on any device with a camera or file upload
✅ **Advanced OCR** - Multi-engine OCR with preprocessing (contrast, sharpening, deskewing)
✅ **Intelligent Extraction** - LLM-based parsing of nutrition, ingredients, and claims
✅ **Misleading Claim Detection** - Detects marketing lies (e.g., "100% fruit" claims)
✅ **Comprehensive Health Scoring** - Balanced analysis of nutrition and ingredients
✅ **Ingredient Intelligence** - Database of harmful ingredients and additives
✅ **User-Friendly Messages** - Conversational, honest feedback like a knowledgeable friend
✅ **Real-Time Analysis** - Instant results, no waiting

## 🤖 AI Agent Architecture

This project features a **LangGraph-based intelligent agent** that orchestrates the entire food analysis workflow:

### Agent Workflow
1. **📝 Extract Information** - LLM parses product name, nutrition, ingredients, claims
2. **🔍 Analyze Ingredients** - Categorizes additives, allergens, harmful substances
3. **📊 Score Health** - Calculates balanced health score (0-100)
4. **⚠️ Detect Misleading Claims** - Identifies potentially deceptive marketing
5. **💡 Generate Insights** - Creates actionable health recommendations
6. **💬 Create Message** - Generates friendly, conversational feedback

### Why LangGraph?
- **State Management**: Maintains context throughout the analysis pipeline
- **Error Handling**: Graceful degradation when steps fail
- **Modularity**: Each analysis step is independent and testable
- **Scalability**: Easy to add new analysis steps or modify existing ones

### Key Improvements Over Regex-Based Parsing
| Aspect | Previous Version | LangGraph Agent |
|--------|------------------|------------------|
| **Accuracy** | Limited regex patterns | Context-aware LLM understanding |
| **Flexibility** | Brittle to label variations | Adapts to different formats |
| **Analysis Depth** | Basic extraction | Comprehensive categorization |
| **User Experience** | Generic feedback | Personalized, friendly messages |
| **Maintenance** | Complex regex updates | Simple prompt modifications |

See [`backend/AGENT_README.md`](backend/AGENT_README.md) for detailed agent documentation.

```
food_analyzer_agent/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── config.py               # Configuration management
│   ├── models.py               # Pydantic models
│   ├── requirements.txt         # Python dependencies
│   ├── AGENT_README.md         # LangGraph agent documentation
│   ├── test_agent.py           # Agent testing script
│   ├── ocr/
│   │   ├── preprocessor.py    # Image preprocessing (contrast, denoise, etc)
│   │   └── engine.py          # Multi-OCR engine (Tesseract + Vision)
│   ├── ingredients/
│   │   └── database.py        # Ingredient risk database
│   ├── analysis/
│   │   ├── rule_engine.py     # Deterministic health scoring
│   │   └── claim_detector.py  # Detect misleading claims
│   └── llm/
│       ├── food_agent.py      # LangGraph-based analysis agent
│       └── message_generator.py # LLM for witty messages only
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── pages/
│       │   ├── HomePage.jsx   # Upload/Camera screen
│       │   └── ChatPage.jsx   # Results display
│       ├── components/
│       │   ├── ResultCard.jsx # Detailed results
│       │   └── MessageBubble.jsx # Chat UI
│       ├── services/
│       │   └── api.js         # API client
│       └── utils/
│           └── imageUtils.js  # Image compression
│
├── .env.example
├── README.md
└── Project Structure Diagram (below)
```

## 🚀 Quick Start (5 minutes)

### Prerequisites
- **Python 3.9+** (for backend)
- **Node.js 18+** (for frontend)
- **Tesseract OCR** (optional but recommended)

### Step 1: Install Tesseract (Recommended)

**Windows:**
1. Download installer: https://github.com/UB-Mannheim/tesseract/wiki
2. Run installer (default path: `C:\Program Files\Tesseract-OCR`)

**Mac:**
```bash
brew install tesseract
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install tesseract-ocr
```

---

## 📋 Full Setup Instructions

### Backend Setup

#### Step 1: Navigate to backend directory
```bash
cd backend
```

#### Step 2: Create Python virtual environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

#### Step 3: Install dependencies
```bash
pip install -r requirements.txt
```

**Note:** If you don't have Tesseract installed, the backend will still work using the vision API fallback (but accuracy may be lower).

#### Step 4: Configure environment variables
```bash
# Copy example to .env
cp .env.example .env

# Edit .env and add:
OPENAI_API_KEY=sk-your-key-here
# TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe  # Windows only
```

#### Step 5: Run FastAPI server
```bash
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

Test the API:
```bash
curl http://localhost:8000/health
# Response: {"status":"ok","service":"Food Analyzer API"}
```

---

### Frontend Setup

#### Step 1: Navigate to frontend directory
```bash
cd frontend
```

#### Step 2: Install dependencies
```bash
npm install
```

#### Step 3: Start development server
```bash
npm run dev
```

You should see:
```
  VITE v5.1.0  ready in 123 ms

  ➜  Local:   http://127.0.0.1:3000/
  ➜  press h + enter to show help
```

#### Step 4: Open in browser
- Go to **http://localhost:3000**
- Select "Scan Product" or "Upload Image"
- Upload a food product image
- View instant analysis!

---

## 🔄 System Architecture

```
User uploads image
        ↓
    React Frontend (Port 3000)
        ↓
  API Call (/analyze-food)
        ↓
    FastAPI Backend (Port 8000)
        ↓
    Image Preprocessing
    (contrast, sharpen, denoise, deskew)
        ↓
    Multi-OCR Engine
    (Tesseract + Vision API fallback)
        ↓
    Text Extraction & Parsing
    (nutrition, ingredients, claims)
        ↓
    Ingredient Database Lookup
    (risk levels, additives, allergens)
        ↓
    Rule Engine Analysis
    (health scoring 0-100)
        ↓
    Misleading Claim Detection
    (compare claims vs reality)
        ↓
    LLM Message Generation
    (only for final witty message)
        ↓
    JSON Response
        ↓
    React UI Display
```

---

## 📊 API Usage

### Endpoint: `POST /analyze-food`

#### Request
```bash
curl -X POST http://localhost:8000/analyze-food \
  -H "Content-Type: application/json" \
  -d '{
    "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "user_message": "Is this healthy for kids?"
  }'
```

#### Response
```json
{
  "verdict": "Unhealthy",
  "score": "🔴",
  "health_score": 35,
  "product_name": "Sugary Cereal",
  "insights": [
    {
      "icon": "🔴",
      "text": "Sugar: 12g = 3 tsp"
    },
    {
      "icon": "⚠️",
      "text": "High sugar (12g)"
    },
    {
      "icon": "🚨",
      "text": "Contains artificial dyes"
    }
  ],
  "nutrition": {
    "energy_kcal_per_100g": 380,
    "sugar_g": 12,
    "sodium_mg": 150,
    "fat_g": 2,
    "protein_g": 8,
    "fiber_g": 1
  },
  "ingredients": {
    "ingredient_list": ["wheat flour", "sugar", "corn syrup", "salt"],
    "additives": ["e102", "e110"],
    "allergens": ["wheat"]
  },
  "misleading_claims": [
    {
      "claim": "100% Whole Grain",
      "reality": "Contains only 40% whole grain, rest is refined flour",
      "severity": "high"
    }
  ],
  "message": "Marketing says whole grain. Reality says mostly sugar and additives. This is candy disguised as cereal."
}
```

---

## 🧪 Example Workflows

### Example 1: Analyzing a Snack Bar

1. **User action:** Upload image of protein bar
2. **OCR extracts:**
   - Ingredients: "Whey protein isolate, sugar, palm oil..."
   - Nutrition: Sugar 5g, Protein 20g, Fat 8g
   - Claims: "High protein", "Natural"

3. **Analysis:**
   - Rule engine: Score 65/100 (Okay)
   - Claim detection: "Natural" claim conflicts with artificial sweeteners
   - Insights: ✅ Good protein, ⚠️ High fat, 🚨 Misleading "natural" claim

4. **Message:** "Good protein source, but 'natural' is a stretch with those additives."

### Example 2: Detecting Ultra-Processed Food

1. **User action:** Upload candy packaging
2. **OCR extracts:**
   - Ingredients: 15+ items including multiple artificial dyes
   - Claims: "Made with real sugar"

3. **Analysis:**
   - Ingredient DB flags: E102, E110, E129 (artificial dyes)
   - Rule engine: Score 15/100 (Unhealthy)
   - Multiple high-risk additives = ultra-processed penalty

4. **Message:** "This is basically just industrial chemicals. Even for candy, this is extreme."

---

## 🔧 Advanced Configuration

### Backend Environment Variables

```bash
# LLM Configuration
LLM_PROVIDER=openai              # or "anthropic"
LLM_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=claude-xxx

# OCR Configuration
USE_TESSERACT=true
TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe

# Server
HOST=127.0.0.1
PORT=8000
DEBUG=true

# Image Processing
MAX_IMAGE_SIZE_MB=10
COMPRESSION_QUALITY=85
```

### Customize Ingredient Database

Edit `backend/ingredients/database.py`:

```python
def _load_harmful(self) -> Dict:
    return {
        "my_ingredient": {"risk": "high", "warning": "My custom warning"},
    }
```

---

## 📱 Frontend Features

### Home Screen
- 📸 Scan with camera (mobile)
- 📤 Upload from device
- Visual feedback during processing

### Results Screen
- 🎨 Color-coded verdict (🟢 Healthy, 🟡 Okay, 🔴 Unhealthy)
- 📊 Nutrition facts display
- ⚠️ Ingredient warnings
- 🚨 Misleading claims
- 💬 Short, witty message

---

## 🛠️ Troubleshooting

### Problem: "ModuleNotFoundError: No module named 'pytesseract'"
**Solution:** Install Python dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Problem: "Tesseract not found"
**Solution:** Install Tesseract (see prerequisites) or set path in `.env`:
```
TESSERACT_PATH=/usr/bin/tesseract  # Linux
TESSERACT_PATH=/usr/local/bin/tesseract  # Mac
TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe  # Windows
```

### Problem: "OPENAI_API_KEY not set"
**Solution:** Add your key to `.env`:
```
OPENAI_API_KEY=sk-your-actual-key-here
```

### Problem: CORS error when frontend calls backend
**Solution:** Ensure backend is running on `http://127.0.0.1:8000` and frontend on `http://127.0.0.1:3000`

### Problem: Image too large or processing slow
**Solution:** Image is automatically compressed. Adjust in `.env`:
```
COMPRESSION_QUALITY=70  # Lower = smaller file, faster processing
```

---

## 📊 Health Scoring Rules

### Scoring Formula

**Base:** Start at 100 points

**Deductions:**
- Sugar > 15g: -30 points
- Sugar 5-15g: -1.5 per gram
- Sodium > 500mg: -25 points
- High saturated fat: -20 points
- Each harmful ingredient: -10 points
- Each allergen: -5 points
- High-risk additive: -8 points
- Ultra-processed (>5 additives): -20 points

**Bonuses:**
- Protein > 10g: +5 points
- Fiber > 3g: +5 points

**Verdict:**
- ≥70 points: 🟢 Healthy
- 50-69 points: 🟡 Okay
- <50 points: 🔴 Unhealthy

---

## 🚀 Deployment (Optional)

### Backend (Render, Heroku, etc)
1. Push to GitHub
2. Connect repository
3. Set environment variables
4. Deploy

### Frontend (Vercel, Netlify, etc)
1. Build: `npm run build`
2. Deploy `dist/` folder
3. Set API endpoint to your backend URL

---

## 📝 Development Notes

### OCR Improvements
- Uses Tesseract for accurate text extraction
- Image preprocessing: contrast enhancement (CLAHE), denoising, sharpening, deskewing
- Fallback to vision API for better handling of rotated/distorted text
- Confidence scoring for extracted data

### Rule Engine (Not LLM)
- Deterministic, reproducible results
- No "AI hallucination" from LLM guessing
- Fast, reliable health scoring
- Only LLM used: final message generation (for tone/wit)

### Misleading Claim Detection
- Checks for 10+ common misleading claims
- Compares claims against actual ingredients
- Severity rating (high/medium/low)
- Examples: "100% fruit" vs high sugar, "natural" vs artificial additives

---

## 🤝 Contributing

Found a bug? Have an improvement?
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and create a Pull Request

---

## 📄 License

MIT License - feel free to use this project!

---

## 🙏 Acknowledgments

- Tesseract OCR team for open-source text recognition
- OpenAI for vision API and language models
- React and FastAPI communities

---

**Last Updated:** April 2026
**Status:** ✅ Full Production Ready
