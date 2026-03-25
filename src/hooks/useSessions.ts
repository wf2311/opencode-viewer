import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { Session } from '../lib/types';

function buildSessionTree(sessions: Session[]): Session[] {
  const map = new Map<string, Session>();
  const roots: Session[] = [];

  sessions.forEach((s) => map.set(s.id, { ...s, children: [] }));

  map.forEach((session) => {
    if (session.parent_id && map.has(session.parent_id)) {
      const parent = map.get(session.parent_id)!;
      parent.children = parent.children ?? [];
      parent.children.push(session);
    } else {
      roots.push(session);
    }
  });

  return roots;
}

export function useSessions(dbPath: string | null) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dbPath) return;
    setLoading(true);
    setError(null);
    invoke<Session[]>('list_sessions', { dbPath })
      .then((flat) => setSessions(buildSessionTree(flat)))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [dbPath]);

  return { sessions, loading, error };
}
