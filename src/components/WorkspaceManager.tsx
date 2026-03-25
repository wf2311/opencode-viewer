import { useState } from 'react';
import type { Workspace, WorkspaceRule } from '../lib/types';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { Plus, Trash2, X, FolderTree, Edit2, Check } from 'lucide-react';

interface WorkspaceManagerProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (name: string, rules: WorkspaceRule[]) => Workspace;
  onUpdate: (id: string, updates: Partial<Omit<Workspace, 'id'>>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function RuleEditor({
  rules,
  onChange,
}: {
  rules: WorkspaceRule[];
  onChange: (rules: WorkspaceRule[]) => void;
}) {
  const addRule = () => {
    onChange([...rules, { type: 'include', match: 'name', value: '' }]);
  };

  const updateRule = (index: number, updates: Partial<WorkspaceRule>) => {
    const updated = rules.map((r, i) => (i === index ? { ...r, ...updates } : r));
    onChange(updated);
  };

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {rules.map((rule, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            value={rule.type}
            onChange={(e) => updateRule(i, { type: e.target.value as 'include' | 'exclude' })}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs"
          >
            <option value="include">Include</option>
            <option value="exclude">Exclude</option>
          </select>
          <select
            value={rule.match}
            onChange={(e) => updateRule(i, { match: e.target.value as 'name' | 'path' })}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs"
          >
            <option value="name">Name contains</option>
            <option value="path">Path starts with</option>
          </select>
          <input
            type="text"
            value={rule.value}
            onChange={(e) => updateRule(i, { value: e.target.value })}
            placeholder={rule.match === 'name' ? 'project name...' : '/path/to/projects...'}
            className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button
            onClick={() => removeRule(i)}
            className="text-muted-foreground hover:text-red-500 p-1"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={addRule}>
        <Plus className="h-3 w-3" />
        Add Rule
      </Button>
    </div>
  );
}

export function WorkspaceManager({
  workspaces,
  activeWorkspaceId,
  onSelect,
  onAdd,
  onUpdate,
  onDelete,
  onClose,
}: WorkspaceManagerProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRules, setEditRules] = useState<WorkspaceRule[]>([]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim(), []);
    setNewName('');
  };

  const startEditing = (workspace: Workspace) => {
    setEditingId(workspace.id);
    setEditName(workspace.name);
    setEditRules([...workspace.rules]);
  };

  const saveEditing = () => {
    if (editingId && editName.trim()) {
      onUpdate(editingId, { name: editName.trim(), rules: editRules });
      setEditingId(null);
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background border border-border rounded-lg shadow-lg w-[560px] max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Workspace Manager</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Add new workspace */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="New workspace name..."
              className="flex-1 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <Button size="sm" onClick={handleAdd} disabled={!newName.trim()} className="gap-1">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>

          {/* Show "All Projects" option */}
          <button
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left',
              !activeWorkspaceId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
            )}
            onClick={() => onSelect(null)}
          >
            <FolderTree className="h-3.5 w-3.5" />
            All Projects (No workspace filter)
          </button>

          {/* Workspace list */}
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className={cn(
                'border rounded-md transition-colors',
                activeWorkspaceId === workspace.id ? 'border-primary/30 bg-primary/5' : 'border-border'
              )}
            >
              <div className="flex items-center gap-2 px-3 py-2">
                {editingId === workspace.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <button onClick={saveEditing} className="text-green-600 hover:text-green-700 p-1">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={cancelEditing} className="text-muted-foreground hover:text-foreground p-1">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="flex-1 text-sm text-left truncate hover:text-primary"
                      onClick={() => onSelect(workspace.id)}
                    >
                      {workspace.name}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {workspace.rules.length} rule{workspace.rules.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => startEditing(workspace)}
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onDelete(workspace.id)}
                      className="text-muted-foreground hover:text-red-500 p-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
              {editingId === workspace.id && (
                <div className="px-3 pb-3 pt-1 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">
                    Rules determine which projects are shown in this workspace.
                  </p>
                  <RuleEditor rules={editRules} onChange={setEditRules} />
                </div>
              )}
            </div>
          ))}

          {workspaces.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No workspaces configured. Create one to filter projects.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
