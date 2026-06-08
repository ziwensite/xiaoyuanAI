import { describe, it, expect } from "vitest";
import type { ChatMessage, ChatSession } from "../src/types";
import { parseMarkdownToMessages, sessionToMarkdown } from "../src/session";
import { formatDate, formatTime } from "../src/utils";

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

**你**:\n\nline1\nline2\nline3\n\n---`;
    const result = parseMarkdownToMessages(md);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("formatDate", () => {
  it("formats a timestamp correctly", () => {
    const d = new Date(2025, 0, 15);
    expect(formatDate(d.getTime())).toBe("2025-01-15");
  });
});

describe("formatTime", () => {
  it("includes hours and minutes", () => {
    const d = new Date(2025, 5, 10, 14, 30);
    expect(formatTime(d.getTime())).toContain("14:30");
  });
});