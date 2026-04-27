"""
LangGraph graph definition for the Food Analyzer agent.

Graph flow:
  START
    │
    ▼
  extract_food_data    ← Vision/OCR node (reads food label images)
    │
    ▼
  analyze_food         ← Analysis node (health verdict + insights)
    │
    ▼
  format_response      ← Formatting node (friendly output)
    │
    ▼
  END
"""

from langgraph.graph import StateGraph, START, END

from agent.state import FoodAgentState
from agent.nodes import extract_food_data, analyze_food, format_response


def should_continue_after_extraction(state: FoodAgentState) -> str:
    """
    Conditional edge: if extraction failed badly, go directly to format_response
    (which handles errors gracefully) instead of wasting an analysis call.
    """
    if state.get("error") and not state.get("raw_ocr_text"):
        return "format_response"
    return "analyze_food"


def build_food_analyzer_graph() -> StateGraph:
    """
    Build and compile the Food Analyzer LangGraph.
    
    Returns:
        Compiled StateGraph ready to invoke
    """
    # Initialize graph with our state schema
    graph = StateGraph(FoodAgentState)

    # ── Add nodes ────────────────────────────────────────────────────────────
    graph.add_node("extract_food_data", extract_food_data)
    graph.add_node("analyze_food", analyze_food)
    graph.add_node("format_response", format_response)

    # ── Add edges ─────────────────────────────────────────────────────────────
    # Entry point
    graph.add_edge(START, "extract_food_data")

    # Conditional edge after extraction
    graph.add_conditional_edges(
        "extract_food_data",
        should_continue_after_extraction,
        {
            "analyze_food": "analyze_food",
            "format_response": "format_response",
        }
    )

    # Analysis always goes to formatting
    graph.add_edge("analyze_food", "format_response")

    # Formatting is the last node
    graph.add_edge("format_response", END)

    return graph.compile()


# Convenience: pre-built graph instance
food_analyzer = build_food_analyzer_graph()
