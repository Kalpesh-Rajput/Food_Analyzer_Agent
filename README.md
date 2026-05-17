# 🥗 Food Analyzer

A premium, web-first food analyzer project with a clean backend/frontend separation.

## 📁 New Architecture

```
food_analyzer_agent/
├── backend/             # Python API + agent logic
│   ├── agent/           # LangGraph agent modules
│   ├── utils/           # image helpers and validation
│   ├── tests/           # backend unit tests
│   ├── sample_images/   # legacy test images
│   ├── api.py           # FastAPI backend entrypoint
│   ├── main.py          # CLI entrypoint (legacy)
│   ├── legacy_app.py    # Streamlit prototype UI
│   ├── requirements.txt
│   ├── pytest.ini
│   └── .env.example
├── frontend/            # React dashboard UI
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── styles.css
│       └── types.ts
├── .gitignore
└── README.md
```

## 🚀 Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate    # Windows
pip install -r requirements.txt
```

Create a `.env` file from the example:

```bash
copy .env.example .env
```

Then run the backend API:

```bash
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL shown by Vite (usually `http://localhost:5173`).

## 🔧 Notes

- The frontend sends uploads to `http://localhost:8000/analyze`.
- The backend serves the AI analysis using the existing LangGraph agent logic.
- The React UI is designed as a premium dashboard experience with upload, webcam capture, and verdict cards.

## 🧪 Backend CLI (Legacy)

The old CLI entrypoint remains under `backend/main.py`.

```bash
cd backend
python main.py analyze --images ./sample_images/noodles.jpg
```

## 📌 Environment

Your backend `.env` should include:

```text
OPENAI_API_KEY=sk-your-key-here
LLM_PROVIDER=openai
```

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
