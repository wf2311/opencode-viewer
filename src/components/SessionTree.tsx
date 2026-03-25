import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, MessageSquare, Archive } from 'lucide-react';
import type { Session, Project } from '../lib/types';
import { cn } from '../lib/utils';

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
          'flex w-full items-center gap-1.5 px-2 py-1.5 text-sm rounded-md transition-colors text-left',
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
        {session.time_archived && <Archive className="h-3 w-3 flex-shrink-0 text-muted-foreground opacity-60" />}
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

interface ProjectGroupProps {
  project: Project;
  sessions: Session[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function ProjectGroup({ project, sessions, selectedId, onSelect }: ProjectGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const name = project.name ?? project.worktree.split('/').pop() ?? 'Unknown Project';

  return (
    <div className="mb-1">
      <button
        className="flex w-full items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-md transition-colors uppercase tracking-wide"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <><FolderOpen className="h-3.5 w-3.5" /><span className="flex-1 truncate text-left">{name}</span><ChevronDown className="h-3 w-3" /></>
        ) : (
          <><Folder className="h-3.5 w-3.5" /><span className="flex-1 truncate text-left">{name}</span><ChevronRight className="h-3 w-3" /></>
        )}
      </button>
      {expanded && (
        <div className="mt-0.5">
          {sessions.map((session) => (
            <SessionNode key={session.id} session={session} depth={0} selectedId={selectedId} onSelect={onSelect} />
          ))}
          {sessions.length === 0 && (
            <p className="px-4 py-1 text-xs text-muted-foreground italic">No sessions</p>
          )}
        </div>
      )}
    </div>
  );
}

interface SessionTreeProps {
  projects: Project[];
  sessions: Session[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SessionTree({ projects, sessions, selectedId, onSelect }: SessionTreeProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
        <p className="text-sm">No projects found</p>
      </div>
    );
  }

  return (
    <div className="px-2 py-2 space-y-0.5">
      {projects.map((project) => {
        const projectSessions = sessions.filter((s) => s.project_id === project.id);
        return (
          <ProjectGroup
            key={project.id}
            project={project}
            sessions={projectSessions}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}
