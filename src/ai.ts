import { spawn, execSync, type ChildProcess } from "child_process";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { getVaultBasePath } from "./server";
import type { XiaoyuanAISettings, FileDiff, ModelEntry, ModelCaps } from "./types";
import { getActiveProvider } from "./types";

const OPENCODE_START_TIMEOUT_MS = 15000;

interface OpenCodeModelDef {
  id: string;
  name: string;
  capabilities?: {
    temperature?: boolean;
    reasoning?: boolean;
    attachment?: boolean;
    toolcall?: boolean;
    input?: { text?: boolean; audio?: boolean; image?: boolean; video?: boolean; pdf?: boolean };
    output?: { text?: boolean; audio?: boolean; image?: boolean; video?: boolean; pdf?: boolean };
  };
}

interface OpenCodeProvider {
  id: string;
  name?: string;
  models: Record<string, OpenCodeModelDef>;
  configured?: boolean;
}

// Single-threaded (Obsidian plugin), no concurrency concern
let currentCLISessionID = "";
let cliCallInProgress = false;

export function getCLISessionID(): string { return currentCLISessionID; }
export function clearCLISessionID() { currentCLISessionID = ""; cliCallInProgress = false; }
export function isCLICallInProgress(): boolean { return cliCallInProgress; }

function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
}

type SpawnSpec = { command: string; args: string[] };

function buildSpawn(bin: string, args: string[]): SpawnSpec {
  if (process.platform !== "win32") return { command: bin, args };
  const ext = path.extname(bin).toLowerCase();
  if (ext === ".cmd" || ext === ".bat") {
    return { command: "cmd.exe", args: ["/c", bin, ...args] };
  }
  if (ext === ".exe") {
    return { command: bin, args };
  }
  return { command: "cmd.exe", args: ["/c", bin, ...args] };
}

export async function resolveOpenCodePath(hint: string): Promise<string> {
  if (hint && hint !== "opencode") return hint;
  try {
    const isWin = process.platform === "win32";
    const out = execSync(isWin ? "where opencode" : "which opencode", { encoding: "utf-8", timeout: 3000, windowsHide: true });
    const first = out.trim().split(/\r?\n/)[0];
    if (first) return first;
  } catch {}
  const commonPaths = [
    path.join(process.env.APPDATA || "", "npm", "opencode.cmd"),
    path.join(process.env.LOCALAPPDATA || "", "opencode", "opencode.exe"),
    "/usr/local/bin/opencode",
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }
  return hint;
}

function spawnWithTimeout(bin: string, args: string[], cwd: string, timeoutMs = 8000): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let timer: any;
    try {
      const spec = buildSpawn(bin, args);
      const proc = spawn(spec.command, spec.args, { cwd, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env } });

      if (timeoutMs > 0) {
        timer = setTimeout(() => { try { proc.kill(); } catch {} reject(new Error(`操作超时 (${timeoutMs}ms)`)); }, timeoutMs);
      }

      proc.stdout.on("data", (d: Buffer) => stdout += d.toString());
      proc.stderr.on("data", (d: Buffer) => stderr += d.toString());
      proc.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0 && stdout) resolve(stdout);
        else reject(new Error(stderr.trim() || `进程异常退出 (${code})`));
      });
      proc.on("error", (err) => { clearTimeout(timer); reject(err); });
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
}

export async function checkOpenCodeStatus(
  opencodePath: string,
  vaultDir: string,
  port = 16226,
  hostname = "127.0.0.1",
): Promise<{ ok: boolean; version: string; bin: string; error?: string }> {
  try {
    const effectiveBin = await resolveOpenCodePath(opencodePath);
    const serverUrl = `http://${hostname}:${port}`;
    try {
      await httpGetOpenCode(serverUrl, "/global/health", vaultDir);
      return { ok: true, version: "", bin: effectiveBin };
    } catch {
      const out = await spawnWithTimeout(effectiveBin, ["--version"], vaultDir, 5000).catch(() => "");
      return { ok: false, version: out.trim(), bin: effectiveBin, error: "opencode serve 未运行\n请执行 opencode serve 启动服务，或开启设置中的「自动启动」" };
    }
  } catch (err: any) {
    return { ok: false, version: "", bin: opencodePath, error: err.message };
  }
}

function httpGetOpenCode(baseUrl: string, path: string, directory: string): Promise<any> {
  const url = new URL(path, baseUrl.replace(/\/+$/, ""));
  url.searchParams.set("directory", directory);
  return new Promise((resolve, reject) => {
    http.get(url.toString(), (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString();
        if (!res.statusCode || res.statusCode >= 300) {
          reject(new Error(`OpenCode API ${path}: ${res.statusCode} ${(res as any).statusMessage || ""}${body ? ` - ${body.slice(0, 200)}` : ""}`));
          return;
        }
        let parsed: any;
        try { parsed = JSON.parse(body); }
        catch (e) { reject(new Error(`OpenCode API ${path}: JSON 解析失败 — ${(e as Error).message}`)); return; }
        if (parsed && typeof parsed === "object" && "error" in parsed && parsed.error) {
          const errMsg = parsed.error?.message || parsed.error?.data?.message || JSON.stringify(parsed.error);
          reject(new Error(`OpenCode API 错误: ${errMsg}`));
          return;
        }
        if (parsed && typeof parsed === "object" && "data" in parsed) {
          resolve(parsed.data);
        } else {
          resolve(parsed);
        }
      });
    }).on("error", reject);
  });
}

interface FlattenResult {
  models: ModelEntry[];
  caps: Record<string, ModelCaps>;
}

function flattenProviders(providers: OpenCodeProvider[]): FlattenResult {
  const result = new Map<string, ModelEntry>();
  const caps: Record<string, ModelCaps> = {};
  for (const p of providers) {
    if (p.configured === false) continue;
    const providerName = p.name || p.id;
    const rawModels = p.models || {};
    const entries = Array.isArray(rawModels)
      ? rawModels.map((m: any) => ({ id: m.id || m.name || "", name: m.name || m.id || "", enabled: m.enabled, capabilities: m.capabilities }))
      : Object.values(rawModels).map((m: any) => ({ id: m.id || m.name || "", name: m.name || m.id || "", enabled: m.enabled, capabilities: m.capabilities }));
    for (const m of entries) {
      if (!m.id) continue;
      if (m.enabled === false) continue;
      const modelId = m.id.includes("/") ? m.id : `${p.id}/${m.id}`;
      const displayName = `${providerName} · ${m.name || m.id}`;
      if (!result.has(modelId)) {
        result.set(modelId, { id: modelId, displayName });
        const c = m.capabilities || {};
        caps[modelId] = {
          text: c.input?.text ?? true,
          image: c.input?.image ?? false,
          pdf: c.input?.pdf ?? false,
          audio: c.input?.audio ?? false,
          video: c.input?.video ?? false,
          reasoning: c.reasoning ?? false,
          toolcall: c.toolcall ?? false,
          attachment: c.attachment ?? false,
          temperature: c.temperature ?? true,
        };
      }
    }
  }
  return {
    models: [...result.values()].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    caps,
  };
}

async function startTempOpenCodeServer(
  bin: string, vaultDir: string, port: number, hostname = "127.0.0.1",
): Promise<{ url: string; proc: ChildProcess }> {
  const args = ["serve", `--hostname=${hostname}`, `--port=${port}`];
  const spec = buildSpawn(bin, args);
  return new Promise((resolve, reject) => {
    const proc = spawn(spec.command, spec.args, {
      cwd: vaultDir,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    });
    let output = "";
    const timer = setTimeout(() => {
      try { proc.kill(); } catch {}
      reject(new Error(`opencode server 启动超时: ${output.trim()}`));
    }, OPENCODE_START_TIMEOUT_MS);
    const finish = (value: { url: string; proc: ChildProcess }) => { clearTimeout(timer); resolve(value); };
    proc.stdout?.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      const match = output.match(/opencode server listening.*\s(on\s+)?(https?:\/\/[^\s]+)/);
      if (match?.[2]) finish({ url: match[2].replace(/\/$/, ""), proc });
    });
    proc.stderr?.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    proc.on("error", (err) => { clearTimeout(timer); reject(err); });
    proc.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`opencode server 已退出: ${code ?? "unknown"}\n${output.trim()}`));
    });
  });
}

function stopTempServer(proc: ChildProcess): void {
  if (proc.exitCode !== null || proc.signalCode !== null) return;
  if (process.platform === "win32" && proc.pid) {
    try {
      execSync(`taskkill /f /t /pid ${proc.pid}`, { timeout: 3000, windowsHide: true });
      return;
    } catch {}
  }
  try { proc.kill("SIGTERM"); } catch {}
}

async function fetchModelsViaServer(
  bin: string, vaultDir: string, configuredPort: number,
): Promise<{ models: ModelEntry[]; caps: Record<string, ModelCaps>; defaultModel: string }> {
  const serverUrl = `http://127.0.0.1:${configuredPort}`;
  let temp: { url: string; proc: ChildProcess } | null = null;

  try {
    await httpGetOpenCode(serverUrl, "/global/health", vaultDir);
    const response = await httpGetOpenCode(serverUrl, "/config/providers", vaultDir);
    const providers: OpenCodeProvider[] = response?.providers ?? response ?? [];
    const r = flattenProviders(providers);
    return { models: r.models, caps: r.caps, defaultModel: "" };
  } catch {}

  const tempPort = configuredPort === 16226 ? 16227 : configuredPort + 1;
  try {
    temp = await startTempOpenCodeServer(bin, vaultDir, tempPort);
    const response = await httpGetOpenCode(temp.url, "/config/providers", vaultDir);
    const providers: OpenCodeProvider[] = response?.providers ?? response ?? [];
    const r = flattenProviders(providers);
    return { models: r.models, caps: r.caps, defaultModel: "" };
  } finally {
    if (temp) stopTempServer(temp.proc);
  }
}

function findOpenCodeConfigFiles(vaultDir: string): any[] {
  const candidates = [
    path.join(vaultDir, ".opencode.json"),
    path.join(vaultDir, ".opencode", "config.json"),
    path.join(process.env.APPDATA || "", "opencode", "config.json"),
    path.join(process.env.USERPROFILE || "", ".opencode.json"),
    path.join(process.env.USERPROFILE || "", ".opencode", "config.json"),
    path.join(process.env.USERPROFILE || "", ".config", "opencode", "config.json"),
    path.join(process.env.LOCALAPPDATA || "", "opencode", "config.json"),
  ];
  const seen = new Set<string>();
  const results: any[] = [];
  for (const p of candidates) {
    if (seen.has(p)) continue;
    seen.add(p);
    try {
      const content = fs.readFileSync(p, "utf-8");
      results.push(JSON.parse(content));
    } catch {}
  }
  return results;
}

function extractModelsFromConfig(parsed: any): ModelEntry[] {
  const result = new Map<string, ModelEntry>();
  const providers = parsed?.providers ?? parsed?.profiles ?? {};
  for (const [providerId, cfg] of Object.entries(providers) as [string, any][]) {
    const providerName = cfg?.name || providerId;
    const rawModels = cfg?.models ?? {};
    const entries = Array.isArray(rawModels)
      ? rawModels.map((m: any) => ({ id: m.id || m.name || m || "", name: m.name || m.id || m || "" }))
      : Object.values(rawModels).map((m: any) => ({ id: m.id || m.name || "", name: m.name || m.id || "" }));
    for (const m of entries) {
      if (!m.id) continue;
      const modelId = m.id.includes("/") ? m.id : `${providerId}/${m.id}`;
      if (!result.has(modelId)) result.set(modelId, { id: modelId, displayName: `${providerName} · ${m.name || m.id}` });
    }
  }
  if (result.size === 0 && Array.isArray(parsed?.models)) {
    for (const m of parsed.models) {
      const rawId = typeof m === "string" ? m : m.id || m.name || "";
      if (rawId && !result.has(rawId)) result.set(rawId, { id: rawId, displayName: rawId });
    }
  }
  return [...result.values()];
}

export async function fetchOpenCodeModelsFromCLI(
  opencodePath: string,
  vaultDir: string,
  port = 16226,
): Promise<{ models: ModelEntry[]; caps: Record<string, ModelCaps>; defaultModel: string }> {
  const modelMap = new Map<string, ModelEntry>();
  let caps: Record<string, ModelCaps> = {};

  // First: try server approach (existing serve or temp)
  if (opencodePath) {
    try {
      const effectiveBin = await resolveOpenCodePath(opencodePath);
      const result = await fetchModelsViaServer(effectiveBin, vaultDir, port);
      for (const m of result.models) modelMap.set(m.id, m);
      caps = result.caps;
    } catch (err) {
      console.warn("Server-based model fetch failed:", err);
    }
  }

  // Second: try reading config files directly
  if (modelMap.size === 0) {
    for (const cfg of findOpenCodeConfigFiles(vaultDir)) {
      for (const m of extractModelsFromConfig(cfg)) {
        if (!modelMap.has(m.id)) modelMap.set(m.id, m);
      }
    }
  }

  // Third: try `opencode config` CLI command
  if (modelMap.size === 0 && opencodePath) {
    try {
      const effectiveBin = await resolveOpenCodePath(opencodePath);
      const out = await spawnWithTimeout(effectiveBin, ["config", "--format", "json"], vaultDir, 8000).catch(() => "");
      if (out) {
        for (const m of extractModelsFromConfig(JSON.parse(out))) {
          if (!modelMap.has(m.id)) modelMap.set(m.id, m);
        }
      }
    } catch {}
  }

  return { models: [...modelMap.values()], caps, defaultModel: "" };
}

export async function fetchOpenCodeAgents(
  opencodePath: string,
  vaultDir: string,
  port = 16226,
): Promise<{ name: string; description?: string }[]> {
  const url = `http://127.0.0.1:${port}`;
  try {
    await httpGetOpenCode(url, "/global/health", vaultDir);
    const agents = await httpGetOpenCode(url, "/agent", vaultDir);
    if (Array.isArray(agents)) return filterAgents(agents);
  } catch {}
  try {
    const effectiveBin = await resolveOpenCodePath(opencodePath);
    const temp = await startTempOpenCodeServer(effectiveBin, vaultDir, port);
    try {
      const agents = await httpGetOpenCode(temp.url, "/agent", vaultDir);
      if (Array.isArray(agents)) return filterAgents(agents);
    } finally {
      stopTempServer(temp.proc);
    }
  } catch {}
  return [];
}

function filterAgents(agents: any[]): { name: string; description?: string }[] {
  return agents
    .filter((a: any) => a.mode === "primary" && !a.hidden)
    .map((a: any) => ({ name: a.name, description: a.description }));
}

export function envWithProxy(settings: XiaoyuanAISettings): Record<string, string | undefined> {
  if (!settings.proxyEnabled || !settings.proxyUrl) return {};
  const url = settings.proxyUrl;
  return { HTTP_PROXY: url, HTTPS_PROXY: url, http_proxy: url, https_proxy: url };
}

// ─── HTTP API for opencode serve ─────────────────────────────────

type ServerConn = { url: string; authHeader: string };

function readServerConn(vaultDir: string, configuredPort: number): ServerConn | null {
  try {
    const lockPath = path.join(vaultDir, ".opencode", "server.lock.json");
    if (fs.existsSync(lockPath)) {
      const lock = JSON.parse(fs.readFileSync(lockPath, "utf-8"));
      const authHeader = lock.password
        ? `Basic ${Buffer.from(`opencode:${lock.password}`).toString("base64")}`
        : "";
      return { url: `http://127.0.0.1:${lock.port}`, authHeader };
    }
  } catch {}
  return null;
}

function requestOpenCode<T>(
  base: string, apiPath: string, method: string, body?: any, authHeader?: string,
): Promise<T> {
  const u = new URL(apiPath, base.replace(/\/+$/, ""));
  return new Promise((resolve, reject) => {
    const opts: http.RequestOptions = {
      hostname: u.hostname,
      port: Number(u.port) || 16226,
      path: u.pathname + u.search,
      method,
      headers: { "Content-Type": "application/json" } as Record<string, string>,
    };
    if (authHeader) (opts.headers as Record<string, string>)["Authorization"] = authHeader;
    const req = http.request(opts, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (ch: Buffer) => chunks.push(ch));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString();
        if (!res.statusCode || res.statusCode >= 300) {
          reject(new Error(`OpenCode ${method} ${apiPath}: ${res.statusCode} ${raw.slice(0, 200)}`));
          return;
        }
        if (res.statusCode === 204) { resolve({} as T); return; }
        try { resolve(JSON.parse(raw) as T); }
        catch (e) { reject(new Error(`OpenCode ${method} ${apiPath}: JSON parse error — ${(e as Error).message}`)); }
      });
    });
    req.on("error", reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error(`OpenCode ${method} ${apiPath}: timeout`)); });
    if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });
}

// ─── SSE streaming for opencode serve ───────────────────────────

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

function combineSignals(...sigs: (AbortSignal | undefined)[]): AbortSignal {
  const ctrl = new AbortController();
  for (const s of sigs) {
    if (!s) continue;
    if (s.aborted) { ctrl.abort(s.reason); return ctrl.signal; }
    s.addEventListener("abort", () => ctrl.abort(s.reason), { once: true });
  }
  return ctrl.signal;
}

type SSEEvent = { type: string; properties?: any };

function connectSSE(
  base: string, authHeader: string, sessionId: string, signal: AbortSignal,
  onEvent: (evt: SSEEvent) => void,
  onDone?: () => void,
): void {
  const noop = onDone || (() => {});
  const u = new URL("/event", base.replace(/\/+$/, ""));
  const opts: http.RequestOptions = {
    hostname: u.hostname,
    port: Number(u.port) || 16226,
    path: u.pathname + u.search,
    method: "GET",
    headers: {} as Record<string, string>,
  };
  if (authHeader) (opts.headers as Record<string, string>)["Authorization"] = authHeader;
  const req = http.request(opts, (res) => {
    const dec = new TextDecoder();
    let buf = "";
    res.on("data", (chunk: Buffer) => {
      if (signal.aborted) { res.destroy(); return; }
      buf += dec.decode(chunk, { stream: true });
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try { onEvent(JSON.parse(payload)); } catch {}
      }
    });
    res.on("end", noop);
    res.on("error", noop);
  });
  req.on("error", noop);
  req.setTimeout(15000, () => { req.destroy(); noop(); });
  signal.addEventListener("abort", () => req.destroy(), { once: true });
  req.end();
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
    let idleDetected = false;
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
            idleDetected = true;
            sseAbort.abort();
          }
        }
      },
    );

    const pollTimeout = 120000;
    const pollStart = Date.now();

    while (!idleDetected && Date.now() - pollStart < pollTimeout) {
      if (signal?.aborted) throw new DOMException("已中断", "AbortError");
      await new Promise(r => setTimeout(r, 1000));
      try {
        const statusMap = await requestOpenCode<Record<string, { type?: string }>>(
          conn.url, "/session/status", "GET", undefined, conn.authHeader,
        );
        if (statusMap?.[sessionId]?.type === "idle") { idleDetected = true; break; }
      } catch {}
    }

    if (!idleDetected) throw new Error("等待回复超时");

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

export async function callAIWithAPI(
  apiEndpoint: string, apiKey: string, model: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  maxTokens: number, temperature: number, stream = false, signal?: AbortSignal,
  reasoningEffort?: string,
): Promise<Response> {
  const body: Record<string, any> = { model, messages, max_tokens: maxTokens, temperature, stream };
  if (reasoningEffort && reasoningEffort !== "none") {
    body.reasoning_effort = reasoningEffort;
  }
  const resp = await fetch(apiEndpoint, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body), signal,
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`API ${resp.status}: ${errText.slice(0, 200)}`);
  }
  return resp;
}

export async function callAIWithAPIJson(
  apiEndpoint: string, apiKey: string, model: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  maxTokens: number, temperature: number,
  reasoningEffort?: string,
): Promise<string> {
  const resp = await callAIWithAPI(apiEndpoint, apiKey, model, messages, maxTokens, temperature, false, undefined, reasoningEffort);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "（无响应）";
}

export function estimateTokens(text: string): number {
  let tokens = 0;
  for (const ch of text) {
    tokens += ch.charCodeAt(0) > 127 ? 1.5 : 0.25;
  }
  return Math.ceil(tokens);
}

function ensureApiUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : trimmed + "/chat/completions";
}

export async function processAPISSEStream(
  resp: Response,
  onThinking?: (text: string) => void,
  onTextUpdate?: (text: string) => void,
): Promise<string> {
  const reader = resp.body?.getReader();
  if (!reader) throw new Error("无法读取响应流");
  const decoder = new TextDecoder("utf-8");
  let fullContent = "";
  let fullThinking = "";

  const read = async (): Promise<string> => {
    const { done, value } = await reader.read();
    if (done) return fullContent || fullThinking || "（无响应）";
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const dataStr = trimmed.slice(5).trim();
      if (dataStr === "[DONE]") continue;
      try {
        const data = JSON.parse(dataStr);
        const delta = data.choices?.[0]?.delta;
        if (delta?.reasoning_content) {
          fullThinking += delta.reasoning_content;
          onThinking?.(fullThinking);
        }
        if (delta?.content) {
          fullContent += delta.content;
          onTextUpdate?.(fullContent);
        }
      } catch {}
    }
    return read();
  };
  return read();
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

// ─── Auto-start opencode serve ──────────────────────────────────────

let autoStartedProc: ChildProcess | null = null;
let processCleanupRegistered = false;

function registerProcessCleanup(): void {
  if (processCleanupRegistered) return;
  processCleanupRegistered = true;
  const cleanup = () => {
    try { autoStartedProc?.kill(); } catch {}
  };
  process.on("exit", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("SIGINT", cleanup);
}

export function isServerAutoStarted(): boolean {
  return autoStartedProc !== null && autoStartedProc?.exitCode === null;
}

export async function ensureOpenCodeServer(
  cliPath: string,
  hostname: string,
  port: number,
  vaultDir: string,
  autoStart: boolean,
): Promise<string> {
  const serverUrl = `http://${hostname || "127.0.0.1"}:${port || 16226}`;

  try {
    await httpGetOpenCode(serverUrl, "/global/health", vaultDir);
    return serverUrl;
  } catch {}

  if (!autoStart) throw new Error("opencode serve 未运行，且自动启动未开启");

  if (autoStartedProc && autoStartedProc.exitCode === null) {
    stopTempServer(autoStartedProc);
    autoStartedProc = null;
  }

  const effectiveBin = await resolveOpenCodePath(cliPath);
  const temp = await startTempOpenCodeServer(effectiveBin, vaultDir, port, hostname);
  autoStartedProc = temp.proc;
  registerProcessCleanup();
  return temp.url;
}

export function stopOpenCodeServer(): void {
  if (autoStartedProc) {
    stopTempServer(autoStartedProc);
    autoStartedProc = null;
  }
}

export { getVaultBasePath };
