# 🚀 QUICK START (2 MINUTES)

> For the impatient. Full details in SETUP.md

## Prerequisites
- Python 3.9+
- Node.js 18+
- Tesseract OCR installed
- OpenAI API key

## Run It Now

### Terminal 1: Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

# Add to .env:
# OPENAI_API_KEY=sk-your-key
# TESSERACT_PATH=your-path (Windows users)

python main.py
# ✅ Server running on http://127.0.0.1:8000
```

### Terminal 2: Frontend
```bash
cd frontend
npm install
npm run dev
# ✅ Open http://localhost:3000
```

### Terminal 3: Test
```bash
# Check backend health
curl http://localhost:8000/health

# Should respond:
# {"status":"ok","service":"Food Analyzer API"}
```

---

## 🎯 What to Expect

1. **Upload food image** → Click "Upload Image" or "Scan Product"
2. **AI analyzes** → Shows loading animation (5-10 seconds)
3. **Get verdict** → 🟢 Healthy, 🟡 Okay, or 🔴 Unhealthy
4. **See details** → Nutrition, ingredients, warnings, misleading claims

---

## 📊 Example Result
```
🔴 UNHEALTHY (Score: 35/100)

Key Insights:
🔴 Sugar: 12g = 3 tsp
⚠️ High sugar (12g)
🚨 Contains artificial dyes E102, E110

Misleading Claims Detected:
❌ "100% Natural" 
   Reality: Contains 5 artificial additives

Message: "Natural? This cereal is basically candy with artificial dyes."
```

---

## 🛠️ Stuck?

**Issue:** Port already in use
- Change PORT in backend/.env to 8001

**Issue:** Tesseract not found
- Download from: https://github.com/UB-Mannheim/tesseract/wiki
- Or: `brew install tesseract` (Mac)

**Issue:** API key error
- Get from: https://platform.openai.com/api/keys
- Add to backend/.env

---

See **SETUP.md** for detailed instructions.
