import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { MessageWithParts } from '../lib/types';

export function useMessages(dbPath: string | null, sessionId: string | null) {
  const [messages, setMessages] = useState<MessageWithParts[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dbPath || !sessionId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    setError(null);
    invoke<MessageWithParts[]>('list_messages', { dbPath, sessionId })
      .then(setMessages)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [dbPath, sessionId]);

  return { messages, loading, error };
}
