import { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useStats } from '../hooks/useStats';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { formatCost, formatTokens } from '../lib/utils';
import { Loader2 } from 'lucide-react';
import type { ModelPricingMap } from '../lib/types';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

interface StatsViewProps {
  dbPath: string;
  effectivePricing?: ModelPricingMap;
}

export function StatsView({ dbPath, effectivePricing }: StatsViewProps) {
  const [days, setDays] = useState(30);
  const { dailyUsage, modelUsage, loading, error } = useStats(dbPath, days);

  // Recalculate model costs using custom pricing if available
  const adjustedModelUsage = useMemo(() => {
    if (!effectivePricing) return modelUsage;
    return modelUsage.map(m => {
      const pricing = effectivePricing[m.model_id];
      if (!pricing) return m;
      // Recalculate cost based on custom pricing (prices are per million tokens)
      const inputTokens = m.input_tokens ?? 0;
      const outputTokens = m.output_tokens ?? 0;
      const cacheReadTokens = m.cache_read_tokens ?? 0;
      const cacheWriteTokens = m.cache_write_tokens ?? 0;
      const newCost =
        (inputTokens * pricing.input / 1_000_000) +
        (outputTokens * pricing.output / 1_000_000) +
        (cacheReadTokens * (pricing.cacheRead ?? 0) / 1_000_000) +
        (cacheWriteTokens * (pricing.cacheWrite ?? 0) / 1_000_000);
      // Only override if we have token data to calculate from
      if (inputTokens > 0 || outputTokens > 0) {
        return { ...m, total_cost: newCost };
      }
      return m;
    });
  }, [modelUsage, effectivePricing]);

  const totalCost = adjustedModelUsage.reduce((a, b) => a + b.total_cost, 0);
  const totalTokens = adjustedModelUsage.reduce((a, b) => a + b.total_tokens, 0);
  const totalMessages = adjustedModelUsage.reduce((a, b) => a + b.message_count, 0);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Usage Statistics</h2>
        <div className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              variant={days === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(d)}
            >
              {d}d
            </Button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Cost</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold">{formatCost(totalCost)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Tokens</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold">{formatTokens(totalTokens)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm text-muted-foreground">Messages</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold">{totalMessages}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">Daily Token Usage</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailyUsage} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatTokens(v)} />
                  <Tooltip
                    formatter={(v, name) => [formatTokens(Number(v)), String(name)]}
                    labelStyle={{ fontSize: 12 }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="input_tokens" name="Input" stroke="#6366f1" dot={false} />
                  <Line type="monotone" dataKey="output_tokens" name="Output" stroke="#10b981" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Cost by Model</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={adjustedModelUsage}
                      dataKey="total_cost"
                      nameKey="model_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ percent }: { percent?: number }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {adjustedModelUsage.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCost(Number(v))} />
                    <Legend formatter={(v: string) => v} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Messages by Model</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={adjustedModelUsage} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="model_id" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="message_count" name="Messages" fill="#6366f1" radius={[4, 4, 0, 0]}>
                      {adjustedModelUsage.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">Model Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-2">
                {adjustedModelUsage.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="font-mono text-xs">{m.model_id}</span>
                      <span className="text-xs text-muted-foreground">{m.provider_id}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{m.message_count} msgs</span>
                      <span>{formatTokens(m.total_tokens)} tok</span>
                      <span className="font-medium text-foreground">{formatCost(m.total_cost)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
