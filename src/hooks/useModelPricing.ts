import { useState, useCallback } from 'react';
import type { ModelPricingMap, ModelPriceConfig } from '../lib/types';
import { loadCustomPricing, saveCustomPricing, getEffectivePricing } from '../lib/model-pricing';

export function useModelPricing() {
  const [customPricing, setCustomPricing] = useState<ModelPricingMap>(loadCustomPricing);

  const effectivePricing = getEffectivePricing(customPricing);

  const setModelPrice = useCallback((modelId: string, price: ModelPriceConfig) => {
    const updated = { ...customPricing, [modelId]: price };
    setCustomPricing(updated);
    saveCustomPricing(updated);
  }, [customPricing]);

  const removeModelPrice = useCallback((modelId: string) => {
    const updated = { ...customPricing };
    delete updated[modelId];
    setCustomPricing(updated);
    saveCustomPricing(updated);
  }, [customPricing]);

  const resetAllPricing = useCallback(() => {
    setCustomPricing({});
    saveCustomPricing({});
  }, []);

  return {
    customPricing,
    effectivePricing,
    setModelPrice,
    removeModelPrice,
    resetAllPricing,
  };
}
