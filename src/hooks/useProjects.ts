import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { Project } from '../lib/types';

export function useProjects(dbPath: string | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dbPath) return;
    setLoading(true);
    setError(null);
    invoke<Project[]>('list_projects', { dbPath })
      .then(setProjects)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [dbPath]);

  return { projects, loading, error };
}
