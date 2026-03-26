export interface Project {
  id: string;
  worktree: string;
  name: string | null;
  icon_color: string | null;
  time_created: number | null;
}

export interface Session {
  id: string;
  project_id: string;
  parent_id: string | null;
  slug: string;
  directory: string;
  title: string;
  time_created: number | null;
  time_updated: number | null;
  time_archived: number | null;
  children?: Session[];
}

export interface MessageInfo {
  role: 'user' | 'assistant';
  time: { created: number; completed?: number };
  cost?: number;
  tokens?: { input: number; output: number; reasoning: number; total?: number; cache: { read: number; write: number } };
  modelID?: string;
  providerID?: string;
  agent?: string;
  content?: string;
  error?: any;
}

export interface PartData {
  type: 'text' | 'tool' | 'step-finish' | 'step-start' | 'reasoning' | 'file' | 'snapshot' | 'patch' | 'agent' | 'compaction' | 'subtask' | 'retry';
  text?: string;
  callID?: string;
  tool?: string;
  state?: ToolState;
  cost?: number;
  tokens?: any;
  reason?: string;
  time?: { start: number; end?: number };
}

export type ToolStateStatus = 'pending' | 'running' | 'completed' | 'error';

export interface ToolState {
  status: ToolStateStatus;
  input?: Record<string, any>;
  output?: string;
  title?: string;
  error?: string;
  time?: { start: number; end?: number };
}

export interface MessageWithParts {
  id: string;
  session_id: string;
  time_created: number | null;
  data: MessageInfo;
  parts: Array<{ id: string; data: PartData }>;
}

export interface UsageStat {
  date: string;
  provider_id: string;
  model_id: string;
  total_cost: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  message_count: number;
}

export interface DailyUsage {
  date: string;
  total_cost: number;
  input_tokens: number;
  output_tokens: number;
}

export interface ModelUsage {
  provider_id: string;
  model_id: string;
  total_cost: number;
  total_tokens: number;
  message_count: number;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
}

// Workspace types
export interface WorkspaceRule {
  type: 'include' | 'exclude';
  match: 'name' | 'path';
  value: string;
}

export interface Workspace {
  id: string;
  name: string;
  rules: WorkspaceRule[];
}

// Model pricing types
export interface ModelPriceConfig {
  input: number;   // cost per million input tokens
  output: number;  // cost per million output tokens
  cacheRead?: number;  // cost per million cache read tokens
  cacheWrite?: number; // cost per million cache write tokens
}

export interface ModelPricingMap {
  [modelId: string]: ModelPriceConfig;
}
