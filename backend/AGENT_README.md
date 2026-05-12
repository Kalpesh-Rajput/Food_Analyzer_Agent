# LangGraph Food Analysis Agent

This document explains the LangGraph-based agent pipeline implemented for intelligent food label analysis.

## 🏗️ Architecture

The food analysis agent uses **LangGraph** to orchestrate a multi-step workflow that intelligently analyzes food labels using Large Language Models (LLMs).

### Workflow Nodes

1. **extract_product_info** → Extract product name, nutrition, ingredients, and claims
2. **analyze_ingredients** → Categorize ingredients (additives, allergens, harmful substances)
3. **score_health** → Calculate health score based on nutrition and ingredients
4. **detect_misleading_claims** → Identify potentially misleading marketing claims
5. **generate_insights** → Create actionable health insights
6. **create_final_message** → Generate user-friendly final message

### State Management

The agent maintains a `FoodAnalysisState` that flows through the graph:

```python
class FoodAnalysisState(TypedDict):
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
```

## 🔄 Pipeline Flow

```
OCR Text → Extract Info → Analyze Ingredients → Score Health → Detect Claims → Generate Insights → Create Message
```

Each step uses specialized LLM prompts to ensure accuracy and context-awareness.

## 🎯 Key Features

### Intelligent Extraction
- **Context-aware parsing**: Understands label layouts and formats
- **Multi-language support**: Adapts to different label styles
- **Error handling**: Graceful fallbacks when extraction fails

### Comprehensive Analysis
- **Ingredient categorization**: Identifies additives, allergens, preservatives
- **Health scoring**: Balanced algorithm considering nutrition and ingredients
- **Claim verification**: Detects misleading marketing (e.g., "natural" vs actual ingredients)

### User-Friendly Output
- **Conversational messages**: Friendly, human-like responses
- **Actionable insights**: Specific recommendations
- **Visual indicators**: Color-coded health scores (🟢🟡🔴)

## 🚀 Usage

```python
from llm.food_agent import FoodAnalysisAgent

agent = FoodAnalysisAgent(provider="openai")
result = agent.analyze_food(ocr_text)

print(f"Product: {result['product_name']}")
print(f"Health Score: {result['health_score']}/100")
print(f"Verdict: {result['verdict']}")
print(f"Message: {result['message']}")
```

## 🔧 Configuration

The agent supports multiple LLM providers:

- **OpenAI**: `gpt-4o-mini` (recommended)
- **Anthropic**: `claude-3-sonnet-20240229`

Configure via environment variables:
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key_here
```

## 🛡️ Error Handling

- **Node-level error handling**: Each step can fail gracefully
- **Fallback mechanisms**: Regex-based extraction if LLM fails
- **State preservation**: Errors are logged but don't break the flow
- **User feedback**: Clear messages when issues occur

## 📊 Benefits Over Previous Version

| Feature | Previous (Regex) | New (LangGraph Agent) |
|---------|------------------|------------------------|
| Accuracy | Limited patterns | Context-aware understanding |
| Flexibility | Brittle regex | Adapts to variations |
| Analysis Depth | Basic extraction | Comprehensive categorization |
| User Experience | Generic messages | Personalized, friendly responses |
| Error Recovery | Hard failures | Graceful degradation |
| Maintainability | Complex regex updates | Prompt-based improvements |

## 🔮 Future Enhancements

- **Multi-modal analysis**: Combine OCR with image analysis
- **Personalized recommendations**: User health profile integration
- **Comparative analysis**: Compare similar products
- **Trend analysis**: Track ingredient changes over time
- **Regulatory compliance**: Check against food standards

## 🧪 Testing

Run the test script to validate the agent:

```bash
python test_agent.py
```

This will test the agent with sample cookie label data and verify all pipeline steps work correctly.