import { useEffect, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { VirtuosoHandle } from 'react-virtuoso';
import { useMessages } from '../hooks/useMessages';
import { MessageItem } from './MessageItem';
import { Loader2, MessageSquare } from 'lucide-react';

interface MessageListProps {
  dbPath: string;
  sessionId: string;
}

export function MessageList({ dbPath, sessionId }: MessageListProps) {
  const { messages, loading, error } = useMessages(dbPath, sessionId);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, behavior: 'auto' }), 50);
    }
  }, [messages.length, sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <MessageSquare className="h-8 w-8" />
        <p className="text-sm">No messages in this session</p>
      </div>
    );
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      className="h-full"
      data={messages}
      itemContent={(_, message) => <MessageItem key={message.id} message={message} />}
      components={{
        Footer: () => <div className="h-4" />,
        Header: () => <div className="h-2" />,
      }}
    />
  );
}
