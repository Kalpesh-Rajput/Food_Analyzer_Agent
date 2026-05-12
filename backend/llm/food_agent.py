"""LangGraph-based Food Analysis Agent."""

from typing import Dict, List, Any, TypedDict, Optional
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate

try:
    from config import settings
except ModuleNotFoundError:
    from backend.config import settings


class FoodAnalysisState(TypedDict):
    """State for the food analysis workflow."""
    ocr_text: str
    product_name: str
    nutrition: Dict[str, float]
    ingredients: List[str]
    claims: List[str]
    ingredient_analysis: Dict[str, Any]
    health_score: int
    verdict: str
    insights: List[str]
    misleading_claims: List[Dict[str, Any]]
    final_message: str
    errors: List[str]


class FoodAnalysisAgent:
    """LangGraph-based agent for comprehensive food label analysis."""

    def __init__(self, provider: str = "openai"):
        """Initialize the agent with LLM."""
        self.provider = provider

        if provider == "openai":
            self.llm = ChatOpenAI(
                model="gpt-4o-mini",
                temperature=0.1,
                api_key=settings.OPENAI_API_KEY
            )
        elif provider == "anthropic":
            self.llm = ChatAnthropic(
                model="claude-3-sonnet-20240229",
                temperature=0.1,
                api_key=settings.ANTHROPIC_API_KEY
            )
        else:
            raise ValueError(f"Unsupported provider: {provider}")

        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow."""
        workflow = StateGraph(FoodAnalysisState)

        # Add nodes
        workflow.add_node("extract_product_info", self._extract_product_info)
        workflow.add_node("analyze_ingredients", self._analyze_ingredients)
        workflow.add_node("score_health", self._score_health)
        workflow.add_node("detect_misleading_claims", self._detect_misleading_claims)
        workflow.add_node("generate_insights", self._generate_insights)
        workflow.add_node("create_final_message", self._create_final_message)
        workflow.add_node("handle_errors", self._handle_errors)

        # Define the flow
        workflow.set_entry_point("extract_product_info")

        workflow.add_edge("extract_product_info", "analyze_ingredients")
        workflow.add_edge("analyze_ingredients", "score_health")
        workflow.add_edge("score_health", "detect_misleading_claims")
        workflow.add_edge("detect_misleading_claims", "generate_insights")
        workflow.add_edge("generate_insights", "create_final_message")
        workflow.add_edge("create_final_message", END)

        # Add conditional error handling
        workflow.add_conditional_edges(
            "extract_product_info",
            self._should_continue,
            {"continue": "analyze_ingredients", "error": "handle_errors"}
        )

        return workflow.compile()

    def analyze_food(self, ocr_text: str) -> Dict[str, Any]:
        """Run the complete food analysis pipeline."""
        initial_state: FoodAnalysisState = {
            "ocr_text": ocr_text,
            "product_name": "",
            "nutrition": {},
            "ingredients": [],
            "claims": [],
            "ingredient_analysis": {},
            "health_score": 0,
            "verdict": "",
            "insights": [],
            "misleading_claims": [],
            "final_message": "",
            "errors": []
        }

        try:
            result = self.graph.invoke(initial_state)
            return self._format_result(result)
        except Exception as e:
            return self._fallback_analysis(ocr_text, str(e))

    def _extract_product_info(self, state: FoodAnalysisState) -> FoodAnalysisState:
        """Extract product name, nutrition, ingredients, and claims from OCR text."""
        ocr_text = state["ocr_text"]

        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content="""You are an expert at extracting information from food labels.
Return ONLY valid JSON with these exact keys:
- product_name: string
- nutrition: object with keys: energy_kcal, sugar_g, fat_g, saturated_fat_g, sodium_mg, protein_g, fiber_g, carbs_g, trans_fat_g, serving_size_g, servings_pkg (use 0 for missing values, servings_pkg defaults to 1)
- ingredients: array of strings (cleaned ingredient names)
- claims: array of strings (marketing claims found)

Be precise and thorough."""),
            HumanMessage(content=f"Extract information from this food label OCR text:\n\n{ocr_text}")
        ])

        try:
            response = self.llm.invoke(prompt)
            data = self._parse_json_response(response.content)

            return {
                **state,
                "product_name": data.get("product_name", "Food Product"),
                "nutrition": data.get("nutrition", {}),
                "ingredients": data.get("ingredients", []),
                "claims": data.get("claims", [])
            }
        except Exception as e:
            state["errors"].append(f"Extraction failed: {str(e)}")
            return state

    def _analyze_ingredients(self, state: FoodAnalysisState) -> FoodAnalysisState:
        """Analyze ingredients for additives, allergens, harmful substances, and beneficial ingredients."""
        ingredients = state["ingredients"]

        if not ingredients:
            return state

        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content="""Analyze these food ingredients and categorize them.
Return ONLY valid JSON with these exact keys:
- additives: array of objects with 'ingredient' and 'concern' keys
- allergens: array of objects with 'ingredient' and 'severity' keys
- harmful: array of objects with 'ingredient' and 'reason' keys
- preservatives: array of strings
- beneficial: array of objects with 'ingredient' and 'benefit' keys

Focus on common additives, allergens, potentially harmful ingredients, and beneficial whole foods/nutrients."""),
            HumanMessage(content=f"Analyze these ingredients: {', '.join(ingredients)}")
        ])

        try:
            response = self.llm.invoke(prompt)
            analysis = self._parse_json_response(response.content)

            return {
                **state,
                "ingredient_analysis": analysis
            }
        except Exception as e:
            state["errors"].append(f"Ingredient analysis failed: {str(e)}")
            return state

    def _score_health(self, state: FoodAnalysisState) -> FoodAnalysisState:
        """Calculate health score based on nutrition and ingredients."""
        nutrition = state["nutrition"]
        ingredient_analysis = state["ingredient_analysis"]

        # Simple scoring logic (can be enhanced)
        score = 100

        # Nutrition penalties
        if nutrition.get("sugar_g", 0) > 10:
            score -= 20
        if nutrition.get("fat_g", 0) > 15:
            score -= 15
        if nutrition.get("saturated_fat_g", 0) > 5:
            score -= 10
        if nutrition.get("sodium_mg", 0) > 500:
            score -= 15

        # Ingredient penalties
        harmful_count = len(ingredient_analysis.get("harmful", []))
        additive_count = len(ingredient_analysis.get("additives", []))

        score -= min(harmful_count * 10, 30)
        score -= min(additive_count * 5, 20)

        # Protein and fiber bonuses
        if nutrition.get("protein_g", 0) > 5:
            score += 10
        if nutrition.get("fiber_g", 0) > 3:
            score += 5

        score = max(0, min(100, score))

        verdict = "Healthy" if score >= 70 else "Okay" if score >= 50 else "Unhealthy"

        return {
            **state,
            "health_score": score,
            "verdict": verdict
        }

    def _detect_misleading_claims(self, state: FoodAnalysisState) -> FoodAnalysisState:
        """Detect misleading marketing claims."""
        claims = state["claims"]
        ingredients = state["ingredients"]
        nutrition = state["nutrition"]

        if not claims:
            return state

        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content="""Check if these marketing claims are misleading based on ingredients and nutrition.
Return ONLY valid JSON array of objects with keys: 'claim', 'reality', 'severity' (high/medium/low).

For each claim, explain why it's misleading or potentially misleading."""),
            HumanMessage(content=f"""
Claims: {', '.join(claims)}
Ingredients: {', '.join(ingredients)}
Nutrition: {nutrition}
""")
        ])

        try:
            response = self.llm.invoke(prompt)
            misleading = self._parse_json_response(response.content)

            return {
                **state,
                "misleading_claims": misleading if isinstance(misleading, list) else []
            }
        except Exception as e:
            state["errors"].append(f"Misleading claims detection failed: {str(e)}")
            return state

    def _generate_insights(self, state: FoodAnalysisState) -> FoodAnalysisState:
        """Generate actionable health insights."""
        nutrition = state["nutrition"]
        ingredient_analysis = state["ingredient_analysis"]
        score = state["health_score"]

        insights = []

        # Nutrition insights
        if nutrition.get("sugar_g", 0) > 10:
            insights.append(f"High sugar content ({nutrition['sugar_g']}g) - limit consumption")
        if nutrition.get("sodium_mg", 0) > 500:
            insights.append(f"High sodium ({nutrition['sodium_mg']}mg) - watch your daily intake")
        if nutrition.get("protein_g", 0) > 5:
            insights.append(f"Good protein source ({nutrition['protein_g']}g per serving)")

        # Ingredient insights
        harmful = ingredient_analysis.get("harmful", [])
        if harmful:
            insights.append(f"Contains {len(harmful)} potentially concerning ingredient(s)")

        additives = ingredient_analysis.get("additives", [])
        if additives:
            insights.append(f"Contains {len(additives)} additive(s) - check labels carefully")

        if not insights:
            insights.append("No major nutritional concerns detected")

        return {
            **state,
            "insights": insights
        }

    def _create_final_message(self, state: FoodAnalysisState) -> FoodAnalysisState:
        """Generate the final detailed user-friendly message."""
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content="""Generate a detailed, engaging food analysis report in this exact format. Be fun, conversational, and honest like a knowledgeable friend. Use emojis appropriately.

FORMAT:
👍
[PRODUCT NAME]
[VERDICT]
[Short description]

[REPEAT VERDICT LINE]

Key Insights
🟢
[Main insight]

1. COMPREHENSIVE SUMMARY:
[Detailed summary paragraph with humor and advice]

2. INGREDIENTS SUMMARY:
[Analysis of ingredients with good/bad mentions]

3. KEY POINTS:
- [Point 1]
- [Point 2]
- [Point 3]

4. REALITY CHECK:
[Fun fact about nutrition/calories]

5. ACTION:
[Recommendation on whether to buy/consume]

💡 Quick Insight
[Brief positive note]

📊 Reality Check
Sugar = [sugar in teaspoons, e.g. 0.1 teaspoons]
Walk ~[distance, e.g. 1 km] to burn off
Sodium = [amount in mg or Not listed]

Ingredient Analysis
⚠️ Watch out for

[List concerning ingredients with brief reasons, one per line]

✅ Good stuff

[List beneficial ingredients, one per line]

📋 Detailed Nutrition & Ingredients

Nutrition Facts
[energy]kcal/100g
Energy
[protein]g
Protein
[carbs]g
Carbs
[sugar]g
Sugar
[fat]g
Fat
[sat_fat]g
Sat. Fat
[trans_fat]g or —
Trans Fat
[sodium]mg or —
Sodium
[fiber]g
Fiber
Serving: [serving_size]g · Servings/pkg: [servings]

Ingredients
⚠️ Allergens
[list allergens separated by commas]

All Ingredients ([count])

[List all ingredients, one per line]

Ingredient Impact
[Brief note about preservatives or other impacts, e.g. "Preservatives help the product last longer, but they also mean your liver and gut have to work harder than they would on fresher food."]

Use the actual data provided. Convert sugar to teaspoons (1 tsp = 4g). Calculate walking distance roughly (1km burns ~50kcal). If data missing, use — or Not listed. For verdict, use OKAY if Okay, otherwise use the verdict in caps."""),

            HumanMessage(content=f"""
Product: {state['product_name']}
Verdict: {state['verdict']} ({state['health_score']}/100)
Nutrition: {state['nutrition']}
Ingredients: {', '.join(state['ingredients'])}
Ingredient Analysis: {state['ingredient_analysis']}
Insights: {', '.join(state['insights'])}
Misleading Claims: {state['misleading_claims']}
""")
        ])

        try:
            response = self.llm.invoke(prompt)
            message = response.content.strip()

            return {
                **state,
                "final_message": message
            }
        except Exception as e:
            state["errors"].append(f"Message generation failed: {str(e)}")
            return {
                **state,
                "final_message": f"This {state['product_name']} rates as {state['verdict']} with a score of {state['health_score']}/100."
            }

    def _handle_errors(self, state: FoodAnalysisState) -> FoodAnalysisState:
        """Handle errors in the pipeline."""
        if state["errors"]:
            state["final_message"] = "Analysis encountered some issues, but here's what we found."
        return state

    def _should_continue(self, state: FoodAnalysisState) -> str:
        """Determine if the workflow should continue or handle errors."""
        if state["errors"] and len(state["errors"]) > 2:
            return "error"
        return "continue"

    def _parse_json_response(self, content: str) -> Any:
        """Parse JSON response from LLM."""
        import json
        import re

        # Try to extract JSON from the response
        json_match = re.search(r'\{.*\}|\[.*\]', content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass

        # Fallback: try parsing the whole content
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            raise ValueError(f"Could not parse JSON from response: {content}")

    def _format_result(self, state: FoodAnalysisState) -> Dict[str, Any]:
        """Format the final result."""
        return {
            "product_name": state["product_name"],
            "nutrition": state["nutrition"],
            "ingredients": state["ingredients"],
            "claims": state["claims"],
            "ingredient_analysis": state["ingredient_analysis"],
            "health_score": state["health_score"],
            "verdict": state["verdict"],
            "insights": state["insights"],
            "misleading_claims": state["misleading_claims"],
            "message": state["final_message"],
            "errors": state["errors"]
        }

    def _fallback_analysis(self, ocr_text: str, error: str) -> Dict[str, Any]:
        """Fallback analysis when the agent fails."""
        return {
            "product_name": "Food Product",
            "nutrition": {},
            "ingredients": [],
            "claims": [],
            "ingredient_analysis": {},
            "health_score": 50,
            "verdict": "Okay",
            "insights": ["Analysis encountered technical issues"],
            "misleading_claims": [],
            "message": "We had trouble analyzing this product. Please try again.",
            "errors": [error]
        }