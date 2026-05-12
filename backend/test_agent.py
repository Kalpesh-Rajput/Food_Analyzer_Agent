"""Test the LangGraph Food Analysis Agent."""

# Mock test data
sample_ocr_text = """
CHOCOLATE CHIP COOKIES

Ingredients: Enriched Flour Bleached (wheat flour, niacin, iron, thiamin mononitrate, riboflavin, folic acid), Palm Oil, Sugar, Water, Canola Oil, Baking Soda, Salt, Eggs, Artificial Flavor.

Nutrition Facts
Serving Size: 1 cookie (28g)
Calories: 140
Total Fat: 7g
  Saturated Fat: 3.5g
Total Carbohydrate: 18g
  Sugars: 9g
Protein: 2g
Sodium: 95mg

All Natural! Made with Real Ingredients!
"""

def test_agent():
    """Test the food analysis agent with sample data."""
    try:
        from llm.food_agent import FoodAnalysisAgent

        # Initialize agent (will use mock if no API key)
        agent = FoodAnalysisAgent(provider="openai")

        # Run analysis
        result = agent.analyze_food(sample_ocr_text)

        print("✅ Agent test successful!")
        print(f"Product: {result['product_name']}")
        print(f"Verdict: {result['verdict']} ({result['health_score']}/100)")
        print(f"Message: {result['message']}")
        print(f"Insights: {result['insights']}")

        return True
    except Exception as e:
        print(f"❌ Agent test failed: {e}")
        return False

if __name__ == "__main__":
    test_agent()