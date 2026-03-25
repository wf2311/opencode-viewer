import { useState, useCallback } from 'react';
import type { Workspace, WorkspaceRule, Project } from '../lib/types';

const STORAGE_KEY = 'opencode-viewer-workspaces';
const ACTIVE_KEY = 'opencode-viewer-active-workspace';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadWorkspaces(): Workspace[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Workspace[];
  } catch {
    // ignore
  }
  return [];
}

function saveWorkspaces(workspaces: Workspace[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
}

function loadActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

function saveActiveId(id: string | null): void {
  if (id) {
    localStorage.setItem(ACTIVE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

export function matchesRule(project: Project, rule: WorkspaceRule): boolean {
  if (rule.match === 'name') {
    const projectName = project.name ?? project.worktree.split('/').pop() ?? '';
    return projectName.toLowerCase().includes(rule.value.toLowerCase());
  } else {
    // path prefix matching
    return project.worktree.toLowerCase().startsWith(rule.value.toLowerCase());
  }
}

export function filterProjectsByWorkspace(projects: Project[], workspace: Workspace | null): Project[] {
  if (!workspace || workspace.rules.length === 0) return projects;

  const includeRules = workspace.rules.filter(r => r.type === 'include');
  const excludeRules = workspace.rules.filter(r => r.type === 'exclude');

  return projects.filter(project => {
    // If there are include rules, project must match at least one
    if (includeRules.length > 0) {
      const included = includeRules.some(rule => matchesRule(project, rule));
      if (!included) return false;
    }
    // Project must not match any exclude rule
    if (excludeRules.length > 0) {
      const excluded = excludeRules.some(rule => matchesRule(project, rule));
      if (excluded) return false;
    }
    return true;
  });
}

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(loadWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(loadActiveId);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) ?? null;

  const setActiveWorkspaceId = useCallback((id: string | null) => {
    setActiveWorkspaceIdState(id);
    saveActiveId(id);
  }, []);

  const addWorkspace = useCallback((name: string, rules: WorkspaceRule[] = []) => {
    const workspace: Workspace = { id: generateId(), name, rules };
    const updated = [...workspaces, workspace];
    setWorkspaces(updated);
    saveWorkspaces(updated);
    return workspace;
  }, [workspaces]);

  const updateWorkspace = useCallback((id: string, updates: Partial<Omit<Workspace, 'id'>>) => {
    const updated = workspaces.map(w =>
      w.id === id ? { ...w, ...updates } : w
    );
    setWorkspaces(updated);
    saveWorkspaces(updated);
  }, [workspaces]);

  const deleteWorkspace = useCallback((id: string) => {
    const updated = workspaces.filter(w => w.id !== id);
    setWorkspaces(updated);
    saveWorkspaces(updated);
    if (activeWorkspaceId === id) {
      setActiveWorkspaceId(null);
    }
  }, [workspaces, activeWorkspaceId, setActiveWorkspaceId]);

  return {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    setActiveWorkspaceId,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
  };
}
