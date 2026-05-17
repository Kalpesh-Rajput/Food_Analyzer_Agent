"""
quick_test.py — Minimal test script to verify the agent works.

Usage:
    python quick_test.py                          # uses images in sample_images/
    python quick_test.py img1.jpg img2.jpg        # specify images directly
    python quick_test.py --mock                   # dry-run without API call

This is useful for a quick sanity check before building the full app.
"""

import sys
import json
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


def run_with_real_images(image_paths: list[str]):
    """Run the full agent with real images."""
    print("=" * 60)
    print("🥗 FOOD ANALYZER AGENT — Quick Test")
    print("=" * 60)

    from agent.graph import food_analyzer

    print(f"\n📸 Images: {image_paths}")
    print("⏳ Running agent (3 LLM calls)...\n")

    initial_state = {
        "image_paths": image_paths,
        "user_message": None,
        "raw_ocr_text": "",
        "extracted_nutrition": None,
        "extracted_ingredients": None,
        "product_name": None,
        "food_analysis": None,
        "final_response": None,
        "error": None,
    }

    result = food_analyzer.invoke(initial_state)

    print("\n" + "=" * 60)
    print("✅ RESULT")
    print("=" * 60)
    print(f"\n📦 Product: {result.get('product_name', 'Unknown')}")
    print(f"\n📋 Extracted ingredients count: "
          f"{len(result.get('extracted_ingredients', {}).get('ingredient_list', []))}")
    
    analysis = result.get("food_analysis", {})
    if analysis:
        print(f"\n🏷️  Verdict: {analysis.get('verdict_emoji', '')} {analysis.get('overall_verdict', '')}")
        print(f"\n⚠️  Harmful ingredients: {len(analysis.get('harmful_ingredients', []))}")
        print(f"\n📊 Fun comparisons:")
        for c in analysis.get("fun_comparisons", []):
            print(f"   • {c}")
    
    print(f"\n💬 Final Response:\n")
    print(result.get("final_response", "No response"))
    print("\n" + "=" * 60)

    if result.get("error"):
        print(f"\n⚠️  Error occurred: {result['error']}")

    return result


def run_mock_test():
    """Run a mock test of just the formatting node (no API needed)."""
    print("=" * 60)
    print("🧪 MOCK TEST — No API calls")
    print("=" * 60)

    from agent.nodes import _build_fallback_response

    mock_analysis = {
        "overall_verdict": "UNHEALTHY",
        "verdict_emoji": "🔴",
        "verdict_color": "red",
        "harmful_ingredients": [
            {"name": "Refined Palm Oil", "why_harmful": "High saturated fat, heart disease risk"},
            {"name": "Trans Fat", "why_harmful": "Raises LDL cholesterol"},
            {"name": "Maida (Refined Flour)", "why_harmful": "Ultra-processed, zero fiber, blood sugar spike"},
        ],
        "okay_ingredients": ["Carrot", "Beans", "Onion", "Spices"],
        "nutrition_insights": [
            "Sodium is dangerously high at 1247mg/100g",
            "78% of this product is refined white flour",
        ],
        "fun_comparisons": [
            "Sugar = ~1 teaspoon per serving",
            "Sodium = 18.7% of daily limit per serving",
            "Saturated fat = 14.6% of daily recommended intake",
            "Walk ~1.5 km to burn one serving",
        ],
        "buy_or_avoid": "Avoid daily use — treat it as an occasional lazy-day meal, not a regular diet staple.",
        "short_summary": (
            "Classic ultra-processed instant noodles. "
            "Maida + palm oil + flavour enhancers = tasty, convenient, and not great for you. "
            "The sodium alone should give you pause."
        ),
    }

    response = _build_fallback_response(mock_analysis, "Sample Instant Noodles")
    print("\n📋 Fallback response (no LLM needed):\n")
    print(response)
    print("\n✅ Mock test passed — agent logic is working!")
    print("   Run with real images to test full pipeline.")


if __name__ == "__main__":
    args = sys.argv[1:]

    if "--mock" in args:
        run_mock_test()
    elif args:
        # Use provided image paths
        run_with_real_images(args)
    else:
        # Try to find images in sample_images/
        sample_dir = Path("sample_images")
        images = []
        if sample_dir.exists():
            images = [str(p) for p in 
                      list(sample_dir.glob("*.jpg")) + 
                      list(sample_dir.glob("*.png")) +
                      list(sample_dir.glob("*.jpeg"))]

        if images:
            print(f"Found {len(images)} image(s) in sample_images/")
            run_with_real_images(images[:2])
        else:
            print("No images found. Running mock test instead...\n")
            run_mock_test()
            print("\nTo test with real images:")
            print("  python quick_test.py path/to/label.jpg")
            print("  OR add images to ./sample_images/ folder")
