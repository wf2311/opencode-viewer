import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Layout } from './components/Layout';
import { MessageList } from './components/MessageList';
import { StatsView } from './components/StatsView';
import { DbSelector } from './components/DbSelector';
import { Button } from './components/ui/button';
import { useProjects } from './hooks/useProjects';
import { useSessions } from './hooks/useSessions';
import { BarChart2, MessageSquare, Database, FolderOpen } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';

type View = 'sessions' | 'stats';

export default function App() {
  const [dbPath, setDbPath] = useState<string | null>(null);
  const [view, setView] = useState<View>('sessions');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { projects, loading: projectsLoading } = useProjects(dbPath);
  const { sessions, loading: sessionsLoading } = useSessions(dbPath);

  useEffect(() => {
    invoke<string | null>('get_default_db_path').then((path) => {
      if (path) setDbPath(path);
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
            projects={projects}
            sessions={sessions}
            sessionsLoading={sessionsLoading || projectsLoading}
            selectedSessionId={selectedSessionId}
            onSessionSelect={setSelectedSessionId}
          >
            {selectedSessionId ? (
              <MessageList dbPath={dbPath} sessionId={selectedSessionId} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <MessageSquare className="h-10 w-10" />
                <p className="text-sm">Select a session to view messages</p>
              </div>
            )}
          </Layout>
        ) : (
          <StatsView dbPath={dbPath} />
        )}
      </div>
    </div>
  );
}
