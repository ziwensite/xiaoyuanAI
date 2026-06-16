import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveSessionToFile, loadSessionFromFile, scanChatHistoryFolder, getChatHistoryPath, ensureChatHistoryFolder, deleteSessionFile } from "../src/session";
import type { ChatMessage, ChatSession } from "../src/types";

const store = new Map<string, string>();

function createMockVault() {
  store.clear();
  return {
    getFolderByPath: vi.fn(() => null),
    createFolder: vi.fn(async () => {}),
    create: vi.fn(async (path: string, content: string) => { store.set(path, content); }),
    adapter: {
      exists: vi.fn(async (path: string) => store.has(path)),
      read: vi.fn(async (path: string) => store.get(path) || ""),
      write: vi.fn(async (path: string, content: string) => { store.set(path, content); }),
      remove: vi.fn(async (path: string) => { store.delete(path); }),
      list: vi.fn(async (_path: string) => {
        const files: string[] = [];
        for (const key of store.keys()) {
          if (key.endsWith(".md")) files.push(key);
        }
        return { files, folders: [] };
      }),
    },
    getFiles: vi.fn(() => []),
  };
}

describe("getChatHistoryPath", () => {
  it("returns the given path when provided", () => {
    expect(getChatHistoryPath("myChats")).toBe("myChats");
  });

  it("returns default path when empty", () => {
    expect(getChatHistoryPath("")).toBe("_xiaoyuanAI/chatHistory");
  });
});

describe("session file round-trip", () => {
  const vault = createMockVault();
  const chatHistoryPath = "_testHistory";
  const sessionId = "session-test-123";
  const ts = 1700000000000;

  const session: ChatSession = {
    id: sessionId,
    title: "测试对话",
    createdAt: ts,
    updatedAt: ts,
  };

  const messages: ChatMessage[] = [
    { id: "msg-1", role: "user", content: "你好", timestamp: ts },
    { id: "msg-2", role: "assistant", content: "你好！", timestamp: ts + 1000 },
  ];

  beforeEach(() => {
    store.clear();
  });

  it("save and load round-trip preserves content", async () => {
    await ensureChatHistoryFolder(vault as never, chatHistoryPath);
    await saveSessionToFile(vault as never, chatHistoryPath, sessionId, session, messages, "cli");

    const loaded = await loadSessionFromFile(vault as never, chatHistoryPath, sessionId);
    expect(loaded).toHaveLength(2);
    expect(loaded[0].role).toBe("user");
    expect(loaded[0].content).toBe("你好");
    expect(loaded[1].role).toBe("assistant");
    expect(loaded[1].content).toBe("你好！");
  });

  it("returns empty array for non-existent session", async () => {
    const loaded = await loadSessionFromFile(vault as never, chatHistoryPath, "nonexistent");
    expect(loaded).toEqual([]);
  });

  it("session appears in scan results", async () => {
    await saveSessionToFile(vault as never, chatHistoryPath, sessionId, session, messages, "cli");
    const sessions = await scanChatHistoryFolder(vault as never, chatHistoryPath);
    expect(sessions.length).toBeGreaterThanOrEqual(1);
    expect(sessions.some((s) => s.id === sessionId)).toBe(true);
  });

  it("delete removes the session file", async () => {
    await saveSessionToFile(vault as never, chatHistoryPath, "to-delete", session, messages, "cli");
    const before = await scanChatHistoryFolder(vault as never, chatHistoryPath);
    expect(before.some((s) => s.id === "to-delete")).toBe(true);

    await deleteSessionFile(vault as never, chatHistoryPath, "to-delete");
    const after = await scanChatHistoryFolder(vault as never, chatHistoryPath);
    expect(after.some((s) => s.id === "to-delete")).toBe(false);
  });
});