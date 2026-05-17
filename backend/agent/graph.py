# """
# LangGraph graph definition for the Food Analyzer agent.

# Graph flow:
#   START
#     │
#     ▼
#   extract_food_data    ← Vision/OCR node (reads food label images)
#     │
#     ▼
#   analyze_food         ← Analysis node (health verdict + insights)
#     │
#     ▼
#   format_response      ← Formatting node (friendly output)
#     │
#     ▼
#   END
# """

# from langgraph.graph import StateGraph, START, END

# from agent.state import FoodAgentState
# from agent.nodes import extract_food_data, analyze_food, format_response


# def should_continue_after_extraction(state: FoodAgentState) -> str:
#     """
#     Conditional edge: if extraction failed badly, go directly to format_response
#     (which handles errors gracefully) instead of wasting an analysis call.
#     """
#     if state.get("error") and not state.get("raw_ocr_text"):
#         return "format_response"
#     return "analyze_food"


# def build_food_analyzer_graph() -> StateGraph:
#     """
#     Build and compile the Food Analyzer LangGraph.
    
#     Returns:
#         Compiled StateGraph ready to invoke
#     """
#     # Initialize graph with our state schema
#     graph = StateGraph(FoodAgentState)

#     # ── Add nodes ────────────────────────────────────────────────────────────
#     graph.add_node("extract_food_data", extract_food_data)
#     graph.add_node("analyze_food", analyze_food)
#     graph.add_node("format_response", format_response)

#     # ── Add edges ─────────────────────────────────────────────────────────────
#     # Entry point
#     graph.add_edge(START, "extract_food_data")

#     # Conditional edge after extraction
#     graph.add_conditional_edges(
#         "extract_food_data",
#         should_continue_after_extraction,
#         {
#             "analyze_food": "analyze_food",
#             "format_response": "format_response",
#         }
#     )

#     # Analysis always goes to formatting
#     graph.add_edge("analyze_food", "format_response")

#     # Formatting is the last node
#     graph.add_edge("format_response", END)

#     return graph.compile()


# # Convenience: pre-built graph instance
# food_analyzer = build_food_analyzer_graph()


# New code 

"""
LangGraph graph definition for the Food Analyzer agent.

Graph flow (happy path):
  START
    │
    ▼
  validate_input        ← Checks images exist + language is supported
    │
    ▼
  extract_food_data     ← Vision/OCR node (reads food label images)
    │
    ├─ [extraction failed]──► handle_error ──► END
    │
    ▼
  analyze_food          ← Analysis node (health verdict + insights)
    │
    ├─ [analysis failed] ──► handle_error ──► END
    │
    ▼
  format_response       ← Formatting node (friendly multilingual output)
    │
    ▼
  END
"""

import logging
from typing import Literal

from langgraph.graph import StateGraph, START, END

from agent.state import FoodAgentState
from agent.nodes import extract_food_data, analyze_food, format_response

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Supported languages — single source of truth used by validation + routing
# ─────────────────────────────────────────────────────────────────────────────
SUPPORTED_LANGUAGES = {"english", "hindi", "hinglish"}
DEFAULT_LANGUAGE = "english"


# ─────────────────────────────────────────────────────────────────────────────
# INLINE NODE: Input Validation
# Kept here (not in nodes.py) because it is graph-infrastructure logic,
# not a domain/AI node.
# ─────────────────────────────────────────────────────────────────────────────

def validate_input(state: FoodAgentState) -> FoodAgentState:
    """
    Validate user inputs before any expensive LLM calls.

    Checks:
    - At least one image is provided.
    - Language is supported; falls back to DEFAULT_LANGUAGE if not.
    - Sets a structured error in state so handle_error can render it nicely.
    """
    errors: list[str] = []

    # ── Image check ───────────────────────────────────────────────────────────
    images = state.get("images") or state.get("image_paths") or []
    if not images:
        errors.append("No food label images were provided.")
        logger.warning("validate_input: no images in state")

    # ── Language normalisation ────────────────────────────────────────────────
    raw_lang = (state.get("language") or DEFAULT_LANGUAGE).strip().lower()
    if raw_lang not in SUPPORTED_LANGUAGES:
        logger.warning(
            "validate_input: unsupported language '%s', falling back to '%s'",
            raw_lang,
            DEFAULT_LANGUAGE,
        )
        raw_lang = DEFAULT_LANGUAGE

    updates: FoodAgentState = {"language": raw_lang}

    if errors:
        updates["error"] = " | ".join(errors)
        updates["validation_failed"] = True
        logger.error("validate_input: failed — %s", updates["error"])
    else:
        updates["validation_failed"] = False
        logger.info("validate_input: passed (%d image(s), lang=%s)", len(images), raw_lang)

    return updates


# ─────────────────────────────────────────────────────────────────────────────
# INLINE NODE: Error Handler
# Produces a user-friendly formatted error response so the caller always
# receives a well-shaped FoodAgentState regardless of where failure occurred.
# ─────────────────────────────────────────────────────────────────────────────

_ERROR_MESSAGES = {
    "english": (
        "Sorry, we couldn't analyse this product. "
        "{reason} "
        "Please try again with a clearer image of the food label."
    ),
    "hindi": (
        "माफ़ करें, हम इस उत्पाद का विश्लेषण नहीं कर सके। "
        "{reason} "
        "कृपया food label की एक साफ़ तस्वीर के साथ दोबारा कोशिश करें।"
    ),
    "hinglish": (
        "Sorry yaar, is product ko analyse nahi kar sake. "
        "{reason} "
        "Ek clear food label photo ke saath dobara try karein."
    ),
}


def handle_error(state: FoodAgentState) -> FoodAgentState:
    """
    Terminal error node — formats a graceful user-facing error message.
    Always runs when any upstream node sets state['error'].
    """
    lang = state.get("language") or DEFAULT_LANGUAGE
    raw_reason = state.get("error") or "An unexpected error occurred."
    template = _ERROR_MESSAGES.get(lang, _ERROR_MESSAGES[DEFAULT_LANGUAGE])
    friendly_message = template.format(reason=raw_reason)

    logger.error("handle_error: lang=%s reason=%s", lang, raw_reason)

    return {
        "formatted_response": friendly_message,
        "error": raw_reason,           # preserve original for caller/logging
    }


# ─────────────────────────────────────────────────────────────────────────────
# ROUTING FUNCTIONS
# Each returns a string matching a key in the conditional edges map.
# ─────────────────────────────────────────────────────────────────────────────

def _route_after_validation(
    state: FoodAgentState,
) -> Literal["extract_food_data", "handle_error"]:
    if state.get("validation_failed"):
        logger.info("routing: validation_failed → handle_error")
        return "handle_error"
    return "extract_food_data"


def _route_after_extraction(
    state: FoodAgentState,
) -> Literal["analyze_food", "handle_error"]:
    """
    Proceed to analysis only when extraction produced usable data.
    A partial extraction (some nulls) is still usable — only hard-fail on error
    with no OCR text at all.
    """
    if state.get("error") and not state.get("raw_ocr_text"):
        logger.info("routing: extraction hard-failed → handle_error")
        return "handle_error"
    return "analyze_food"


def _route_after_analysis(
    state: FoodAgentState,
) -> Literal["format_response", "handle_error"]:
    """
    Proceed to formatting only when analysis produced a verdict.
    A missing analysis_result with an error means the LLM call failed.
    """
    if state.get("error") and not state.get("analysis_result"):
        logger.info("routing: analysis hard-failed → handle_error")
        return "handle_error"
    return "format_response"


# ─────────────────────────────────────────────────────────────────────────────
# GRAPH BUILDER
# ─────────────────────────────────────────────────────────────────────────────

def build_food_analyzer_graph() -> StateGraph:
    """
    Build and compile the Food Analyzer LangGraph.

    Node responsibilities
    ────────────────────
    validate_input    — Cheap, synchronous guard. Runs before any LLM call.
    extract_food_data — Vision LLM: OCR + structured data extraction.
    analyze_food      — Analysis LLM: health verdict, scores, insights.
    format_response   — Formatting LLM: multilingual, human-friendly output.
    handle_error      — Graceful degradation; always produces a formatted message.

    Returns
    ───────
    Compiled StateGraph ready to invoke via ``food_analyzer.invoke(state)``.
    """
    graph = StateGraph(FoodAgentState)

    # ── Register nodes ────────────────────────────────────────────────────────
    graph.add_node("validate_input",    validate_input)
    graph.add_node("extract_food_data", extract_food_data)
    graph.add_node("analyze_food",      analyze_food)
    graph.add_node("format_response",   format_response)
    graph.add_node("handle_error",      handle_error)

    # ── Entry point ───────────────────────────────────────────────────────────
    graph.add_edge(START, "validate_input")

    # ── Conditional: after validation ─────────────────────────────────────────
    graph.add_conditional_edges(
        "validate_input",
        _route_after_validation,
        {
            "extract_food_data": "extract_food_data",
            "handle_error":      "handle_error",
        },
    )

    # ── Conditional: after extraction ─────────────────────────────────────────
    graph.add_conditional_edges(
        "extract_food_data",
        _route_after_extraction,
        {
            "analyze_food": "analyze_food",
            "handle_error": "handle_error",
        },
    )

    # ── Conditional: after analysis ───────────────────────────────────────────
    graph.add_conditional_edges(
        "analyze_food",
        _route_after_analysis,
        {
            "format_response": "format_response",
            "handle_error":    "handle_error",
        },
    )

    # ── Terminal edges ────────────────────────────────────────────────────────
    graph.add_edge("format_response", END)
    graph.add_edge("handle_error",    END)

    compiled = graph.compile()
    logger.info("Food Analyzer graph compiled successfully.")
    return compiled


# ─────────────────────────────────────────────────────────────────────────────
# Module-level singleton — import and invoke directly:
#   from agent.graph import food_analyzer
#   result = food_analyzer.invoke(initial_state)
# ─────────────────────────────────────────────────────────────────────────────
food_analyzer = build_food_analyzer_graph()