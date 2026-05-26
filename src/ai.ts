import { spawn, execSync, type ChildProcess } from "child_process";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { getVaultBasePath } from "./server";
import type { XiaoyuanAISettings, Attachment, FileDiff, ModelEntry, ModelCaps } from "./types";

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

let currentCLISessionID = "";

export function getCLISessionID(): string { return currentCLISessionID; }
export function clearCLISessionID() { currentCLISessionID = ""; }

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
        timer = setTimeout(() => { try { proc.kill(); } catch {} reject(new Error("超时")); }, timeoutMs);
      }

      proc.stdout.on("data", (d: Buffer) => stdout += d.toString());
      proc.stderr.on("data", (d: Buffer) => stderr += d.toString());
      proc.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0 && stdout) resolve(stdout);
        else reject(new Error(stderr.trim() || `exit ${code}`));
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
      return { ok: false, version: out.trim(), bin: effectiveBin, error: "opencode serve 未运行" };
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
  bin: string, vaultDir: string, port: number,
): Promise<{ url: string; proc: ChildProcess }> {
  const args = ["serve", `--hostname=127.0.0.1`, `--port=${port}`];
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
    try {
      execSync("taskkill /f /im opencode.exe", { timeout: 3000, windowsHide: true });
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

export async function callAIWithCLI(
  prompt: string,
  settings: XiaoyuanAISettings,
  vaultDir: string,
  attachments?: Attachment[],
  signal?: AbortSignal,
  onConnected?: () => void,
  onThinking?: (text: string) => void,
  onTextUpdate?: (text: string) => void,
  onDiffs?: (diffs: FileDiff[]) => void,
  onToolProgress?: (tool: string, status: string) => void,
): Promise<string> {
  const effectiveBin = await resolveOpenCodePath(settings.opencode.cliPath);
  const args: string[] = ["run", "--format", "json", "--thinking"];

  if (settings.defaultReasoning) args.push("--variant", settings.defaultReasoning);
  const agent = settings.opencode.agent;
  if (agent) args.push("--agent", agent);
  if (settings.defaultPermission === "danger-full-access") args.push("--dangerously-skip-permissions");
  if (settings.opencode.model) args.push("--model", settings.opencode.model);
  if (settings.mcpEnabled) args.push("--mcp");

  return new Promise<string>((resolve, reject) => {
    let connected = false;
    let stdoutBuf = "";
    let stderrBuf = "";
    let fullText = "";
    let resolved = false;
    let proc: any;

    try {
      const spec = buildSpawn(effectiveBin, args);
      proc = spawn(spec.command, spec.args, {
        cwd: vaultDir,
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env, ...envWithProxy(settings), OPENCODE_CALLER: "obsidian" },
      });
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
      return;
    }

    proc.stdin.write(prompt);
    proc.stdin.end();

    const done = (err?: Error) => {
      if (resolved) return;
      resolved = true;
      if (err) reject(err);
      else resolve(fullText || "(无响应内容)");
    };

    const parseEvent = (raw: string) => {
      let event: any;
      try { event = JSON.parse(raw); } catch { return; }
      if (!connected) { connected = true; if (onConnected) onConnected(); }
      if (event.sessionID && !currentCLISessionID) currentCLISessionID = event.sessionID;
      if (event.type === "error") {
        const errMsg = event.error?.data?.message || event.error?.message || "CLI 错误";
        done(new Error(errMsg)); return;
      }
      if (event.type === "thinking") {
        const t = event.part?.text ?? event.text ?? event.content ?? "";
        if (t && onThinking) onThinking(t); return;
      }
      if (event.type === "text") {
        const t = event.part?.text ?? event.text ?? event.content ?? "";
        if (t) { fullText = t; if (onTextUpdate) onTextUpdate(t); } return;
      }
      if (event.type === "tool_use") {
        const tool = event.part?.tool || (event.tool as string) || "";
        const status = event.part?.state?.status || "running";
        if (tool && onToolProgress) onToolProgress(tool, status); return;
      }
      if (event.type === "files" && event.files) {
        const diffs: FileDiff[] = (Array.isArray(event.files) ? event.files : []).map((f: any) => ({
          file: typeof f === "string" ? f : f.path || f.file || "",
          before: f.before || "", after: f.after || "", diff: f.diff || "",
        })).filter((d: FileDiff) => d.file);
        if (diffs.length && onDiffs) onDiffs(diffs);
      }
    };

    proc.stdout.on("data", (chunk: Buffer) => {
      stdoutBuf += chunk.toString();
      const lines = stdoutBuf.split("\n");
      stdoutBuf = lines.pop() || "";
      for (const line of lines) {
        const trimmed = stripAnsi(line).trim();
        if (trimmed) parseEvent(trimmed);
      }
    });

    proc.stderr.on("data", (chunk: Buffer) => { stderrBuf += stripAnsi(chunk.toString()); });
    proc.on("error", (err: Error) => done(err));
    proc.on("close", (code: number | null) => {
      if (resolved) return;
      if (code !== 0) done(new Error(stderrBuf.trim() || `进程退出码 ${code}`));
      else if (!connected) done(new Error("未收到数据，请检查 opencode 路径和模型配置"));
      else resolve(fullText || "(无响应内容)");
    });

    if (signal) {
      signal.addEventListener("abort", () => {
        try { proc.kill(); } catch {}
        clearCLISessionID();
        done(new DOMException("已中断", "AbortError"));
      }, { once: true });
    }
  });
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

// ─── Auto-start opencode serve ──────────────────────────────────────

let autoStartedProc: ChildProcess | null = null;

export function isServerAutoStarted(): boolean {
  return autoStartedProc !== null && autoStartedProc.exitCode === null;
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
  const temp = await startTempOpenCodeServer(effectiveBin, vaultDir, port);
  autoStartedProc = temp.proc;
  return temp.url;
}

export function stopOpenCodeServer(): void {
  if (autoStartedProc) {
    stopTempServer(autoStartedProc);
    autoStartedProc = null;
  }
}

export { getVaultBasePath };
