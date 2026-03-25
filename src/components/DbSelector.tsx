import { open } from '@tauri-apps/plugin-dialog';
import { Button } from './ui/button';
import { Database, FolderOpen } from 'lucide-react';

interface DbSelectorProps {
  dbPath: string | null;
  onSelect: (path: string) => void;
}

export function DbSelector({ dbPath, onSelect }: DbSelectorProps) {
  const handleBrowse = async () => {
    const selected = await open({
      filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite', 'sqlite3'] }],
      title: 'Open OpenCode Database',
    });
    if (selected) {
      onSelect(selected as string);
    }
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
        <p className="text-xs text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-md">
          ~/.local/share/opencode/opencode.db
        </p>
      </div>
      <Button onClick={handleBrowse} size="lg" className="gap-2">
        <FolderOpen className="h-4 w-4" />
        Open Database
      </Button>
      {dbPath && (
        <p className="text-xs text-muted-foreground font-mono mt-2">
          Current: {dbPath}
        </p>
      )}
    </div>
  );
}
