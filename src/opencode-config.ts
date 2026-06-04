import * as fs from "fs";
import * as path from "path";
import type { XiaoyuanAISettings, ModelEntry, ModelCaps } from "./types";
import { httpGetOpenCode } from "./opencode-client";
import { resolveOpenCodePath, ensureOpenCodeServer, spawnWithTimeout, startTempOpenCodeServer, stopTempServer } from "./opencode-server";

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

async function fetchModelsViaServer(
  bin: string, vaultDir: string, configuredPort: number,
): Promise<{ models: ModelEntry[]; caps: Record<string, ModelCaps>; defaultModel: string }> {
  const serverUrl = `http://127.0.0.1:${configuredPort}`;
  let temp: { url: string; proc: import("child_process").ChildProcess } | null = null;

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
    if (!temp) throw new Error("启动临时服务器失败");
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

  if (modelMap.size === 0) {
    for (const cfg of findOpenCodeConfigFiles(vaultDir)) {
      for (const m of extractModelsFromConfig(cfg)) {
        if (!modelMap.has(m.id)) modelMap.set(m.id, m);
      }
    }
  }

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
  } catch (err: unknown) {
    return { ok: false, version: "", bin: opencodePath, error: err instanceof Error ? err.message : String(err) };
  }
}

export { resolveOpenCodePath, spawnWithTimeout, startTempOpenCodeServer, stopTempServer };