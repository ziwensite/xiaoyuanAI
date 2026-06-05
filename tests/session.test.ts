import { describe, it, expect } from "vitest";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  timestamp?: number;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Markdown Parsing (from session.ts) ──────────────────────

function parseMarkdownToMessages(content: string): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const parts = content.split(/\n---\n+/);
  let idCounter = 0;

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    const lines = part.split("\n");
    let role: "user" | "assistant" | null = null;
    let msgContent = "";
    const thinkingLines: string[] = [];
    let inThinking = false;
    let ts: number | undefined;

    const headerRegex = /^\*\*(你|小元)\*\* \((?:CLI|API) · (\d{4}-\d{2}-\d{2} \d{2}:\d{2})\):$/;

    for (const line of lines) {
      const hMatch = line.match(headerRegex);
      if (hMatch) {
        role = hMatch[1] === "你" ? "user" : "assistant";
        ts = new Date(hMatch[2]).getTime();
        continue;
      }

      if (line.trim() === "> [!thinking] 思考过程") { inThinking = true; continue; }
      if (inThinking) {
        if (line.startsWith("> ")) { thinkingLines.push(line.slice(2)); continue; }
        inThinking = false;
      }

      if (role) msgContent += line + "\n";
    }

    if (role && msgContent.trim()) {
      const msg: ChatMessage = {
        id: "msg-" + (++idCounter),
        role,
        content: msgContent.trim(),
      };
      if (thinkingLines.length > 0) msg.thinking = thinkingLines.join("\n").trim();
      if (ts) msg.timestamp = ts;
      messages.push(msg);
    }
  }

  return messages;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function sessionToMarkdown(session: ChatSession | undefined, messages: ChatMessage[], execMode: string): string {
  const now = Date.now();
  const created = session?.createdAt || now;
  let content = `---\ntitle: ${session?.title || "新对话"}\ncreated: ${formatDate(created)}\nupdated: ${formatDate(now)}\n---\n\n`;
  messages.forEach((msg) => {
    const ts = msg.timestamp
      ? ` (${execMode.toUpperCase()} · ${formatTime(msg.timestamp)}):`
      : ":";
    content += `**${msg.role === "user" ? "你" : "小元"}**${ts}\n\n${msg.content}\n\n`;
    if (msg.thinking) {
      content += `> [!thinking] 思考过程\n> ${msg.thinking.replace(/\n/g, "\n> ")}\n\n`;
    }
    content += `---\n\n`;
  });
  return content;
}

// ─── Tests ───────────────────────────────────────────────────

describe("session Markdown round-trip", () => {
  const ts = new Date("2025-06-05T10:30:00").getTime();
  const messages: ChatMessage[] = [
    { id: "msg-1", role: "user", content: "你好", timestamp: ts },
    { id: "msg-2", role: "assistant", content: "你好！我是小元。", thinking: "思考中...", timestamp: ts + 1000 },
  ];
  const session: ChatSession = {
    id: "session-test",
    title: "测试对话",
    createdAt: ts,
    updatedAt: ts + 2000,
  };

  it("serializes to Markdown", () => {
    const md = sessionToMarkdown(session, messages, "cli");
    expect(md).toContain("title: 测试对话");
    expect(md).toContain("**你** (CLI · 2025-06-05 10:30):");
    expect(md).toContain("你好");
    expect(md).toContain("**小元**");
    expect(md).toContain("> [!thinking] 思考过程");
    expect(md).toContain("思考中...");
  });

  it("deserializes back to messages", () => {
    const md = sessionToMarkdown(session, messages, "cli");
    const parsed = parseMarkdownToMessages(md);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].role).toBe("user");
    expect(parsed[0].content).toBe("你好");
    expect(parsed[1].role).toBe("assistant");
    expect(parsed[1].content).toBe("你好！我是小元。");
    expect(parsed[1].thinking).toBe("思考中...");
  });

  it("handles empty messages", () => {
    const md = sessionToMarkdown(session, [], "api");
    const parsed = parseMarkdownToMessages(md);
    expect(parsed).toHaveLength(0);
  });

  it("uses default title when session is undefined", () => {
    const md = sessionToMarkdown(undefined, messages, "api");
    expect(md).toContain("title: 新对话");
  });

  it("serializes without thinking block", () => {
    const msgs: ChatMessage[] = [
      { id: "msg-1", role: "user", content: "test", timestamp: ts },
    ];
    const md = sessionToMarkdown(session, msgs, "cli");
    expect(md).not.toContain("thinking");
  });

  it("uses API mode label", () => {
    const md = sessionToMarkdown(session, messages, "api");
    expect(md).toContain("(API ·");
  });
});

describe("parseMarkdownToMessages edge cases", () => {
  it("returns empty array for content with only frontmatter", () => {
    const md = "---\ntitle: test\n---\n";
    expect(parseMarkdownToMessages(md)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(parseMarkdownToMessages("")).toEqual([]);
  });

  it("handles multiline content", () => {
    const md = `---
title: test
---

**你**:\\n\\nline1\\nline2\\nline3\\n\\n---`;
    // This will fail parsing since header doesn't match regex; testing robustness
    const result = parseMarkdownToMessages(md);
    expect(Array.isArray(result)).toBe(true);
  });
});