import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { DailyUsage, ModelUsage } from '../lib/types';

export function useStats(dbPath: string | null, days: number) {
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dbPath) return;
    setLoading(true);
    setError(null);
    Promise.all([
      invoke<DailyUsage[]>('get_usage_stats', { dbPath, days }),
      invoke<ModelUsage[]>('get_model_stats', { dbPath, days }),
    ])
      .then(([daily, models]) => {
        setDailyUsage(daily);
        setModelUsage(models);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [dbPath, days]);

  return { dailyUsage, modelUsage, loading, error };
}
