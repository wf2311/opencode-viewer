import { useState } from 'react';
import type { ModelPricingMap, ModelPriceConfig } from '../lib/types';
import { DEFAULT_MODEL_PRICING } from '../lib/model-pricing';
import { Button } from './ui/button';
import { X, Plus, Trash2, RotateCcw, Search } from 'lucide-react';

interface ModelPricingConfigProps {
  customPricing: ModelPricingMap;
  onSetPrice: (modelId: string, price: ModelPriceConfig) => void;
  onRemovePrice: (modelId: string) => void;
  onResetAll: () => void;
  onClose: () => void;
}

export function ModelPricingConfig({
  customPricing,
  onSetPrice,
  onRemovePrice,
  onResetAll,
  onClose,
}: ModelPricingConfigProps) {
  const [search, setSearch] = useState('');
  const [newModelId, setNewModelId] = useState('');
  const [newInput, setNewInput] = useState('');
  const [newOutput, setNewOutput] = useState('');
  const [newCacheRead, setNewCacheRead] = useState('');
  const [newCacheWrite, setNewCacheWrite] = useState('');

  // Merge default + custom for display
  const allModels = new Set([
    ...Object.keys(DEFAULT_MODEL_PRICING),
    ...Object.keys(customPricing),
  ]);

  const filteredModels = [...allModels]
    .filter((id) => !search || id.toLowerCase().includes(search.toLowerCase()))
    .sort();

  const handleAddCustom = () => {
    if (!newModelId.trim()) return;
    const input = parseFloat(newInput) || 0;
    const output = parseFloat(newOutput) || 0;
    const cacheRead = newCacheRead ? parseFloat(newCacheRead) : undefined;
    const cacheWrite = newCacheWrite ? parseFloat(newCacheWrite) : undefined;
    onSetPrice(newModelId.trim(), { input, output, cacheRead, cacheWrite });
    setNewModelId('');
    setNewInput('');
    setNewOutput('');
    setNewCacheRead('');
    setNewCacheWrite('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background border border-border rounded-lg shadow-lg w-[700px] max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-sm">Model Pricing Configuration</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onResetAll} className="gap-1 text-xs">
              <RotateCcw className="h-3 w-3" />
              Reset All
            </Button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models..."
              className="w-full rounded-md border border-border bg-muted/50 pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Add custom model */}
        <div className="px-4 py-2 border-b border-border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2">Add or override model pricing (USD per million tokens):</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newModelId}
              onChange={(e) => setNewModelId(e.target.value)}
              placeholder="Model ID"
              className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <input
              type="number"
              value={newInput}
              onChange={(e) => setNewInput(e.target.value)}
              placeholder="Input"
              step="0.01"
              className="w-20 rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <input
              type="number"
              value={newOutput}
              onChange={(e) => setNewOutput(e.target.value)}
              placeholder="Output"
              step="0.01"
              className="w-20 rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <input
              type="number"
              value={newCacheRead}
              onChange={(e) => setNewCacheRead(e.target.value)}
              placeholder="Cache R"
              step="0.01"
              className="w-20 rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <input
              type="number"
              value={newCacheWrite}
              onChange={(e) => setNewCacheWrite(e.target.value)}
              placeholder="Cache W"
              step="0.01"
              className="w-20 rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <Button size="sm" onClick={handleAddCustom} disabled={!newModelId.trim()} className="gap-1">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Model list */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Model ID</th>
                <th className="text-right px-2 py-2 font-medium text-muted-foreground">Input $/M</th>
                <th className="text-right px-2 py-2 font-medium text-muted-foreground">Output $/M</th>
                <th className="text-right px-2 py-2 font-medium text-muted-foreground">Cache Read</th>
                <th className="text-right px-2 py-2 font-medium text-muted-foreground">Cache Write</th>
                <th className="text-center px-2 py-2 font-medium text-muted-foreground">Source</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredModels.map((modelId) => {
                const isCustom = modelId in customPricing;
                const price = isCustom ? customPricing[modelId] : DEFAULT_MODEL_PRICING[modelId];
                if (!price) return null;
                return (
                  <tr key={modelId} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-1.5 font-mono">{modelId}</td>
                    <td className="text-right px-2 py-1.5">{price.input.toFixed(2)}</td>
                    <td className="text-right px-2 py-1.5">{price.output.toFixed(2)}</td>
                    <td className="text-right px-2 py-1.5 text-muted-foreground">
                      {price.cacheRead != null ? price.cacheRead.toFixed(2) : '-'}
                    </td>
                    <td className="text-right px-2 py-1.5 text-muted-foreground">
                      {price.cacheWrite != null ? price.cacheWrite.toFixed(2) : '-'}
                    </td>
                    <td className="text-center px-2 py-1.5">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          isCustom
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}
                      >
                        {isCustom ? 'Custom' : 'Default'}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      {isCustom && (
                        <button
                          onClick={() => onRemovePrice(modelId)}
                          className="text-muted-foreground hover:text-red-500 p-0.5"
                          title="Remove custom price (revert to default)"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
          Prices from models.dev (used by OpenCode). Custom prices override defaults.
        </div>
      </div>
    </div>
  );
}
