import React from 'react';
import { SessionTree } from './SessionTree';
import type { Project, Session } from '../lib/types';
import { Loader2, Search, X } from 'lucide-react';

interface LayoutProps {
  projects: Project[];
  sessions: Session[];
  sessionsLoading: boolean;
  selectedSessionId: string | null;
  onSessionSelect: (id: string) => void;
  children: React.ReactNode;
  sidebarWidth?: number;
}

export function Layout({
  projects,
  sessions,
  sessionsLoading,
  selectedSessionId,
  onSessionSelect,
  children,
  sidebarWidth = 280,
}: LayoutProps) {
  const [search, setSearch] = React.useState('');

  const filteredSessions = React.useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    const filterTree = (s: Session): Session | null => {
      const matches = s.title.toLowerCase().includes(q) || s.directory.toLowerCase().includes(q);
      const filteredChildren = (s.children ?? []).map(filterTree).filter(Boolean) as Session[];
      if (matches || filteredChildren.length > 0) {
        return { ...s, children: filteredChildren };
      }
      return null;
    };
    return sessions.map(filterTree).filter(Boolean) as Session[];
  }, [sessions, search]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div
        className="flex flex-col border-r border-border bg-background overflow-hidden flex-shrink-0"
        style={{ width: sidebarWidth }}
      >
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-muted/50 pl-8 pr-8 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <SessionTree
              projects={projects}
              sessions={filteredSessions}
              selectedId={selectedSessionId}
              onSelect={onSessionSelect}
            />
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
