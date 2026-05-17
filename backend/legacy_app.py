"""
Food Analyzer Agent — Streamlit UI
Run with: streamlit run app.py
"""

import os
import sys
import json
import tempfile
import time
from pathlib import Path

import streamlit as st
from dotenv import load_dotenv

load_dotenv()

# ─── Page config (MUST be first Streamlit call) ───────────────────────────────
st.set_page_config(
    page_title="Food Analyzer",
    page_icon="🥗",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─── Custom CSS ───────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

html, body, [class*="css"] {
    font-family: 'DM Sans', sans-serif;
}

h1, h2, h3, .stMarkdown h1, .stMarkdown h2 {
    font-family: 'Syne', sans-serif !important;
}

/* Header */
.hero-header {
    background: linear-gradient(135deg, #0f1117 0%, #1a1f2e 50%, #0d1b2a 100%);
    border-radius: 16px;
    padding: 2.5rem 3rem;
    margin-bottom: 2rem;
    border: 1px solid rgba(99, 255, 172, 0.15);
    position: relative;
    overflow: hidden;
}
.hero-header::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(99,255,172,0.06) 0%, transparent 70%);
    pointer-events: none;
}
.hero-title {
    font-family: 'Syne', sans-serif;
    font-size: 2.8rem;
    font-weight: 800;
    color: #fff;
    margin: 0;
    letter-spacing: -1px;
}
.hero-title span { color: #63ffac; }
.hero-sub {
    color: rgba(255,255,255,0.5);
    font-size: 1rem;
    margin-top: 0.5rem;
    font-weight: 300;
}

/* Upload zone */
.upload-label {
    font-family: 'Syne', sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.4);
    margin-bottom: 0.5rem;
}

/* Verdict cards */
.verdict-card {
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    border: 1px solid;
}
.verdict-healthy  { background: rgba(34,197,94,0.08);  border-color: rgba(34,197,94,0.3);  }
.verdict-okay     { background: rgba(234,179,8,0.08);  border-color: rgba(234,179,8,0.3);  }
.verdict-unhealthy{ background: rgba(239,68,68,0.08);  border-color: rgba(239,68,68,0.3);  }
.verdict-junk     { background: rgba(239,68,68,0.1);   border-color: rgba(239,68,68,0.4);  }
.verdict-unknown  { background: rgba(148,163,184,0.08);border-color: rgba(148,163,184,0.3);}

.verdict-badge {
    display: inline-block;
    padding: 0.25rem 0.9rem;
    border-radius: 20px;
    font-family: 'Syne', sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
}
.badge-healthy  { background: rgba(34,197,94,0.2);  color: #4ade80; }
.badge-okay     { background: rgba(234,179,8,0.2);  color: #facc15; }
.badge-unhealthy{ background: rgba(239,68,68,0.2);  color: #f87171; }
.badge-junk     { background: rgba(239,68,68,0.25); color: #f87171; }
.badge-unknown  { background: rgba(148,163,184,0.2);color: #94a3b8; }

/* Metric chips */
.metric-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 0.75rem;
    margin-top: 1rem;
}
.metric-chip {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 0.75rem;
    text-align: center;
}
.metric-value {
    font-family: 'Syne', sans-serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: #fff;
}
.metric-label {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 2px;
}

/* Ingredient tags */
.tag-row { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem; }
.tag {
    font-size: 0.75rem;
    padding: 0.2rem 0.7rem;
    border-radius: 20px;
    font-weight: 500;
}
.tag-additive { background: rgba(251,146,60,0.15); color: #fb923c; border: 1px solid rgba(251,146,60,0.3); }
.tag-allergen { background: rgba(239,68,68,0.15);  color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
.tag-good     { background: rgba(34,197,94,0.12);  color: #4ade80; border: 1px solid rgba(34,197,94,0.25); }
.tag-neutral  { background: rgba(148,163,184,0.1); color: #94a3b8; border: 1px solid rgba(148,163,184,0.2); }

/* Insight cards */
.insight-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}
.insight-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    margin-top: 5px;
    flex-shrink: 0;
}

/* Sidebar */
section[data-testid="stSidebar"] {
    background: #0d1117;
    border-right: 1px solid rgba(255,255,255,0.06);
}

/* Buttons */
.stButton > button {
    background: linear-gradient(135deg, #63ffac, #22d3ee) !important;
    color: #0d1117 !important;
    font-family: 'Syne', sans-serif !important;
    font-weight: 700 !important;
    border: none !important;
    border-radius: 10px !important;
    padding: 0.6rem 1.5rem !important;
    font-size: 0.85rem !important;
    letter-spacing: 0.5px !important;
    width: 100% !important;
    transition: opacity 0.2s !important;
}
.stButton > button:hover { opacity: 0.85 !important; }

/* Section headers */
.section-header {
    font-family: 'Syne', sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    margin-bottom: 0.75rem;
    margin-top: 1.5rem;
}

/* Response box */
.response-box {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    line-height: 1.8;
    color: rgba(255,255,255,0.85);
    font-size: 0.95rem;
    white-space: pre-wrap;
}

/* Progress */
.stProgress > div > div { background: linear-gradient(90deg, #63ffac, #22d3ee) !important; }

/* Expander */
details { border: 1px solid rgba(255,255,255,0.08) !important; border-radius: 10px !important; }
summary { font-family: 'Syne', sans-serif !important; font-size: 0.85rem !important; }

/* File uploader */
[data-testid="stFileUploaderDropzone"] {
    background: rgba(255,255,255,0.02) !important;
    border: 1.5px dashed rgba(99,255,172,0.25) !important;
    border-radius: 12px !important;
}

/* Divider */
hr { border-color: rgba(255,255,255,0.06) !important; }
</style>
""", unsafe_allow_html=True)


# ─── Helper: check API key ─────────────────────────────────────────────────────
def get_api_key() -> str | None:
    # Sidebar override first, then env
    sidebar_key = st.session_state.get("api_key_input", "").strip()
    if sidebar_key:
        return sidebar_key
    return os.environ.get("OPENAI_API_KEY", "").strip() or None


def run_agent(image_paths: list[str], user_message: str | None, api_key: str, language: str = "english") -> dict:
    """Run the food analyzer agent and return the result dict."""
    os.environ["OPENAI_API_KEY"] = api_key

    # Import here so env var is already set
    from agent.graph import build_food_analyzer_graph
    from agent.state import FoodAgentState

    graph = build_food_analyzer_graph()

    initial_state: FoodAgentState = {
        "image_paths": image_paths,
        "user_message": user_message or None,
        "language": language,
        "raw_ocr_text": "",
        "extracted_nutrition": None,
        "extracted_ingredients": None,
        "product_name": None,
        "food_analysis": None,
        "final_response": None,
        "error": None,
    }
    return graph.invoke(initial_state)


# ─── Verdict helpers ──────────────────────────────────────────────────────────
VERDICT_CLASS = {
    "HEALTHY": ("verdict-healthy", "badge-healthy", "🟢"),
    "OKAY":    ("verdict-okay",    "badge-okay",    "🟡"),
    "UNHEALTHY":("verdict-unhealthy","badge-unhealthy","🔴"),
    "JUNK":    ("verdict-junk",    "badge-junk",    "🔴"),
}

def verdict_classes(v: str):
    return VERDICT_CLASS.get(v.upper(), ("verdict-unknown", "badge-unknown", "⚪"))


# ─── Sidebar ──────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("### ⚙️ Configuration")
    st.markdown("---")

    api_key_input = st.text_input(
        "OpenAI API Key",
        type="password",
        placeholder="sk-...",
        key="api_key_input",
        help="Leave blank to use OPENAI_API_KEY from .env",
    )

    st.markdown("---")
    st.markdown("### 🌐 Language")
    language_option = st.selectbox(
        "Select Language",
        options=["English", "Hindi", "Hinglish"],
        key="language_option",
        help="Choose the language for the response",
    )
    language_map = {"English": "english", "Hindi": "hindi", "Hinglish": "hinglish"}
    selected_language = language_map[language_option]

    st.markdown("---")
    st.markdown("### 💬 Optional Context")
    user_question = st.text_area(
        "Ask a specific question",
        placeholder="e.g. Is this safe for diabetics?\nIs this vegan-friendly?",
        height=100,
        key="user_question",
    )

    st.markdown("---")
    st.markdown("""
    <div style='color:rgba(255,255,255,0.3);font-size:0.75rem;line-height:1.7'>
    <b style='color:rgba(255,255,255,0.5)'>How it works</b><br>
    1. Upload food label image(s)<br>
    2. Agent extracts nutrition + ingredients via vision OCR<br>
    3. AI analyzes health impact<br>
    4. Get a clear verdict + insights
    </div>
    """, unsafe_allow_html=True)


# ─── Main content ──────────────────────────────────────────────────────────────
st.markdown("""
<div class="hero-header">
    <div class="hero-title">🥗 Food <span>Analyzer</span></div>
    <div class="hero-sub">Upload a food label · Get an instant health verdict powered by AI</div>
</div>
""", unsafe_allow_html=True)

# Upload section
st.markdown('<div class="upload-label">Upload Food Label Images</div>', unsafe_allow_html=True)
uploaded_files = st.file_uploader(
    "label",
    type=["jpg", "jpeg", "png", "webp"],
    accept_multiple_files=True,
    label_visibility="collapsed",
)

if uploaded_files:
    cols = st.columns(min(len(uploaded_files), 4))
    for i, f in enumerate(uploaded_files):
        with cols[i % len(cols)]:
            st.image(f, caption=f.name, use_container_width=True)

st.markdown("")
col_btn, col_spacer = st.columns([1, 3])
with col_btn:
    analyze_btn = st.button("🔍 Analyze Food Label", disabled=not uploaded_files)

# ─── Analysis ─────────────────────────────────────────────────────────────────
if analyze_btn and uploaded_files:
    api_key = get_api_key()
    if not api_key:
        st.error("❌ No API key found. Enter your OpenAI API key in the sidebar or set OPENAI_API_KEY in .env")
        st.stop()

    # Save uploaded files to temp dir
    with tempfile.TemporaryDirectory() as tmpdir:
        image_paths = []
        for f in uploaded_files:
            dest = Path(tmpdir) / f.name
            dest.write_bytes(f.read())
            image_paths.append(str(dest))

        user_msg = st.session_state.get("user_question", "").strip() or None
        lang = st.session_state.get("language_option", "English")
        language = language_map[lang]

        # Progress
        progress_bar = st.progress(0)
        status = st.empty()

        steps = [
            (0.15, "👁️  Reading food label images…"),
            (0.45, "🧪 Extracting nutrition & ingredients…"),
            (0.75, "🤖 Running health analysis…"),
            (0.95, "✍️  Formatting results…"),
        ]

        import threading

        result_holder = {}
        error_holder = {}

        def run_in_thread():
            try:
                result_holder["result"] = run_agent(image_paths, user_msg, api_key, language)
            except Exception as e:
                error_holder["error"] = str(e)

        thread = threading.Thread(target=run_in_thread)
        thread.start()

        step_idx = 0
        while thread.is_alive():
            if step_idx < len(steps):
                pct, msg = steps[step_idx]
                progress_bar.progress(pct)
                status.markdown(f"<div style='color:rgba(255,255,255,0.6);font-size:0.9rem'>{msg}</div>", unsafe_allow_html=True)
                step_idx += 1
            time.sleep(2.5)

        thread.join()
        progress_bar.progress(1.0)
        status.markdown("<div style='color:#63ffac;font-size:0.9rem'>✅ Analysis complete!</div>", unsafe_allow_html=True)
        time.sleep(0.5)
        progress_bar.empty()
        status.empty()

    if "error" in error_holder:
        st.error(f"❌ Agent error: {error_holder['error']}")
        st.stop()

    result = result_holder.get("result", {})

    # ── Store in session for display
    st.session_state["last_result"] = result


# ─── Display results ───────────────────────────────────────────────────────────
if "last_result" in st.session_state:
    result = st.session_state["last_result"]
    analysis = result.get("food_analysis") or {}
    nutrition = result.get("extracted_nutrition") or {}
    ingredients = result.get("extracted_ingredients") or {}
    product_name = result.get("product_name", "Unknown Product")
    final_response = result.get("final_response", "")
    error = result.get("error")

    st.markdown("---")

    if error and not analysis:
        st.error(f"❌ {error}")
    else:
        verdict = (analysis.get("overall_verdict") or "UNKNOWN").upper()
        emoji = analysis.get("verdict_emoji", "🤔")
        card_cls, badge_cls, dot = verdict_classes(verdict)

        # ────────── MAIN VERDICT CARD (Prominent) ──────────────
        st.markdown(f"""
        <div class="verdict-card {card_cls}">
            <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
                <span style="font-family:'Syne',sans-serif;font-size:2.5rem">{emoji}</span>
                <div>
                    <div style="font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:800;color:#fff">{product_name}</div>
                    <span class="verdict-badge {badge_cls}">{verdict}</span>
                </div>
            </div>
            <div style="margin-top:1.25rem;color:rgba(255,255,255,0.8);font-size:1rem;line-height:1.7;font-weight:500">
                {analysis.get("short_summary", "")}
            </div>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("")

        # ────────── FRIENDLY AI VERDICT MESSAGE (Primary) ──────────────
        if final_response:
            st.markdown(f"""
            <div style="background:linear-gradient(135deg, rgba(99,255,172,0.05), rgba(34,211,238,0.05));
                        border:1px solid rgba(99,255,172,0.2);border-radius:12px;padding:1.5rem;
                        font-size:0.95rem;line-height:1.8;color:rgba(255,255,255,0.85)">
                {final_response.replace(chr(10), '<br>')}
            </div>
            """, unsafe_allow_html=True)
            st.markdown("")

        # ────────── KEY INSIGHTS (Quick scan) ──────────────
        insights = analysis.get("nutrition_insights", [])
        comparisons = analysis.get("fun_comparisons", [])
        
        if insights or comparisons:
            col_left, col_right = st.columns(2)
            
            with col_left:
                if insights:
                    st.markdown('<div class="section-header">💡 Quick Insight</div>', unsafe_allow_html=True)
                    for ins in insights:
                        st.markdown(f"""
                        <div class="insight-item">
                            <div class="insight-dot" style="background:#22d3ee"></div>
                            <div style="font-size:0.9rem;color:rgba(255,255,255,0.75);font-weight:500">{ins}</div>
                        </div>
                        """, unsafe_allow_html=True)
            
            with col_right:
                if comparisons:
                    st.markdown('<div class="section-header">📊 Reality Check</div>', unsafe_allow_html=True)
                    for comp in comparisons:
                        st.markdown(f"""
                        <div class="insight-item">
                            <div class="insight-dot" style="background:#a78bfa"></div>
                            <div style="font-size:0.9rem;color:rgba(255,255,255,0.75);font-weight:500">{comp}</div>
                        </div>
                        """, unsafe_allow_html=True)

        # ────────── HARMFUL + OKAY INGREDIENTS (Key analysis) ──────────────
        harmful = analysis.get("harmful_ingredients", [])
        okay = analysis.get("okay_ingredients", [])

        if harmful or okay:
            st.markdown('<div class="section-header">Ingredient Analysis</div>', unsafe_allow_html=True)
            c1, c2 = st.columns(2)

            with c1:
                if harmful:
                    st.markdown("**⚠️ Watch out for**")
                    for item in harmful:
                        name = item.get("name", "")
                        why  = item.get("why_harmful", "")
                        st.markdown(f"""
                        <div class="insight-item">
                            <div class="insight-dot" style="background:#f87171"></div>
                            <div>
                                <div style="font-weight:600;font-size:0.85rem;color:#fff">{name}</div>
                                <div style="font-size:0.8rem;color:rgba(255,255,255,0.5)">{why}</div>
                            </div>
                        </div>
                        """, unsafe_allow_html=True)

            with c2:
                if okay:
                    st.markdown("**✅ Good stuff**")
                    tags = "".join(f'<span class="tag tag-good">{o}</span>' for o in okay)
                    st.markdown(f'<div class="tag-row">{tags}</div>', unsafe_allow_html=True)

        st.markdown("")

        # ────────── DETAILED DATA (Collapsible) ──────────────
        with st.expander("📋 Detailed Nutrition & Ingredients"):
            col_left, col_right = st.columns(2)

            with col_left:
                st.markdown('<div class="section-header">Nutrition Facts</div>', unsafe_allow_html=True)
                chips = [
                    ("energy_kcal_per_100g", "kcal/100g", "Energy"),
                    ("protein_g",            "g",         "Protein"),
                    ("carbs_g",              "g",         "Carbs"),
                    ("sugar_g",              "g",         "Sugar"),
                    ("fat_g",                "g",         "Fat"),
                    ("saturated_fat_g",      "g",         "Sat. Fat"),
                    ("trans_fat_g",          "g",         "Trans Fat"),
                    ("sodium_mg",            "mg",        "Sodium"),
                    ("fiber_g",              "g",         "Fiber"),
                ]
                chip_html = '<div class="metric-grid">'
                for key, unit, label in chips:
                    val = nutrition.get(key)
                    display = f"{val}{unit}" if val is not None else "—"
                    chip_html += f'<div class="metric-chip"><div class="metric-value">{display}</div><div class="metric-label">{label}</div></div>'
                chip_html += "</div>"

                serving = nutrition.get("serving_size_g")
                servings = nutrition.get("servings_per_package")
                if serving or servings:
                    info = []
                    if serving:  info.append(f"Serving: {serving}g")
                    if servings: info.append(f"Servings/pkg: {servings}")
                    chip_html += f'<div style="margin-top:0.75rem;font-size:0.8rem;color:rgba(255,255,255,0.35);">{" · ".join(info)}</div>'

                st.markdown(chip_html, unsafe_allow_html=True)

            with col_right:
                st.markdown('<div class="section-header">Ingredients</div>', unsafe_allow_html=True)

                # Additives
                additives = ingredients.get("additives", [])
                if additives:
                    tags = "".join(f'<span class="tag tag-additive">{a}</span>' for a in additives)
                    st.markdown(f'<div style="font-size:0.75rem;color:rgba(255,255,255,0.35);margin-bottom:4px">⚗️ Additives</div><div class="tag-row">{tags}</div>', unsafe_allow_html=True)

                # Allergens
                allergens = ingredients.get("allergens", [])
                if allergens:
                    tags = "".join(f'<span class="tag tag-allergen">{a}</span>' for a in allergens)
                    st.markdown(f'<div style="font-size:0.75rem;color:rgba(255,255,255,0.35);margin-bottom:4px;margin-top:0.75rem">⚠️ Allergens</div><div class="tag-row">{tags}</div>', unsafe_allow_html=True)

                # Ingredient list (collapsible)
                ing_list = ingredients.get("ingredient_list", [])
                if ing_list:
                    with st.expander(f"All Ingredients ({len(ing_list)})"):
                        tags = "".join(f'<span class="tag tag-neutral">{i}</span>' for i in ing_list)
                        st.markdown(f'<div class="tag-row">{tags}</div>', unsafe_allow_html=True)
                elif ingredients.get("raw_ingredients_text"):
                    with st.expander("Ingredients Text"):
                        st.markdown(f'<div style="font-size:0.85rem;color:rgba(255,255,255,0.6)">{ingredients["raw_ingredients_text"]}</div>', unsafe_allow_html=True)

                # Ingredient impact summary inside detailed section
                ingredient_text = ingredients.get("raw_ingredients_text", "") or ""
                impact_lines = []
                if additives:
                    impact_lines.append(
                        f"I see {len(additives)} additives/preservatives here, so this feels more like processed food than something your body can relax around."
                    )
                if "artificial" in ingredient_text.lower() or "flavour" in ingredient_text.lower() or "flavor" in ingredient_text.lower():
                    impact_lines.append(
                        "Artificial colours and flavours are mainly for taste and look — not nutrition. Your body has to deal with extra chemicals for no real benefit."
                    )
                if "preservative" in ingredient_text.lower() or "ins" in ingredient_text.lower():
                    impact_lines.append(
                        "Preservatives help the product last longer, but they also mean your liver and gut have to work harder than they would on fresher food."
                    )
                if not impact_lines:
                    impact_lines.append(
                        "No obvious preservative or artificial-flavour warning was found here, but it’s always good to double-check the full ingredient list."
                    )

                st.markdown('<div class="section-header">Ingredient Impact</div>', unsafe_allow_html=True)
                st.markdown(
                    '<div style="font-size:0.95rem;color:rgba(255,255,255,0.78);line-height:1.6">' +
                    '<br>'.join(impact_lines) +
                    '</div>',
                    unsafe_allow_html=True,
                )

        # ── Raw JSON debug
        with st.expander("🔧 Raw data (debug)"):
            st.json(result)