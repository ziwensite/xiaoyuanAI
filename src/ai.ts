import { getActiveProvider } from "./constants";
import type { XiaoyuanAISettings, FileDiff, SSEEventPart } from "./types";
import { ensureApiUrl, parseDiffText } from "./utils";
import { requestOpenCode, readServerConn, connectSSE, combineSignals } from "./opencode-client";
import { ensureOpenCodeServer } from "./opencode-server";
import { callAIWithAPI, processAPISSEStream } from "./api-client";

export { stopOpenCodeServer, ensureOpenCodeServer } from "./opencode-server";
export { fetchOpenCodeModelsFromCLI, fetchOpenCodeAgents, checkOpenCodeStatus } from "./opencode-config";
export { getVaultBasePath } from "./server";

interface SessionMessage {
  info?: { role: string };
  parts?: { type: string; text?: string }[];
}

interface SessionPayload {
  parts: { type: string; text: string }[];
  agent?: string;
  variant?: string;
  model?: { providerID: string; modelID: string };
  [key: string]: unknown;
}

type PartCallback = () => void;

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
    const payload: SessionPayload = { parts: [{ type: "text", text: prompt }] };
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
    let idleResolve: PartCallback | null = null;
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
          const part: SSEEventPart = props.part || {};
          const partId = part.id;
          if (partId) {
            partTypes.set(partId, part.type || "");
            if (part.type === "text") {
              accumulatedText = part.text || "";
              partTexts.set(partId, accumulatedText);
              onTextUpdate?.(accumulatedText, accumulatedThinking);
            } else if (part.type === "thinking" || part.type === "reasoning") {
              accumulatedThinking = part.text || "";
              partTexts.set(partId, accumulatedThinking);
              onThinking?.(accumulatedThinking);
            }
          }
          if (part.type === "tool") {
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
          if (!partId) return;
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
            const resolve = idleResolve;
            idleResolve = null;
            idleReject = null;
            resolve?.();
          }
        }
      },
      () => {
        const resolve = idleResolve;
        idleResolve = null;
        idleReject = null;
        resolve?.();
      },
      () => {
        sseFailed = true;
        const reject = idleReject;
        idleResolve = null;
        idleReject = null;
        reject?.(new Error("SSE 连接中断"));
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

    const messages = await requestOpenCode<SessionMessage[]>(conn.url, `/session/${sessionId}/message?limit=50`, "GET", undefined, conn.authHeader);
    const lastAssistant = [...(messages || [])].reverse().find((m) => m.info?.role === "assistant");
    const result = lastAssistant?.parts?.find((p) => p.type === "text")?.text ?? "";
    if (result) {
      onTextUpdate?.(result, accumulatedThinking);
      return result;
    }
    throw new Error("未找到 assistant 回复");
  } finally {
    try { await requestOpenCode(conn.url, `/session/${sessionId}`, "DELETE", undefined, conn.authHeader); } catch {}
  }
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