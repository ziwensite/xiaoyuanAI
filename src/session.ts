import { Vault } from "obsidian";
import type { ChatMessage, ChatSession } from "./types";
import { CHAT_SESSIONS_KEY, CURRENT_SESSION_KEY } from "./types";

export function getChatHistoryPath(chatHistoryPath: string): string {
  return chatHistoryPath || ".chatHistory";
}

function getSessionFilePath(chatHistoryPath: string, sessionId: string): string {
  return `${getChatHistoryPath(chatHistoryPath)}/${sessionId}.md`;
}

export async function ensureChatHistoryFolder(vault: Vault, path: string): Promise<void> {
  const folder = vault.getFolderByPath(path);
  if (folder) return;
  try {
    await vault.createFolder(path);
  } catch (e) {
    if (e instanceof Error && e.message.includes("already exists")) {
      return;
    }
    throw e;
  }
}

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
    let thinkingLines: string[] = [];
    let inThinking = false;
    let ts: number | undefined;

    for (const line of lines) {
      if (line.startsWith("**你**:")) {
        role = "user";
      } else if (line.startsWith("**小元**:")) {
        role = "assistant";
      } else if (line.trim() === "> [!thinking] 思考过程") {
        inThinking = true;
      } else if (inThinking) {
        if (line.startsWith("> ")) {
          thinkingLines.push(line.slice(2));
        } else {
          inThinking = false;
          msgContent += line + "\n";
        }
      } else if (role) {
        const tsMatch = line.match(/<!-- ts:(\d+) -->/);
        if (tsMatch) {
          ts = parseInt(tsMatch[1]);
        } else {
          msgContent += line + "\n";
        }
      }
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

function sessionToMarkdown(session: ChatSession | undefined, messages: ChatMessage[]): string {
  let content = `---\ntitle: ${session?.title || "新对话"}\ncreated: ${session?.createdAt || Date.now()}\nupdated: ${Date.now()}\n---\n\n`;
  messages.forEach((msg) => {
    content += `**${msg.role === "user" ? "你" : "小元"}**:\n\n${msg.content}\n\n`;
    if (msg.timestamp) content += `<!-- ts:${msg.timestamp} -->\n\n`;
    if (msg.thinking) {
      content += `> [!thinking] 思考过程\n> ${msg.thinking.replace(/\n/g, "\n> ")}\n\n`;
    }
    content += `---\n\n`;
  });
  return content;
}

async function collectSessionFiles(
  vault: Vault,
  folderPath: string,
): Promise<string[]> {
  const prefix = folderPath + "/";

  try {
    const listed = await vault.adapter.list(folderPath);
    const files = listed.files.filter((f) => f.endsWith(".md"));
    if (files.length > 0) return files;
  } catch {}

  try {
    const files = vault
      .getFiles()
      .filter((f) => f.path.startsWith(prefix) && f.extension === "md")
      .map((f) => f.path);
    if (files.length > 0) return files;
  } catch {}

  return [];
}

export async function scanChatHistoryFolder(
  vault: Vault,
  chatHistoryPath: string,
): Promise<ChatSession[]> {
  try {
    const folderPath = getChatHistoryPath(chatHistoryPath);
    const filePaths = await collectSessionFiles(vault, folderPath);

    const loaded: ChatSession[] = [];

    for (const filePath of filePaths) {
      const sessionId = filePath.split("/").pop()!.replace(".md", "");
      try {
        const content = await vault.adapter.read(filePath);
        const messages = parseMarkdownToMessages(content);

        const match = content.match(/title:\s*(.+)/);
        const title = match
          ? match[1].trim()
          : messages[0]?.content?.slice(0, 30) || "历史对话";

        const matchCreated = content.match(/created:\s*(\d+)/);
        const createdAt = matchCreated ? parseInt(matchCreated[1]) : Date.now();

        const matchUpdated = content.match(/updated:\s*(\d+)/);
        const updatedAt = matchUpdated ? parseInt(matchUpdated[1]) : Date.now();

        loaded.push({
          id: sessionId,
          title,
          createdAt,
          updatedAt,
        });
      } catch (e) {
        console.warn(`读取会话文件 ${filePath} 失败:`, e);
      }
    }

    loaded.sort((a, b) => b.updatedAt - a.updatedAt);
    return loaded;
  } catch (e) {
    console.warn("扫描历史会话文件夹失败:", e);
    return [];
  }
}

async function readVaultFile(vault: Vault, filePath: string): Promise<string | null> {
  try {
    if (await vault.adapter.exists(filePath)) {
      return vault.adapter.read(filePath);
    }
  } catch {}
  try {
    const file = vault.getFiles().find((f) => f.path === filePath);
    if (file) return vault.read(file);
  } catch {}
  return null;
}

export async function loadSessionFromFile(
  vault: Vault,
  chatHistoryPath: string,
  sessionId: string,
): Promise<ChatMessage[]> {
  const filePath = getSessionFilePath(chatHistoryPath, sessionId);
  const content = await readVaultFile(vault, filePath);
  if (!content) return [];
  return parseMarkdownToMessages(content);
}

export async function saveSessionToFile(
  vault: Vault,
  chatHistoryPath: string,
  sessionId: string,
  session: ChatSession | undefined,
  messages: ChatMessage[],
): Promise<void> {
  await ensureChatHistoryFolder(vault, chatHistoryPath);
  const filePath = getSessionFilePath(chatHistoryPath, sessionId);
  const content = sessionToMarkdown(session, messages);

  try {
    if (await vault.adapter.exists(filePath)) {
      await vault.adapter.write(filePath, content);
    } else {
      await vault.create(filePath, content);
    }
  } catch (e) {
    console.warn(`保存会话文件 ${filePath} 失败:`, e);
  }
}

export async function deleteSessionFile(
  vault: Vault,
  chatHistoryPath: string,
  sessionId: string,
): Promise<void> {
  const filePath = getSessionFilePath(chatHistoryPath, sessionId);
  try {
    if (await vault.adapter.exists(filePath)) {
      await vault.adapter.remove(filePath);
    }
  } catch (e) {
    console.warn(`删除会话文件 ${filePath} 失败:`, e);
  }
}

export async function loadSessionsMeta(
  plugin: any,
): Promise<{ sessions: ChatSession[]; currentSessionId: string }> {
  const data = await plugin.loadData();
  let sessions: ChatSession[] = [];
  let currentSessionId = "";

  if (data?.[CHAT_SESSIONS_KEY]) {
    try {
      sessions = JSON.parse(data[CHAT_SESSIONS_KEY]);
    } catch {}
  }

  if (data?.[CURRENT_SESSION_KEY]) {
    currentSessionId = data[CURRENT_SESSION_KEY];
  }

  return { sessions, currentSessionId };
}

export async function saveSessionsMeta(
  plugin: any,
  sessions: ChatSession[],
  currentSessionId: string,
): Promise<void> {
  const data = (await plugin.loadData()) || {};
  data[CHAT_SESSIONS_KEY] = JSON.stringify(sessions.map((s: any) => { const { messages, ...rest } = s; return rest; }));
  data[CURRENT_SESSION_KEY] = currentSessionId;
  await plugin.saveData(data);
}

export function migrateOldData(
  data: Record<string, unknown>,
): ChatMessage[] | null {
  if (data?.["xiaoyuan-chat-history"]) {
    try {
      return JSON.parse(data["xiaoyuan-chat-history"] as string) as ChatMessage[];
    } catch {
      return null;
    }
  }
  return null;
}
