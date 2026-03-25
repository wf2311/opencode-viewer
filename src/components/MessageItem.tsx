import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { MessageWithParts, PartData } from '../lib/types';
import { CodeBlock } from './CodeBlock';
import { ToolCallBlock } from './ToolCallBlock';
import { Badge } from './ui/badge';
import { formatCost, formatTokens, formatDateTime, formatDuration } from '../lib/utils';
import { Bot, User, Brain, Coins } from 'lucide-react';
import { cn } from '../lib/utils';

interface MessageItemProps {
  message: MessageWithParts;
}

function MarkdownContent({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
          const match = /language-(\w+)/.exec(className || '');
          const code = String(children).replace(/\n$/, '');
          const isInline = !match && !code.includes('\n');
          if (isInline) {
            return <CodeBlock code={code} inline />;
          }
          return <CodeBlock code={code} language={match?.[1]} />;
        },
        pre({ children }: React.HTMLAttributes<HTMLElement>) {
          return <>{children}</>;
        },
        p({ children }: React.HTMLAttributes<HTMLElement>) {
          return <p className="mb-2 last:mb-0">{children}</p>;
        },
        ul({ children }: React.HTMLAttributes<HTMLElement>) {
          return <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>;
        },
        ol({ children }: React.HTMLAttributes<HTMLElement>) {
          return <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>;
        },
        blockquote({ children }: React.HTMLAttributes<HTMLElement>) {
          return <blockquote className="border-l-4 border-border pl-3 italic text-muted-foreground">{children}</blockquote>;
        },
        h1({ children }: React.HTMLAttributes<HTMLElement>) { return <h1 className="text-xl font-bold mb-2">{children}</h1>; },
        h2({ children }: React.HTMLAttributes<HTMLElement>) { return <h2 className="text-lg font-bold mb-2">{children}</h2>; },
        h3({ children }: React.HTMLAttributes<HTMLElement>) { return <h3 className="text-base font-bold mb-1">{children}</h3>; },
        a({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
          return <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>;
        },
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

function PartRenderer({ part }: { part: { id: string; data: PartData } }) {
  const { data } = part;
  switch (data.type) {
    case 'text':
      if (!data.text) return null;
      return (
        <div className="prose prose-sm max-w-none text-foreground">
          <MarkdownContent text={data.text} />
        </div>
      );
    case 'reasoning':
      if (!data.text) return null;
      return (
        <details className="my-1 rounded-md border border-border">
          <summary className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground cursor-pointer hover:bg-muted/50 select-none">
            <Brain className="h-3.5 w-3.5" />
            <span>Reasoning</span>
          </summary>
          <div className="px-3 py-2 text-sm text-muted-foreground border-t border-border">
            <MarkdownContent text={data.text} />
          </div>
        </details>
      );
    case 'tool':
      return <ToolCallBlock tool={data.tool ?? 'unknown'} state={data.state} />;
    case 'step-finish':
      if (!data.cost && !data.tokens) return null;
      return (
        <div className="flex items-center gap-3 text-xs text-muted-foreground py-1">
          <Coins className="h-3.5 w-3.5" />
          {data.cost != null && <span>{formatCost(data.cost)}</span>}
          {data.tokens && (
            <span>
              {formatTokens(data.tokens.input ?? 0)} in / {formatTokens(data.tokens.output ?? 0)} out
            </span>
          )}
          {data.reason && <span className="text-xs">· {data.reason}</span>}
        </div>
      );
    default:
      return null;
  }
}

export function MessageItem({ message }: MessageItemProps) {
  const { data, parts } = message;
  const isUser = data.role === 'user';
  const created = data.time?.created ?? message.time_created ?? null;
  const completed = data.time?.completed;
  const duration = created && completed ? formatDuration(created, completed) : null;

  if (isUser) {
    const textPart = parts.find((p) => p.data.type === 'text');
    const text = textPart?.data.text ?? '';
    return (
      <div className="flex justify-end px-4 py-2">
        <div className="max-w-[80%] flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            {created && <span>{formatDateTime(created)}</span>}
          </div>
          <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm">
            <div className="whitespace-pre-wrap">{text}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-3 px-4 py-2')}>
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-secondary flex items-center justify-center mt-1">
        <Bot className="h-4 w-4 text-secondary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          {data.modelID && (
            <Badge variant="secondary" className="text-xs">
              {data.modelID}
            </Badge>
          )}
          {data.agent && (
            <Badge variant="outline" className="text-xs">
              {data.agent}
            </Badge>
          )}
          {created && (
            <span className="text-xs text-muted-foreground">{formatDateTime(created)}</span>
          )}
          {duration && (
            <span className="text-xs text-muted-foreground">· {duration}</span>
          )}
          {data.tokens && (
            <span className="text-xs text-muted-foreground">
              · {formatTokens(data.tokens.total ?? data.tokens.input + data.tokens.output)} tokens
            </span>
          )}
          {data.cost != null && data.cost > 0 && (
            <span className="text-xs text-muted-foreground">· {formatCost(data.cost)}</span>
          )}
        </div>
        <div className="space-y-1">
          {parts.map((part) => (
            <PartRenderer key={part.id} part={part} />
          ))}
        </div>
        {data.error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-md p-2 border border-red-200">
            {typeof data.error === 'string' ? data.error : JSON.stringify(data.error)}
          </div>
        )}
      </div>
    </div>
  );
}
