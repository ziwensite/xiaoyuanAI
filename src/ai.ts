import { getVaultBasePath } from "./server";
import { getActiveProvider } from "./constants";
import type { XiaoyuanAISettings, FileDiff, ModelCaps, ModelEntry } from "./types";
import { requestOpenCode, readServerConn, connectSSE, combineSignals } from "./opencode-client";
import { ensureOpenCodeServer, stopOpenCodeServer } from "./opencode-server";
import { callAIWithAPI, ensureApiUrl, processAPISSEStream } from "./api-client";

export { stopOpenCodeServer, ensureOpenCodeServer } from "./opencode-server";
export { fetchOpenCodeModelsFromCLI, fetchOpenCodeAgents, checkOpenCodeStatus, envWithProxy } from "./opencode-config";
export { getVaultBasePath } from "./server";

function parseDiffText(text: string): FileDiff[] {
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

export async function callAIWithHTTPStreaming(
  prompt: string,
  settings: XiaoyuanAISettings,
  vaultDir: string,
  signal?: AbortSignal,
  onConnected?: () => void,
  onThinking?: (text: string) => void,
  onTextUpdate?: (text: string, thinkingText?: string) => void,
  onDiffs?: (diffs: FileDiff[]) => void,
  onToolProgress?: (tool: string, status: string) => void,
): Promise<string> {
  let conn = readServerConn(vaultDir, settings.opencode.port || 16226);
  if (conn) {
    try { await requestOpenCode(conn.url, "/global/health", "GET", undefined, conn.authHeader); }
    catch { conn = null; }
  }
  if (!conn) {
    const base = await ensureOpenCodeServer(
      settings.opencode.cliPath, settings.opencode.hostname,
      settings.opencode.port, vaultDir, true,
    );
    conn = { url: base, authHeader: readServerConn(vaultDir, settings.opencode.port || 16226)?.authHeader || "" };
  }
  onConnected?.();

  const session = await requestOpenCode<{ id: string }>(conn.url, "/session", "POST", {}, conn.authHeader);
  const sessionId = session.id;
  if (!sessionId) throw new Error("创建会话失败");

  try {
    const payload: any = { parts: [{ type: "text", text: prompt }] };
    if (settings.opencode.agent) payload.agent = settings.opencode.agent;
    if (settings.defaultReasoning) payload.variant = settings.defaultReasoning;
    if (settings.opencode.model) {
      const parts = settings.opencode.model.split("/");
      if (parts.length >= 2) {
        payload.model = { providerID: parts[0], modelID: parts.slice(1).join("/") };
      }
    }
    await requestOpenCode(conn.url, `/session/${sessionId}/prompt_async`, "POST", payload, conn.authHeader);

    let accumulatedText = "";
    let accumulatedThinking = "";
    const sseAbort = new AbortController();
    const combinedSig = combineSignals(signal, sseAbort.signal);

    const partTypes = new Map<string, string>();
    const partTexts = new Map<string, string>();
    let idleResolve: (() => void) | null = null;
    let idleReject: ((err: Error) => void) | null = null;
    const idlePromise = new Promise<void>((resolve, reject) => {
      idleResolve = resolve;
      idleReject = reject;
    });
    let sseFailed = false;
    connectSSE(
      conn.url, conn.authHeader, sessionId, combinedSig,
      (evt) => {
        const props = evt.properties || {};
        if (props.sessionID !== sessionId) return;
        if (evt.type === "message.part.updated") {
          const part = props.part || {};
          const partId = part.id;
          if (partId) partTypes.set(partId, part.type || "");
          if (part.type === "text") {
            accumulatedText = part.text || "";
            partTexts.set(partId, accumulatedText);
            onTextUpdate?.(accumulatedText, accumulatedThinking);
          } else if (part.type === "thinking" || part.type === "reasoning") {
            accumulatedThinking = part.text || "";
            partTexts.set(partId, accumulatedThinking);
            onThinking?.(accumulatedThinking);
          } else if (part.type === "tool") {
            const toolName = part.tool || part.name || "";
            const st = part.state?.status || "running";
            if (toolName) onToolProgress?.(toolName, st);
          } else if (part.type === "diff" || part.type === "patch") {
            const diffText = part.text ?? part.diff ?? "";
            if (diffText) {
              const diffs = parseDiffText(diffText);
              if (diffs.length) onDiffs?.(diffs);
            }
          }
        } else if (evt.type === "message.part.delta") {
          const partId = props.partID;
          const pType = partTypes.get(partId);
          if (props.field === "text" && props.delta) {
            const prev = partTexts.get(partId) || "";
            const updated = prev + props.delta;
            partTexts.set(partId, updated);
            if (pType === "text") {
              accumulatedText = updated;
              onTextUpdate?.(accumulatedText, accumulatedThinking);
            } else if (pType === "thinking" || pType === "reasoning") {
              accumulatedThinking = updated;
              onThinking?.(accumulatedThinking);
            }
          }
        } else if (evt.type === "session.status") {
          if (props.status?.type === "idle") {
            sseAbort.abort();
            idleResolve?.();
          }
        }
      },
      () => { idleResolve?.(); },
      () => {
        sseFailed = true;
        idleReject?.(new Error("SSE 连接中断"));
      },
    );

    const timeoutMs = 120000;
    const timeoutErr = await Promise.race([
      idlePromise.then(() => null),
      new Promise<Error>((_, reject) =>
        setTimeout(() => reject(new Error("等待回复超时")), timeoutMs),
      ),
    ]);
    if (timeoutErr) throw timeoutErr;
    if (signal?.aborted) throw new DOMException("已中断", "AbortError");
    if (sseFailed) throw new Error("SSE 连接中断");

    sseAbort.abort();

    const messages = await requestOpenCode<any[]>(conn.url, `/session/${sessionId}/message?limit=50`, "GET", undefined, conn.authHeader);
    const lastAssistant = [...(messages || [])].reverse().find((m: any) => m.info?.role === "assistant");
    const result = lastAssistant?.parts?.find((p: any) => p.type === "text")?.text ?? "";
    if (result) {
      onTextUpdate?.(result, accumulatedThinking);
      return result;
    }
    throw new Error("未找到 assistant 回复");
  } finally {
    try { await requestOpenCode(conn.url, `/session/${sessionId}`, "DELETE", undefined, conn.authHeader); } catch {}
  }
}

export function estimateTokens(text: string): number {
  let tokens = 0;
  for (const ch of text) {
    tokens += ch.charCodeAt(0) > 127 ? 1.5 : 0.25;
  }
  return Math.ceil(tokens);
}

export interface CallAISessionOptions {
  prompt: string;
  settings: XiaoyuanAISettings;
  vaultDir: string;
  signal?: AbortSignal;
  onThinking?: (text: string) => void;
  onTextUpdate?: (text: string) => void;
}

export async function callAISession(options: CallAISessionOptions): Promise<string> {
  const { prompt, settings, vaultDir, signal, onThinking, onTextUpdate } = options;
  if (settings.execMode === "cli") {
    return callAIWithHTTPStreaming(prompt, settings, vaultDir, signal, undefined, onThinking, onTextUpdate);
  }
  const provider = getActiveProvider(settings);
  if (!provider || !provider.apiKey) throw new Error("API Key 未配置");
  const resp = await callAIWithAPI(
    ensureApiUrl(provider.baseUrl), provider.apiKey, provider.model,
    [{ role: "system", content: settings.systemPrompt }, { role: "user", content: prompt }],
    settings.maxTokens, settings.temperature, true, signal, settings.apiReasoningEffort,
  );
  return processAPISSEStream(resp, onThinking, onTextUpdate);
}

// ─── MCP server sync ────────────────────────────────────────────────

let mcpSyncDone = false;

export function resetMCPSyncDone(): void {
  mcpSyncDone = false;
}

export async function syncMCPServers(
  settings: XiaoyuanAISettings,
  vaultDir: string,
): Promise<void> {
  if (mcpSyncDone) return;

  const servers = settings.mcpServers?.filter(s => s.enabled) || [];
  if (servers.length === 0) return;

  let conn = readServerConn(vaultDir, settings.opencode.port || 16226);
  if (conn) {
    try { await requestOpenCode(conn.url, "/global/health", "GET", undefined, conn.authHeader); }
    catch { conn = null; }
  }
  if (!conn) {
    try {
      const base = await ensureOpenCodeServer(
        settings.opencode.cliPath, settings.opencode.hostname,
        settings.opencode.port, vaultDir, true,
      );
      conn = { url: base, authHeader: readServerConn(vaultDir, settings.opencode.port || 16226)?.authHeader || "" };
    } catch {
      return;
    }
  }

  for (const server of servers) {
    try {
      const config: Record<string, any> = { type: server.type };
      if (server.type === "local") {
        if (server.command) config.command = server.command;
        if (server.args) config.args = server.args.split(/\s+/).filter(Boolean);
      } else {
        if (server.url) config.url = server.url;
        if (server.headers) {
          try { config.headers = JSON.parse(server.headers); } catch { config.headers = {}; }
        }
      }
      await requestOpenCode(conn!.url, "/mcp", "POST", { name: server.name, config }, conn!.authHeader);
    } catch (err) {
      console.warn(`MCP server "${server.name}" sync failed:`, err);
    }
  }
  mcpSyncDone = true;
}

export { readServerConn };