import { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useStats } from '../hooks/useStats';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { formatCost, formatTokens } from '../lib/utils';
import { Loader2, DollarSign, Zap, MessageSquare as MsgIcon } from 'lucide-react';
import type { ModelPricingMap } from '../lib/types';

function useChartColors() {
  const getColor = (cssVar: string) => {
    const style = getComputedStyle(document.documentElement);
    const hsl = style.getPropertyValue(cssVar).trim();
    return hsl ? `hsl(${hsl})` : '#6366f1';
  };
  return useMemo(() => [
    getColor('--chart-mauve'),
    getColor('--chart-green'),
    getColor('--chart-blue'),
    getColor('--chart-peach'),
    getColor('--chart-pink'),
    getColor('--chart-teal'),
    getColor('--chart-flamingo'),
  ], []);
}

interface StatsViewProps {
  dbPath: string;
  effectivePricing?: ModelPricingMap;
  projectIds?: string[];
  workspaceName?: string | null;
}

export function StatsView({ dbPath, effectivePricing, projectIds, workspaceName }: StatsViewProps) {
  const [days, setDays] = useState(30);
  const { dailyUsage, modelUsage, loading, error } = useStats(dbPath, days, projectIds);
  const COLORS = useChartColors();

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
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Usage Statistics</h2>
          {workspaceName && (
            <p className="text-xs text-muted-foreground mt-1">
              Filtered by workspace: <span className="font-medium text-ctp-mauve">{workspaceName}</span>
            </p>
          )}
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              variant={days === d ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDays(d)}
              className={days === d ? '' : 'text-muted-foreground'}
            >
              {d}d
            </Button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && <div className="text-destructive text-sm bg-destructive/10 rounded-lg p-3 border border-destructive/20">{error}</div>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-ctp-mauve/10 to-transparent pointer-events-none" />
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Cost</CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-ctp-mauve/15 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-ctp-mauve" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold tracking-tight">{formatCost(totalCost)}</div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-ctp-blue/10 to-transparent pointer-events-none" />
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Tokens</CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-ctp-blue/15 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-ctp-blue" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold tracking-tight">{formatTokens(totalTokens)}</div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-ctp-green/10 to-transparent pointer-events-none" />
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Messages</CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-ctp-green/15 flex items-center justify-center">
                    <MsgIcon className="h-4 w-4 text-ctp-green" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold tracking-tight">{totalMessages}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold">Daily Token Usage</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyUsage} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="inputGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="outputGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => formatTokens(v)} />
                  <Tooltip
                    formatter={(v, name) => [formatTokens(Number(v)), String(name)]}
                    labelStyle={{ fontSize: 12 }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="input_tokens" name="Input" stroke={COLORS[0]} fill="url(#inputGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="output_tokens" name="Output" stroke={COLORS[1]} fill="url(#outputGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold">Cost by Model</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={adjustedModelUsage}
                      dataKey="total_cost"
                      nameKey="model_id"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      label={false}
                      labelLine={false}
                      strokeWidth={0}
                    >
                      {adjustedModelUsage.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, name) => [formatCost(Number(v)), String(name)]}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 px-1">
                  {adjustedModelUsage.map((m, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="truncate max-w-[120px]" title={m.model_id}>{m.model_id}</span>
                      <span className="text-foreground font-medium tabular-nums">{((m.total_cost / (totalCost || 1)) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold">Messages by Model</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={adjustedModelUsage} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="model_id" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="message_count" name="Messages" radius={[6, 6, 0, 0]}>
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
              <CardTitle className="text-sm font-semibold">Model Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-1">
                {adjustedModelUsage.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 ring-offset-background" style={{ background: COLORS[i % COLORS.length], ringColor: COLORS[i % COLORS.length] }} />
                      <span className="font-mono text-xs font-medium">{m.model_id}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{m.provider_id}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="tabular-nums">{m.message_count} msgs</span>
                      <span className="tabular-nums">{formatTokens(m.total_tokens)} tok</span>
                      <span className="font-semibold text-foreground tabular-nums">{formatCost(m.total_cost)}</span>
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
