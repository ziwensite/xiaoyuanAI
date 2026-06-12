import { Vault } from "obsidian";
import type { ChatMessage, ChatSession } from "./types";
import type XiaoyuanAIPlugin from "./main";
import { CHAT_SESSIONS_KEY, CURRENT_SESSION_KEY } from "./constants";
import { formatDate, formatTime } from "./utils";

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
  } catch (err: unknown) {
    if (vault.getFolderByPath(path)) return;
    throw err;
  }
}

export function parseMarkdownToMessages(content: string): ChatMessage[] {
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
    let source = "user";

    const headerRegex = /^\*\*(你|小元|小A|小C)\*\* \((?:CLI|API) · (\d{4}-\d{2}-\d{2} \d{2}:\d{2})\):$/;

    for (const line of lines) {
      const hMatch = line.match(headerRegex);
      if (hMatch) {
        const name = hMatch[1];
        role = name === "你" ? "user" : "assistant";
        source = name === "小A" ? "小A" : name === "小C" ? "小C" : (role === "user" ? "user" : "小元");
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
        source,
      };
      if (thinkingLines.length > 0) msg.thinking = thinkingLines.join("\n").trim();
      if (ts) msg.timestamp = ts;
      messages.push(msg);
    }
  }

  return messages;
}

export function sessionToMarkdown(session: ChatSession | undefined, messages: ChatMessage[], execMode: string): string {
  const now = Date.now();
  const created = session?.createdAt || now;
  let content = `---\ntitle: ${session?.title || "新对话"}\ncreated: ${formatDate(created)}\nupdated: ${formatDate(now)}\n---\n\n`;
  messages.forEach((msg) => {
    const ts = msg.timestamp
      ? ` (${execMode.toUpperCase()} · ${formatTime(msg.timestamp)}):`
      : ":";
    const displayName = msg.source && msg.source !== "user" ? msg.source : (msg.role === "user" ? "你" : "小元");
    content += `**${displayName}**${ts}\n\n${msg.content}\n\n`;
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
      const name = filePath.split("/").pop();
      if (!name) continue;
      const sessionId = name.replace(".md", "");
      try {
        const content = await vault.adapter.read(filePath);
        const messages = parseMarkdownToMessages(content);

        const match = content.match(/title:\s*(.+)/);
        const title = match
          ? match[1].trim()
          : messages[0]?.content?.slice(0, 30) || "历史对话";

        const matchCreated = content.match(/created:\s*(.+)/);
        const createdAt = matchCreated ? new Date(matchCreated[1]).getTime() : Date.now();

        const matchUpdated = content.match(/updated:\s*(.+)/);
        const updatedAt = matchUpdated ? new Date(matchUpdated[1]).getTime() : Date.now();

        loaded.push({
          id: sessionId,
          title,
          createdAt,
          updatedAt,
        });
      } catch (err: unknown) {
        console.warn(`读取会话文件 ${filePath} 失败:`, err);
      }
    }

    loaded.sort((a, b) => b.updatedAt - a.updatedAt);
    return loaded;
  } catch (err: unknown) {
    console.warn("扫描历史会话文件夹失败:", err);
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
  execMode: string,
): Promise<void> {
  await ensureChatHistoryFolder(vault, chatHistoryPath);
  const filePath = getSessionFilePath(chatHistoryPath, sessionId);
  const content = sessionToMarkdown(session, messages, execMode);

  try {
    if (await vault.adapter.exists(filePath)) {
      await vault.adapter.write(filePath, content);
    } else {
      await vault.create(filePath, content);
    }
  } catch (err: unknown) {
    console.warn(`保存会话文件 ${filePath} 失败:`, err);
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
  } catch (err: unknown) {
    console.warn(`删除会话文件 ${filePath} 失败:`, err);
  }
}

export async function loadSessionsMeta(
  plugin: XiaoyuanAIPlugin,
): Promise<{ sessions: ChatSession[]; currentSessionId: string }> {
  const data = await plugin.loadData();
  let sessions: ChatSession[] = [];
  let currentSessionId = "";

  if (data?.[CHAT_SESSIONS_KEY] && typeof data[CHAT_SESSIONS_KEY] === "string") {
    try {
      const parsed = JSON.parse(data[CHAT_SESSIONS_KEY] as string);
      if (Array.isArray(parsed)) sessions = parsed;
    } catch {}
  }

  if (data?.[CURRENT_SESSION_KEY]) {
    currentSessionId = data[CURRENT_SESSION_KEY];
  }

  return { sessions, currentSessionId };
}

export async function saveSessionsMeta(
  plugin: XiaoyuanAIPlugin,
  sessions: ChatSession[],
  currentSessionId: string,
): Promise<void> {
  const data = (await plugin.loadData()) || {};
  data[CHAT_SESSIONS_KEY] = JSON.stringify(sessions.map((s) => {
    const { title, id, createdAt, updatedAt } = s;
    return { title, id, createdAt, updatedAt };
  }));
  data[CURRENT_SESSION_KEY] = currentSessionId;
  await plugin.saveData(data);
}

export function migrateOldData(
  data: Record<string, unknown>,
): ChatMessage[] | null {
  const raw = data?.["xiaoyuan-chat-history"];
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as ChatMessage[] : null;
  } catch {
    return null;
  }
}
