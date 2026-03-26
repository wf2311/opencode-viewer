import { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Layout } from './components/Layout';
import { MessageList } from './components/MessageList';
import { StatsView } from './components/StatsView';
import { DbSelector } from './components/DbSelector';
import { WorkspaceManager } from './components/WorkspaceManager';
import { ModelPricingConfig } from './components/ModelPricingConfig';
import { Button } from './components/ui/button';
import { useProjects } from './hooks/useProjects';
import { useSessions } from './hooks/useSessions';
import { useWorkspaces, filterProjectsByWorkspace } from './hooks/useWorkspaces';
import { useModelPricing } from './hooks/useModelPricing';
import { BarChart2, MessageSquare, Database, FolderOpen, FolderTree, DollarSign } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import type { Session } from './lib/types';

type View = 'sessions' | 'stats';

function findSessionTitle(sessions: Session[], sessionId: string): string | undefined {
  for (const s of sessions) {
    if (s.id === sessionId) return s.title;
    if (s.children) {
      const found = findSessionTitle(s.children, sessionId);
      if (found) return found;
    }
  }
  return undefined;
}

export default function App() {
  const [dbPath, setDbPath] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [view, setView] = useState<View>('sessions');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showWorkspaceManager, setShowWorkspaceManager] = useState(false);
  const [showModelPricing, setShowModelPricing] = useState(false);

  const { projects, loading: projectsLoading } = useProjects(dbPath);
  const { sessions, loading: sessionsLoading } = useSessions(dbPath);
  const {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    setActiveWorkspaceId,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
  } = useWorkspaces();
  const {
    customPricing,
    effectivePricing,
    setModelPrice,
    removeModelPrice,
    resetAllPricing,
  } = useModelPricing();

  // Filter projects based on active workspace
  const filteredProjects = useMemo(
    () => filterProjectsByWorkspace(projects, activeWorkspace),
    [projects, activeWorkspace]
  );
  const filteredProjectIds = useMemo(() => filteredProjects.map((project) => project.id), [filteredProjects]);

  // Filter sessions to only show those belonging to filtered projects
  const filteredSessions = useMemo(() => {
    const projectIds = new Set(filteredProjects.map(p => p.id));
    return sessions.filter(s => projectIds.has(s.project_id));
  }, [sessions, filteredProjects]);

  // Find session title for export
  const selectedSessionTitle = useMemo(() => {
    if (!selectedSessionId) return undefined;
    return findSessionTitle(sessions, selectedSessionId);
  }, [sessions, selectedSessionId]);

  useEffect(() => {
    invoke<string | null>('get_default_db_path').then((path) => {
      if (path) setDbPath(path);
    }).finally(() => {
      setIsInitializing(false);
    });
  }, []);

  const handleBrowse = async () => {
    const selected = await open({
      filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite', 'sqlite3'] }],
      title: 'Open OpenCode Database',
    });
    if (selected) {
      setDbPath(selected as string);
      setSelectedSessionId(null);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground" role="status" aria-label="Loading database">
        <Database className="h-8 w-8 animate-pulse" aria-hidden="true" />
        <p className="text-sm">Loading...</p>
      </div>
    );
  }

  if (!dbPath) {
    return <DbSelector dbPath={null} onSelect={(p) => { setDbPath(p); setSelectedSessionId(null); }} />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background flex-shrink-0">
        <Database className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-mono truncate flex-1 max-w-xs" title={dbPath}>
          {dbPath}
        </span>
        {activeWorkspace && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            {activeWorkspace.name}
          </span>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant={view === 'sessions' ? 'default' : 'ghost'}
            size="sm"
            className="gap-1.5"
            onClick={() => setView('sessions')}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Sessions
          </Button>
          <Button
            variant={view === 'stats' ? 'default' : 'ghost'}
            size="sm"
            className="gap-1.5"
            onClick={() => setView('stats')}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Stats
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowWorkspaceManager(true)}
            title="Manage Workspaces"
          >
            <FolderTree className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowModelPricing(true)}
            title="Model Pricing"
          >
            <DollarSign className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleBrowse}>
            <FolderOpen className="h-3.5 w-3.5" />
            Open DB
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {view === 'sessions' ? (
          <Layout
            projects={filteredProjects}
            sessions={filteredSessions}
            sessionsLoading={sessionsLoading || projectsLoading}
            selectedSessionId={selectedSessionId}
            onSessionSelect={setSelectedSessionId}
          >
            {selectedSessionId ? (
              <MessageList dbPath={dbPath} sessionId={selectedSessionId} sessionTitle={selectedSessionTitle} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <MessageSquare className="h-10 w-10" />
                <p className="text-sm">Select a session to view messages</p>
              </div>
            )}
          </Layout>
        ) : (
          <StatsView
            dbPath={dbPath}
            effectivePricing={effectivePricing}
            projectIds={activeWorkspace ? filteredProjectIds : undefined}
            workspaceName={activeWorkspace?.name ?? null}
          />
        )}
      </div>

      {/* Workspace Manager Modal */}
      {showWorkspaceManager && (
        <WorkspaceManager
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSelect={(id) => {
            setActiveWorkspaceId(id);
            setSelectedSessionId(null);
          }}
          onAdd={addWorkspace}
          onUpdate={updateWorkspace}
          onDelete={deleteWorkspace}
          onClose={() => setShowWorkspaceManager(false)}
        />
      )}

      {/* Model Pricing Modal */}
      {showModelPricing && (
        <ModelPricingConfig
          customPricing={customPricing}
          onSetPrice={setModelPrice}
          onRemovePrice={removeModelPrice}
          onResetAll={resetAllPricing}
          onClose={() => setShowModelPricing(false)}
        />
      )}
    </div>
  );
}
