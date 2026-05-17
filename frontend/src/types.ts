export interface HarmfulIngredient {
  name: string;
  why_harmful: string;
}

export interface FoodAnalysis {
  overall_verdict?: string;
  verdict_emoji?: string;
  verdict_color?: string;
  harmful_ingredients?: HarmfulIngredient[];
  okay_ingredients?: string[];
  nutrition_insights?: string[];
  fun_comparisons?: string[];
  buy_or_avoid?: string;
  short_summary?: string;
}

export interface AnalyzeResponse {
  product_name?: string;
  final_response?: string;
  raw_ocr_text?: string;
  food_analysis?: FoodAnalysis;
  error?: string;
}
