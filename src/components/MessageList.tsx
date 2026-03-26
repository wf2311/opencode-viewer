import { useEffect, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { VirtuosoHandle } from 'react-virtuoso';
import { useMessages } from '../hooks/useMessages';
import { MessageItem } from './MessageItem';
import { Loader2, MessageSquare, Download, FileJson, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { exportToMarkdown, exportToJson } from '../lib/session-export';
import type { ExportFormat } from '../lib/session-export';

interface MessageListProps {
  dbPath: string;
  sessionId: string;
  sessionTitle?: string;
}

export function MessageList({ dbPath, sessionId, sessionTitle }: MessageListProps) {
  const { messages, loading, error } = useMessages(dbPath, sessionId);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const sanitizeFilename = (value: string) =>
    value
      .trim()
      .replace(/[/\\:*?"<>|]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 200) || 'Session';

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, behavior: 'auto' }), 50);
    }
  }, [messages.length, sessionId]);

  const handleExport = async (format: ExportFormat) => {
    setShowExportMenu(false);
    const title = sessionTitle ?? 'Session';
    const safeTitle = sanitizeFilename(title);

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'markdown') {
      content = exportToMarkdown(messages, title);
      filename = `${safeTitle}.md`;
      mimeType = 'text/markdown';
    } else {
      content = exportToJson(messages, title);
      filename = `${safeTitle}.json`;
      mimeType = 'application/json';
    }

    // Try Tauri save dialog first, fall back to browser download
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      const filePath = await save({
        filters: format === 'markdown'
          ? [{ name: 'Markdown', extensions: ['md'] }]
          : [{ name: 'JSON', extensions: ['json'] }],
        defaultPath: filename,
      });
      if (filePath) {
        await writeTextFile(filePath, content);
      }
    } catch {
      // Fallback: browser download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

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
        <div className="text-destructive text-sm">{error}</div>
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
    <div className="flex flex-col h-full">
      {/* Export toolbar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border flex-shrink-0">
        <span className="text-xs text-muted-foreground">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
          {sessionTitle && <span className="ml-2 font-medium text-foreground">{sessionTitle}</span>}
        </span>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => setShowExportMenu(!showExportMenu)}
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-md shadow-lg z-50 py-1 min-w-[140px]">
              <button
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-muted text-left"
                onClick={() => handleExport('markdown')}
              >
                <FileText className="h-3.5 w-3.5" />
                Export as Markdown
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-muted text-left"
                onClick={() => handleExport('json')}
              >
                <FileJson className="h-3.5 w-3.5" />
                Export as JSON
              </button>
            </div>
          )}
        </div>
      </div>
      <Virtuoso
        ref={virtuosoRef}
        className="flex-1"
        data={messages}
        itemContent={(_, message) => <MessageItem key={message.id} message={message} />}
        components={{
          Footer: () => <div className="h-4" />,
          Header: () => <div className="h-2" />,
        }}
      />
    </div>
  );
}
