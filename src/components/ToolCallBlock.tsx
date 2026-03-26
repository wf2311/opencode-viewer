import { useState } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronRight, ChevronDown, Wrench, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import type { ToolState } from '../lib/types';
import { CodeBlock } from './CodeBlock';
import { cn } from '../lib/utils';

interface ToolCallBlockProps {
  tool: string;
  state?: ToolState;
}

const statusIcon = {
  completed: <CheckCircle className="h-3.5 w-3.5 text-ctp-green" />,
  running: <Loader2 className="h-3.5 w-3.5 text-ctp-blue animate-spin" />,
  pending: <Clock className="h-3.5 w-3.5 text-ctp-yellow" />,
  error: <AlertCircle className="h-3.5 w-3.5 text-ctp-red" />,
};

export function ToolCallBlock({ tool, state }: ToolCallBlockProps) {
  const [open, setOpen] = useState(false);
  const status = state?.status ?? 'pending';
  const title = state?.title ?? tool;

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="my-1 rounded-md border border-border overflow-hidden">
      <Collapsible.Trigger asChild>
        <button className="flex w-full items-center gap-2 px-3 py-2 text-sm bg-muted hover:bg-muted/80 transition-colors text-left">
          {open ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />}
          <Wrench className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          <span className="flex-1 font-mono font-medium">{title}</span>
          <span className="text-xs text-muted-foreground font-mono">{tool}</span>
          {statusIcon[status]}
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <div className="p-3 space-y-2 border-t border-border">
          {state?.input && Object.keys(state.input).length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1">INPUT</div>
              <CodeBlock
                code={JSON.stringify(state.input, null, 2)}
                language="json"
              />
            </div>
          )}
          {state?.output && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1">OUTPUT</div>
              <pre className={cn(
                "rounded-md border border-border p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto",
                status === 'error' ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-muted/50'
              )}>
                {state.output}
              </pre>
            </div>
          )}
          {state?.error && (
            <div className="text-xs text-destructive bg-destructive/10 rounded p-2 border border-destructive/20">
              {state.error}
            </div>
          )}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
