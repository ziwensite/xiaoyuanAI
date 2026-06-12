import type { XiaoyuanAISettings, ChatMessage } from "./types";

export const DELEGATE_RE = /@(\S+?)(?:\s|$)/g;

export function getActiveAssistant(s: XiaoyuanAISettings): { name: string; avatar: string } {
  const cfg = s.execMode === "api" ? s.assistantA : s.assistantC;
  return { name: cfg.name || (s.execMode === "api" ? "小A" : "小C"), avatar: cfg.avatar || (s.execMode === "api" ? "sparkles" : "server") };
}

export function getAssistantConfig(s: XiaoyuanAISettings, name: string): null | { name: string; systemPrompt: string; avatar: string } {
  if (name === s.assistantA.name) return s.assistantA;
  if (name === s.assistantC.name) return s.assistantC;
  return null;
}

export function allAssistantNames(s: XiaoyuanAISettings): string[] {
  return [s.assistantA.name, s.assistantC.name].filter(Boolean);
}

export function resolveTarget(text: string, s: XiaoyuanAISettings): { target: string; cleanText: string } {
  for (const name of allAssistantNames(s)) {
    const atMention = `@${name}`;
    if (text.startsWith(atMention)) {
      return { target: name, cleanText: text.slice(atMention.length).trim() };
    }
    if (text.startsWith(name + "，") || text.startsWith(name + ",") || text.startsWith(name + " ")) {
      const prefix = text.startsWith(name + "，") ? name + "，" : text.startsWith(name + ",") ? name + "," : name + " ";
      return { target: name, cleanText: text.slice(prefix.length).trim() };
    }
  }
  const active = getActiveAssistant(s);
  return { target: active.name, cleanText: text };
}

export function extractDelegations(text: string, s: XiaoyuanAISettings): { target: string; task: string }[] {
  const names = allAssistantNames(s);
  if (names.length < 2) return [];
  const result: { target: string; task: string }[] = [];
  const re = /@(\S+?)\s+(.+?)(?=\n|$)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const candidate = match[1];
    const task = match[2].trim();
    if (names.includes(candidate) && task) {
      result.push({ target: candidate, task });
    }
  }
  return result;
}

export function buildAssistantMessages(messages: ChatMessage[], systemPrompt: string, userContent: string, source: string): string {
  const modeIdentity = `\n\n当前助手: ${source}`;
  const allMessages = [
    { role: "system" as const, content: systemPrompt + modeIdentity },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userContent },
  ];
  return allMessages
    .map((m) => `${m.role === "system" ? "[系统]" : m.role === "user" ? "[用户]" : `[${source}]`}: ${m.content}`)
    .join("\n\n");
}
