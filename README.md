# 🥗 Food Analyzer Agent

> AI-powered food label analyzer built with **LangGraph + Claude Vision**.  
> Upload a photo of any packaged food → get an honest health verdict instantly.

This is the **agent logic prototype** for your startup idea. Once validated, this backend plugs directly into your Android/iOS app.

---

## 🏗️ Architecture

```
User uploads food label image(s)
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    LangGraph Agent                          │
│                                                             │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │  Node 1          │    │  Node 2          │              │
│  │  extract_food_   │───▶│  analyze_food    │              │
│  │  data            │    │                  │              │
│  │                  │    │  • Health verdict│              │
│  │  • Claude Vision │    │  • Flag bad      │              │
│  │  • OCR           │    │    ingredients   │              │
│  │  • JSON extract  │    │  • Nutrition     │              │
│  └──────────────────┘    │    insights      │              │
│                          │  • Fun numbers   │              │
│                          └────────┬─────────┘              │
│                                   │                         │
│                          ┌────────▼─────────┐              │
│                          │  Node 3          │              │
│                          │  format_response │              │
│                          │                  │              │
│                          │  • Friendly text │              │
│                          │  • Witty tone    │              │
│                          │  • Buy/Avoid     │              │
│                          └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
  Honest health verdict delivered
```

## 📁 Project Structure

```
food_analyzer_agent/
├── agent/
│   ├── __init__.py
│   ├── state.py          # TypedDict state definition
│   ├── prompts.py        # All LLM prompts (extraction, analysis, format)
│   ├── nodes.py          # The 3 LangGraph node functions
│   └── graph.py          # LangGraph graph + conditional edges
├── utils/
│   ├── __init__.py
│   └── image_utils.py    # Image loading, base64 encoding, JSON parsing
├── tests/
│   ├── __init__.py
│   └── test_agent.py     # Unit tests + live tests
├── sample_images/        # Put your test food label images here
├── main.py               # CLI (analyze / demo / interactive)
├── quick_test.py         # Minimal test script
├── requirements.txt
├── pytest.ini
├── .env.example
└── README.md
```

---

## ⚡ Quick Start

### 1. Clone & Setup

```bash
# Navigate to the project folder
cd food_analyzer_agent

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure API Key

```bash
cp .env.example .env
```

Edit `.env`:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get your key at: https://console.anthropic.com

### 3. Run Your First Test

```bash
# Mock test (no API key needed — tests logic only)
python quick_test.py --mock

# Test with real food label images
python quick_test.py path/to/ingredients.jpg path/to/nutrition.jpg
```

---

## 🖥️ CLI Usage

### Analyze images directly:
```bash
python main.py analyze --images ./sample_images/noodles.jpg
```

### Analyze multiple images (e.g. front + nutrition label):
```bash
python main.py analyze --images ./img1.jpg ./img2.jpg
```

### With a specific question:
```bash
python main.py analyze --images ./label.jpg --message "is this safe for diabetics?"
```

### Verbose mode (see each node's output):
```bash
python main.py analyze --images ./label.jpg --verbose
```

### Interactive mode (keep analyzing products):
```bash
python main.py interactive
```

### Demo mode (reads from ./sample_images/ folder):
```bash
python main.py demo
```

---

## 🧪 Running Tests

```bash
# Run all unit tests (no API key needed)
pytest tests/ -v -m "not live"

# Run live tests (needs API key + images in sample_images/)
pytest tests/ -v -m live

# Run everything
pytest tests/ -v
```

---

## 🤖 How the Agent Works

### State Flow

```python
FoodAgentState = {
    # INPUT
    "image_paths": ["./label.jpg"],
    "user_message": "optional question",

    # AFTER NODE 1 (extraction)
    "product_name": "Maggi Noodles",
    "extracted_nutrition": { "sodium_mg": 1247, "fat_g": 20.1, ... },
    "extracted_ingredients": { "ingredient_list": [...], "additives": [...] },
    "raw_ocr_text": "...",

    # AFTER NODE 2 (analysis)
    "food_analysis": {
        "overall_verdict": "UNHEALTHY",
        "harmful_ingredients": [...],
        "fun_comparisons": ["Sugar = 3 teaspoons", ...],
        "buy_or_avoid": "Skip it.",
        ...
    },

    # AFTER NODE 3 (formatting)
    "final_response": "🔴 VERDICT: UNHEALTHY\n..."
}
```

### What Gets Flagged

| Issue | Threshold |
|-------|-----------|
| Trans fat | Any amount > 0 |
| High sodium | > 400mg per serving |
| High sugar | > 5g per serving |
| Saturated fat | > 10% daily RDA |
| Ultra-processed | Maida as primary ingredient |
| Additives | Multiple INS codes present |
| Flavour enhancers | INS 627, 631 (purine concern) |

---

## 📱 Integrating Into Your Android/iOS App (Next Steps)

This agent is designed as a pure Python backend. When you're ready to build the mobile app:

### Option A: FastAPI REST endpoint
```python
# api.py (add this later)
from fastapi import FastAPI, UploadFile
from agent.graph import food_analyzer

app = FastAPI()

@app.post("/analyze")
async def analyze_food(files: list[UploadFile]):
    # save files → run agent → return JSON
    ...
```

### Option B: Firebase Function / Cloud Run
Deploy `api.py` to Google Cloud Run and call it from your mobile app.

### Option C: Direct SDK (React Native)
Use the Anthropic SDK directly in React Native with vision capabilities.

---

## 🔑 Key Design Decisions

**Why LangGraph?**
- Each node is independently testable
- Easy to add new nodes (e.g. allergen checker, price analyzer)
- Built-in state management — no manual passing of data
- Ready for async/streaming when you need it for the app

**Why Claude Vision?**
- Best-in-class OCR for food labels
- Single API handles both image reading AND analysis
- Handles multiple images in one call (ingredients + nutrition on separate panels)

**Why 3 nodes instead of 1?**
- Separation of concerns: extract → analyze → format
- If extraction fails, you still get a graceful error
- Can swap the analysis logic without touching OCR logic
- Easier to debug which step failed

---

## 🚀 Roadmap for Full App

- [ ] FastAPI server wrapping this agent
- [ ] Support for camera stream (base64 from mobile)
- [ ] Barcode scanning → auto product lookup
- [ ] User profile (allergies, dietary restrictions)
- [ ] History tracking (what they've scanned)
- [ ] Comparison mode (product A vs product B)
- [ ] Android/iOS app with camera integration

---

## 📝 License

MIT — use freely for your startup.
