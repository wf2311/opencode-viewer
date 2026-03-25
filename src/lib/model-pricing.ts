import type { ModelPriceConfig, ModelPricingMap } from './types';

/**
 * Default model pricing data sourced from models.dev (used by opencode).
 * Prices are in USD per million tokens.
 * Users can override these with custom pricing.
 */
export const DEFAULT_MODEL_PRICING: ModelPricingMap = {
  // Anthropic models
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0, cacheRead: 0.30, cacheWrite: 3.75 },
  'claude-4-sonnet': { input: 3.0, output: 15.0, cacheRead: 0.30, cacheWrite: 3.75 },
  'claude-3-7-sonnet-20250219': { input: 3.0, output: 15.0, cacheRead: 0.30, cacheWrite: 3.75 },
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0, cacheRead: 0.30, cacheWrite: 3.75 },
  'claude-3-5-sonnet-latest': { input: 3.0, output: 15.0, cacheRead: 0.30, cacheWrite: 3.75 },
  'claude-3.5-sonnet': { input: 3.0, output: 15.0, cacheRead: 0.30, cacheWrite: 3.75 },
  'claude-3.7-sonnet': { input: 3.0, output: 15.0, cacheRead: 0.30, cacheWrite: 3.75 },
  'claude-sonnet-4': { input: 3.0, output: 15.0, cacheRead: 0.30, cacheWrite: 3.75 },
  'claude-opus-4-20250514': { input: 15.0, output: 75.0, cacheRead: 1.50, cacheWrite: 18.75 },
  'claude-4-opus': { input: 15.0, output: 75.0, cacheRead: 1.50, cacheWrite: 18.75 },
  'claude-opus-4': { input: 15.0, output: 75.0, cacheRead: 1.50, cacheWrite: 18.75 },
  'claude-3-5-haiku-20241022': { input: 0.80, output: 4.0, cacheRead: 0.08, cacheWrite: 1.0 },
  'claude-3.5-haiku': { input: 0.80, output: 4.0, cacheRead: 0.08, cacheWrite: 1.0 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25, cacheRead: 0.03, cacheWrite: 0.30 },
  'claude-3-opus-20240229': { input: 15.0, output: 75.0, cacheRead: 1.50, cacheWrite: 18.75 },

  // OpenAI models
  'gpt-4o': { input: 2.50, output: 10.0 },
  'gpt-4o-2024-11-20': { input: 2.50, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4o-mini-2024-07-18': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'gpt-4': { input: 30.0, output: 60.0 },
  'o1': { input: 15.0, output: 60.0 },
  'o1-preview': { input: 15.0, output: 60.0 },
  'o1-mini': { input: 1.10, output: 4.40 },
  'o3': { input: 2.0, output: 8.0 },
  'o3-mini': { input: 1.10, output: 4.40 },
  'o4-mini': { input: 1.10, output: 4.40 },
  'gpt-4.1': { input: 2.0, output: 8.0 },
  'gpt-4.1-mini': { input: 0.40, output: 1.60 },
  'gpt-4.1-nano': { input: 0.10, output: 0.40 },

  // Google models
  'gemini-2.5-pro': { input: 1.25, output: 10.0 },
  'gemini-2.5-flash': { input: 0.15, output: 0.60 },
  'gemini-2.0-flash': { input: 0.10, output: 0.40 },
  'gemini-2.0-flash-lite': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 1.25, output: 5.0 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },

  // DeepSeek models
  'deepseek-chat': { input: 0.27, output: 1.10 },
  'deepseek-reasoner': { input: 0.55, output: 2.19 },

  // Mistral models
  'mistral-large-latest': { input: 2.0, output: 6.0 },
  'codestral-latest': { input: 0.30, output: 0.90 },
  'mistral-small-latest': { input: 0.10, output: 0.30 },

  // Groq models
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
};

const STORAGE_KEY = 'opencode-viewer-model-pricing';

export function loadCustomPricing(): ModelPricingMap {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as ModelPricingMap;
    }
  } catch {
    // ignore parse errors
  }
  return {};
}

export function saveCustomPricing(pricing: ModelPricingMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pricing));
}

export function getEffectivePricing(customPricing: ModelPricingMap): ModelPricingMap {
  return { ...DEFAULT_MODEL_PRICING, ...customPricing };
}

export function getModelPrice(modelId: string, customPricing: ModelPricingMap): ModelPriceConfig | undefined {
  return customPricing[modelId] ?? DEFAULT_MODEL_PRICING[modelId];
}
