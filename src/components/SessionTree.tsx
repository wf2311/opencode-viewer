import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, MessageSquare, Archive, Clock } from 'lucide-react';
import type { Session, Project } from '../lib/types';
import { cn } from '../lib/utils';

function formatTime(ts: number | null): string {
  if (!ts) return '';
  const d = new Date(ts < 1e12 ? ts * 1000 : ts);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hours}:${mins}`;
}

/* ── Session node (right panel) ── */

interface SessionNodeProps {
  session: Session;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function SessionNode({ session, depth, selectedId, onSelect }: SessionNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = session.children && session.children.length > 0;
  const isSelected = selectedId === session.id;

  return (
    <div>
      <button
        className={cn(
          'flex w-full items-center gap-1.5 px-2 py-2 text-sm rounded-md transition-colors text-left group',
          isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground',
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => {
          onSelect(session.id);
          if (hasChildren) setExpanded(!expanded);
        }}
      >
        {hasChildren ? (
          expanded ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
        ) : (
          <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 truncate">{session.title}</span>
        <span className="flex items-center gap-2 flex-shrink-0 ml-1">
          {session.time_archived && <Archive className="h-3 w-3 text-muted-foreground opacity-60" />}
          <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap flex items-center gap-0.5" title={`Created: ${formatTime(session.time_created)}\nUpdated: ${formatTime(session.time_updated)}`}>
            <Clock className="h-2.5 w-2.5" />
            {formatTime(session.time_updated ?? session.time_created)}
          </span>
        </span>
      </button>
      {expanded && hasChildren && (
        <div>
          {session.children!.map((child) => (
            <SessionNode key={child.id} session={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Project card (left panel) ── */

interface ProjectCardProps {
  project: Project;
  sessionCount: number;
  latestUpdate: number | null;
  isSelected: boolean;
  onSelect: () => void;
}

function ProjectCard({ project, sessionCount, latestUpdate, isSelected, onSelect }: ProjectCardProps) {
  const name = project.name ?? project.worktree.split('/').pop() ?? 'Unknown Project';

  return (
    <button
      className={cn(
        'flex flex-col w-full gap-1 px-3 py-2.5 rounded-lg transition-colors text-left border',
        isSelected
          ? 'bg-primary/10 border-primary/30 text-foreground'
          : 'hover:bg-muted border-transparent text-foreground',
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        {isSelected ? <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" /> : <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
        <span className="text-sm font-medium truncate flex-1">{name}</span>
      </div>
      <div className="flex items-center justify-between pl-6">
        <span className="text-[10px] text-muted-foreground truncate max-w-[60%]" title={project.worktree}>
          {project.worktree}
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums flex-shrink-0">
          {sessionCount} sessions
        </span>
      </div>
    </button>
  );
}

/* ── Session list (right panel) ── */

interface SessionListProps {
  sessions: Session[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function SessionList({ sessions, selectedId, onSelect }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
        <p className="text-sm">No sessions</p>
      </div>
    );
  }

  return (
    <div className="px-2 py-1 space-y-0.5">
      {sessions.map((session) => (
        <SessionNode key={session.id} session={session} depth={0} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}

/* ── Main export: ProjectList ── */

interface ProjectListProps {
  projects: Project[];
  sessions: Session[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
}

export function ProjectList({ projects, sessions, selectedProjectId, onSelectProject }: ProjectListProps) {
  // Sort projects by latest session update time desc
  const sortedProjects = useMemo(() => {
    const latestMap = new Map<string, number>();
    for (const s of sessions) {
      const t = s.time_updated ?? s.time_created ?? 0;
      const cur = latestMap.get(s.project_id) ?? 0;
      if (t > cur) latestMap.set(s.project_id, t);
    }
    return [...projects].sort((a, b) => (latestMap.get(b.id) ?? 0) - (latestMap.get(a.id) ?? 0));
  }, [projects, sessions]);

  const sessionCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      map.set(s.project_id, (map.get(s.project_id) ?? 0) + 1);
    }
    return map;
  }, [sessions]);

  const latestUpdates = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      const t = s.time_updated ?? s.time_created ?? 0;
      const cur = map.get(s.project_id) ?? 0;
      if (t > cur) map.set(s.project_id, t);
    }
    return map;
  }, [sessions]);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
        <p className="text-sm">No projects found</p>
      </div>
    );
  }

  return (
    <div className="px-2 py-2 space-y-0.5">
      {sortedProjects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          sessionCount={sessionCounts.get(project.id) ?? 0}
          latestUpdate={latestUpdates.get(project.id) ?? null}
          isSelected={selectedProjectId === project.id}
          onSelect={() => onSelectProject(project.id)}
        />
      ))}
    </div>
  );
}

export { SessionList };
