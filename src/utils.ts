import type { FileDiff } from "./types";

export function estimateTokens(text: string): number {
  let tokens = 0;
  for (const ch of text) {
    tokens += ch.charCodeAt(0) > 127 ? 1.5 : 0.25;
  }
  return Math.ceil(tokens);
}

export function parseDiffText(text: string): FileDiff[] {
  const result: FileDiff[] = [];
  const blocks = text.split(/(?=^diff --git )/m);
  for (const block of blocks) {
    if (!block.trim()) continue;
    const file = block.match(/^\+\+\+ b\/(.+)$/m)?.[1] || "";
    if (!file) continue;
    const lines = block.split("\n");
    const startIdx = lines.findIndex(l => l.startsWith("@@"));
    const beforeLines: string[] = [];
    const afterLines: string[] = [];
    for (let i = startIdx + 1; i < lines.length; i++) {
      const l = lines[i];
      if (l.startsWith("-")) beforeLines.push(l.slice(1));
      else if (l.startsWith("+")) afterLines.push(l.slice(1));
      else { beforeLines.push(l); afterLines.push(l); }
    }
    const addCount = lines.filter(l => l.startsWith("+") && !l.startsWith("+++")).length;
    const delCount = lines.filter(l => l.startsWith("-") && !l.startsWith("---")).length;
    result.push({ file, before: beforeLines.join("\n"), after: afterLines.join("\n"), additions: addCount, deletions: delCount });
  }
  return result;
}

export function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return (h >>> 0).toString(36);
}

export function ensureApiUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : trimmed + "/chat/completions";
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function tryParseJson<T>(raw: string): T | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return null;
    if (typeof parsed === "object") return parsed as T;
    return parsed as T;
  } catch {
    return null;
  }
}

export function parseMcpHeaders(headers: string): Record<string, string> {
  try {
    const parsed = JSON.parse(headers);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {}
  return {};
}
