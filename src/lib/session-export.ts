import type { MessageWithParts, PartData } from '../lib/types';
import { formatCost, formatTokens, formatDateTime, formatDuration } from '../lib/utils';

export type ExportFormat = 'markdown' | 'json';

function partToMarkdown(part: { id: string; data: PartData }): string {
  const { data } = part;
  switch (data.type) {
    case 'text':
      return data.text ?? '';
    case 'reasoning':
      if (!data.text) return '';
      return `<details>\n<summary>💭 Reasoning</summary>\n\n${data.text}\n\n</details>`;
    case 'tool':
      {
        const lines: string[] = [];
        lines.push(`**🔧 Tool: ${data.tool ?? 'unknown'}**`);
        if (data.state?.title) lines.push(`> ${data.state.title}`);
        if (data.state?.status) lines.push(`Status: ${data.state.status}`);
        if (data.state?.input) {
          lines.push('\n<details>\n<summary>Input</summary>\n');
          lines.push('```json\n' + JSON.stringify(data.state.input, null, 2) + '\n```');
          lines.push('\n</details>');
        }
        if (data.state?.output) {
          lines.push('\n<details>\n<summary>Output</summary>\n');
          lines.push('```\n' + data.state.output + '\n```');
          lines.push('\n</details>');
        }
        if (data.state?.error) lines.push(`\n❌ Error: ${data.state.error}`);
        return lines.join('\n');
      }
    case 'step-finish':
      {
        const info: string[] = [];
        if (data.cost != null) info.push(`Cost: ${formatCost(data.cost)}`);
        if (data.tokens) {
          info.push(`Tokens: ${formatTokens(data.tokens.input ?? 0)} in / ${formatTokens(data.tokens.output ?? 0)} out`);
        }
        if (data.reason) info.push(`Reason: ${data.reason}`);
        return info.length > 0 ? `*${info.join(' · ')}*` : '';
      }
    default:
      return '';
  }
}

export function exportToMarkdown(
  messages: MessageWithParts[],
  sessionTitle: string,
): string {
  const lines: string[] = [];
  lines.push(`# ${sessionTitle}`);
  lines.push('');
  lines.push(`*Exported at ${new Date().toLocaleString()}*`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const message of messages) {
    const { data, parts } = message;
    const isUser = data.role === 'user';
    const created = data.time?.created ?? message.time_created ?? null;
    const completed = data.time?.completed;
    const duration = created && completed ? formatDuration(created, completed) : null;

    if (isUser) {
      lines.push('## 👤 User');
      if (created) lines.push(`*${formatDateTime(created)}*`);
      lines.push('');
      const textPart = parts.find((p) => p.data.type === 'text');
      const text = textPart?.data.text ?? data.content ?? '';
      lines.push(text);
    } else {
      const header: string[] = ['## 🤖 Assistant'];
      if (data.modelID) header.push(`\`${data.modelID}\``);
      if (data.agent) header.push(`(${data.agent})`);
      lines.push(header.join(' '));

      const meta: string[] = [];
      if (created) meta.push(formatDateTime(created));
      if (duration) meta.push(duration);
      if (data.tokens) {
        meta.push(`${formatTokens(data.tokens.total ?? (data.tokens.input ?? 0) + (data.tokens.output ?? 0))} tokens`);
      }
      if (data.cost != null && data.cost > 0) meta.push(formatCost(data.cost));
      if (meta.length > 0) lines.push(`*${meta.join(' · ')}*`);

      lines.push('');
      for (const part of parts) {
        const md = partToMarkdown(part);
        if (md) {
          lines.push(md);
          lines.push('');
        }
      }

      if (data.error) {
        lines.push(`> ❌ **Error:** ${typeof data.error === 'string' ? data.error : JSON.stringify(data.error)}`);
        lines.push('');
      }
    }

    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

export function exportToJson(
  messages: MessageWithParts[],
  sessionTitle: string,
): string {
  const exportData = {
    title: sessionTitle,
    exportedAt: new Date().toISOString(),
    messageCount: messages.length,
    messages: messages.map((m) => ({
      id: m.id,
      role: m.data.role,
      time: m.data.time,
      model: m.data.modelID,
      provider: m.data.providerID,
      agent: m.data.agent,
      cost: m.data.cost,
      tokens: m.data.tokens,
      content: m.data.content,
      error: m.data.error,
      parts: m.parts.map((p) => ({
        id: p.id,
        type: p.data.type,
        text: p.data.text,
        tool: p.data.tool,
        state: p.data.state,
        cost: p.data.cost,
        tokens: p.data.tokens,
        reason: p.data.reason,
        time: p.data.time,
      })),
    })),
  };
  return JSON.stringify(exportData, null, 2);
}
