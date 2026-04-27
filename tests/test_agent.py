"""
Tests for the Food Analyzer Agent.

Run with:
    pytest tests/ -v

For tests that make real API calls (marked 'live'), you need ANTHROPIC_API_KEY set.
Skip live tests:
    pytest tests/ -v -m "not live"
"""

import json
import os
import pytest
from unittest.mock import MagicMock, patch

# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

MOCK_EXTRACTION_RESULT = {
    "product_name": "Test Instant Noodles",
    "serving_size_g": 30,
    "servings_per_package": None,
    "nutrition": {
        "energy_kcal_per_100g": 459,
        "carbs_g": 62.6,
        "sugar_g": 3.0,
        "added_sugar_g": 1.6,
        "fat_g": 20.1,
        "saturated_fat_g": 10.7,
        "trans_fat_g": 0.1,
        "sodium_mg": 1247.1,
        "protein_g": 9.0,
        "fiber_g": None,
    },
    "ingredients": {
        "raw_text": "Refined Wheat Flour (Maida) (78.4%), Refined Palm Oil, ...",
        "ingredient_list": [
            "Refined Wheat Flour (Maida)",
            "Refined Palm Oil",
            "Iodized Salt",
            "Wheat Gluten",
        ],
        "additives": ["INS 508", "INS 412", "INS 170(i)", "INS 627", "INS 631"],
        "allergens": ["wheat", "gluten"],
        "preservatives": [],
    }
}

MOCK_ANALYSIS_RESULT = {
    "overall_verdict": "UNHEALTHY",
    "verdict_emoji": "🔴",
    "verdict_color": "red",
    "harmful_ingredients": [
        {"name": "Refined Palm Oil", "why_harmful": "High in saturated fats, linked to heart disease"},
        {"name": "Trans Fat (0.1g)", "why_harmful": "Raises bad cholesterol, increases heart disease risk"},
        {"name": "INS 627, INS 631 (Flavour Enhancers)", "why_harmful": "Contain purines, concern for gout-prone individuals"},
    ],
    "okay_ingredients": ["Carrot", "Beans", "Onion", "Cabbage", "Spices"],
    "nutrition_insights": [
        "Sodium is sky-high at 1247mg/100g",
        "Saturated fat makes up 53% of total fat",
        "Primary ingredient is refined flour — almost zero fiber",
    ],
    "fun_comparisons": [
        "Sugar = ~1 teaspoon per serving",
        "Sodium = 18.7% of your daily limit per serving",
        "Saturated fat = 14.6% of daily recommended intake per serving",
        "You'd need to walk ~1.5 km to burn off one serving",
    ],
    "buy_or_avoid": "Skip it — it's tasty, but it's basically a sodium bomb in a packet.",
    "short_summary": "Classic ultra-processed instant noodles. Maida is the star, nutrients are the extras. High sodium, trans fat, and palm oil make this a 'once-in-a-while' at best. If you eat it daily, your heart will eventually send a complaint.",
}


# ─────────────────────────────────────────────────────────────────────────────
# Unit Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestImageUtils:
    """Tests for image utility functions."""

    def test_safe_json_parse_clean_json(self):
        """Should parse clean JSON correctly."""
        from utils.image_utils import safe_json_parse
        data = '{"key": "value", "number": 42}'
        result = safe_json_parse(data)
        assert result == {"key": "value", "number": 42}

    def test_safe_json_parse_with_markdown_fences(self):
        """Should strip markdown code fences before parsing."""
        from utils.image_utils import safe_json_parse
        data = '```json\n{"key": "value"}\n```'
        result = safe_json_parse(data)
        assert result == {"key": "value"}

    def test_safe_json_parse_embedded_json(self):
        """Should extract JSON even if there's surrounding text."""
        from utils.image_utils import safe_json_parse
        data = 'Here is the result:\n{"key": "value"}\nDone.'
        result = safe_json_parse(data)
        assert result == {"key": "value"}

    def test_safe_json_parse_invalid(self):
        """Should return None for unparseable text."""
        from utils.image_utils import safe_json_parse
        result = safe_json_parse("This is not JSON at all")
        assert result is None

    def test_validate_image_paths_nonexistent(self, tmp_path):
        """Should filter out non-existent paths."""
        from utils.image_utils import validate_image_paths
        result = validate_image_paths(["/nonexistent/path/image.jpg"])
        assert result == []

    def test_validate_image_paths_valid(self, tmp_path):
        """Should include valid, existing image paths."""
        from utils.image_utils import validate_image_paths
        # Create a dummy file
        img = tmp_path / "test.jpg"
        img.write_bytes(b"fake jpeg data")
        result = validate_image_paths([str(img)])
        assert str(img) in result


class TestAgentNodes:
    """Tests for agent node functions (mocked)."""

    def test_extract_node_no_images(self):
        """Extract node should return error if no images provided."""
        from agent.nodes import extract_food_data

        state = {
            "image_paths": [],
            "user_message": None,
            "raw_ocr_text": "",
            "extracted_nutrition": None,
            "extracted_ingredients": None,
            "product_name": None,
            "food_analysis": None,
            "final_response": None,
            "error": None,
        }
        result = extract_food_data(state)
        assert "error" in result
        assert result["error"] is not None

    @patch("agent.nodes.get_llm")
    def test_extract_node_mocked(self, mock_get_llm):
        """Extract node should parse valid LLM JSON response."""
        from agent.nodes import extract_food_data
        import tempfile
        from PIL import Image as PILImage
        import io

        # Create a real temporary image file
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
            img = PILImage.new("RGB", (100, 100), color=(255, 128, 0))
            img.save(f, format="JPEG")
            temp_path = f.name

        # Mock the LLM response
        mock_response = MagicMock()
        mock_response.content = json.dumps(MOCK_EXTRACTION_RESULT)
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = mock_response
        mock_get_llm.return_value = mock_llm

        state = {
            "image_paths": [temp_path],
            "user_message": None,
            "raw_ocr_text": "",
            "extracted_nutrition": None,
            "extracted_ingredients": None,
            "product_name": None,
            "food_analysis": None,
            "final_response": None,
            "error": None,
        }

        result = extract_food_data(state)

        assert result.get("error") is None
        assert result.get("product_name") == "Test Instant Noodles"
        assert result.get("extracted_nutrition") is not None
        assert result.get("extracted_ingredients") is not None
        assert result["extracted_nutrition"]["sodium_mg"] == 1247.1

        os.unlink(temp_path)

    # @patch("agent.nodes._get_llm")
    @patch("agent.nodes.get_llm")
    def test_analyze_node_mocked(self, mock_get_llm):
        """Analyze node should parse verdict from LLM response."""
        from agent.nodes import analyze_food

        mock_response = MagicMock()
        mock_response.content = json.dumps(MOCK_ANALYSIS_RESULT)
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = mock_response
        mock_get_llm.return_value = mock_llm

        state = {
            "image_paths": [],
            "user_message": None,
            "raw_ocr_text": json.dumps(MOCK_EXTRACTION_RESULT),
            "extracted_nutrition": MOCK_EXTRACTION_RESULT["nutrition"],
            "extracted_ingredients": MOCK_EXTRACTION_RESULT["ingredients"],
            "product_name": "Test Instant Noodles",
            "food_analysis": None,
            "final_response": None,
            "error": None,
        }

        result = analyze_food(state)

        assert result.get("error") is None
        analysis = result.get("food_analysis")
        assert analysis is not None
        assert analysis["overall_verdict"] == "UNHEALTHY"
        assert len(analysis["harmful_ingredients"]) > 0
        assert len(analysis["fun_comparisons"]) > 0

    # @patch("agent.nodes._get_llm")
    @patch("agent.nodes.get_llm")
    def test_format_node_with_error(self, mock_get_llm):
        """Format node should handle error state gracefully."""
        from agent.nodes import format_response

        state = {
            "image_paths": [],
            "user_message": None,
            "raw_ocr_text": "",
            "extracted_nutrition": None,
            "extracted_ingredients": None,
            "product_name": None,
            "food_analysis": None,
            "final_response": None,
            "error": "Image file not found",
        }

        result = format_response(state)
        assert "final_response" in result
        assert "wrong" in result["final_response"].lower() or "error" in result["final_response"].lower()

    # @patch("agent.nodes._get_llm")
    @patch("agent.nodes.get_llm")
    def test_format_node_fallback_response(self, mock_get_llm):
        """Format node should build fallback if LLM fails."""
        from agent.nodes import _build_fallback_response

        response = _build_fallback_response(MOCK_ANALYSIS_RESULT, "Test Noodles")
        assert "UNHEALTHY" in response
        assert "Test Noodles" in response or "noodles" in response.lower()
        assert "Palm Oil" in response or "Trans" in response


class TestGraphStructure:
    """Tests for the LangGraph graph structure."""

    def test_graph_builds_successfully(self):
        """Graph should compile without errors."""
        from agent.graph import build_food_analyzer_graph
        graph = build_food_analyzer_graph()
        assert graph is not None

    def test_graph_has_correct_nodes(self):
        """Graph should contain all three processing nodes."""
        from agent.graph import build_food_analyzer_graph
        graph = build_food_analyzer_graph()
        node_names = list(graph.nodes.keys())
        assert "extract_food_data" in node_names
        assert "analyze_food" in node_names
        assert "format_response" in node_names

    # @patch("agent.nodes._get_llm")
    @patch("agent.nodes.get_llm")
    def test_full_graph_e2e_mocked(self, mock_get_llm):
        """Full graph should run end-to-end with mocked LLM."""
        import tempfile
        from PIL import Image as PILImage
        from agent.graph import build_food_analyzer_graph

        # Create temp image
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
            img = PILImage.new("RGB", (200, 200), color=(255, 200, 100))
            img.save(f, format="JPEG")
            temp_path = f.name

        # Set up mock LLM to return different responses for each call
        call_count = [0]
        responses = [
            json.dumps(MOCK_EXTRACTION_RESULT),  # Node 1: extraction
            json.dumps(MOCK_ANALYSIS_RESULT),    # Node 2: analysis
            "🔴 VERDICT: UNHEALTHY\n\nThis is test noodles.\n\n👉 Skip it.",  # Node 3: format
        ]

        def mock_invoke(*args, **kwargs):
            resp = MagicMock()
            resp.content = responses[min(call_count[0], len(responses) - 1)]
            call_count[0] += 1
            return resp

        mock_llm = MagicMock()
        mock_llm.invoke.side_effect = mock_invoke
        mock_get_llm.return_value = mock_llm

        graph = build_food_analyzer_graph()

        initial_state = {
            "image_paths": [temp_path],
            "user_message": None,
            "raw_ocr_text": "",
            "extracted_nutrition": None,
            "extracted_ingredients": None,
            "product_name": None,
            "food_analysis": None,
            "final_response": None,
            "error": None,
        }

        result = graph.invoke(initial_state)

        assert result.get("final_response") is not None
        assert result.get("product_name") == "Test Instant Noodles"
        assert result.get("food_analysis") is not None
        assert result["food_analysis"]["overall_verdict"] == "UNHEALTHY"

        os.unlink(temp_path)


# ─────────────────────────────────────────────────────────────────────────────
# Live Tests (require real API key)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.live
class TestLiveAgentWithSampleImages:
    """
    Live tests that make real API calls.
    
    Requires:
    - OPENAI_API_KEY set in .env
    - Sample images in ./sample_images/ folder
    
    Run with: pytest tests/ -v -m live
    """

    def test_live_analyze_noodles_images(self):
        """Live test: analyze the sample noodle images from the startup concept."""
        from pathlib import Path
        from agent.graph import food_analyzer

        sample_dir = Path("sample_images")
        if not sample_dir.exists():
            pytest.skip("sample_images/ folder not found")

        images = list(sample_dir.glob("*.jpg")) + list(sample_dir.glob("*.png"))
        if not images:
            pytest.skip("No images found in sample_images/")

        initial_state = {
            "image_paths": [str(p) for p in images[:2]],
            "user_message": "Analyze this food product honestly",
            "raw_ocr_text": "",
            "extracted_nutrition": None,
            "extracted_ingredients": None,
            "product_name": None,
            "food_analysis": None,
            "final_response": None,
            "error": None,
        }

        result = food_analyzer.invoke(initial_state)

        assert result.get("error") is None
        assert result.get("final_response") is not None
        assert result.get("food_analysis") is not None
        assert result["food_analysis"]["overall_verdict"] in ["HEALTHY", "OKAY", "UNHEALTHY", "JUNK"]

        print(f"\n📊 Live Test Result:")
        print(f"Product: {result.get('product_name')}")
        print(f"Verdict: {result['food_analysis']['overall_verdict']}")
        print(f"\nResponse:\n{result['final_response']}")
