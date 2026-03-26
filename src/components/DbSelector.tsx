import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { Button } from './ui/button';
import { Database, FolderOpen } from 'lucide-react';

interface DbSelectorProps {
  dbPath: string | null;
  defaultPathSuggestion?: string | null;
  onSelect: (path: string) => void;
}

export function DbSelector({ dbPath, defaultPathSuggestion, onSelect }: DbSelectorProps) {
  const [manualPath, setManualPath] = useState(defaultPathSuggestion ?? '');

  useEffect(() => {
    if (defaultPathSuggestion) setManualPath(defaultPathSuggestion);
  }, [defaultPathSuggestion]);

  const handleBrowse = async () => {
    const selected = await open({
      filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite', 'sqlite3'] }],
      title: 'Open OpenCode Database',
    });
    if (selected) {
      onSelect(selected as string);
    }
  };

  const handleUseManualPath = () => {
    const trimmed = manualPath.trim();
    if (trimmed) onSelect(trimmed);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <div className="flex flex-col items-center gap-3 text-center max-w-md">
        <div className="rounded-full bg-primary/10 p-4">
          <Database className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">OpenCode Viewer</h1>
        <p className="text-muted-foreground text-sm">
          Browse your OpenCode sessions and usage statistics. Open your OpenCode SQLite database to get started.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-md">
        <div className="flex gap-2">
          <input
            type="text"
            value={manualPath}
            onChange={(e) => setManualPath(e.target.value)}
            placeholder="Path to opencode.db"
            className="flex-1 text-xs font-mono bg-muted border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleUseManualPath(); } }}
          />
          <Button onClick={handleUseManualPath} size="sm" disabled={!manualPath.trim()}>
            Open
          </Button>
        </div>
        <Button variant="outline" onClick={handleBrowse} size="sm" className="gap-2 w-full">
          <FolderOpen className="h-4 w-4" />
          Browse…
        </Button>
      </div>
      {dbPath && (
        <p className="text-xs text-muted-foreground font-mono mt-2">
          Current: {dbPath}
        </p>
      )}
    </div>
  );
}
