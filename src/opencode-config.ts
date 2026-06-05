import * as fs from "fs";
import * as path from "path";
import type { ModelEntry, ModelCaps } from "./types";
import { httpGetOpenCode } from "./opencode-client";
import { resolveOpenCodePath, spawnWithTimeout, startTempOpenCodeServer, stopTempServer } from "./opencode-server";

interface OpenCodeModelDef {
  id: string;
  name: string;
  enabled?: boolean;
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

interface RawModelEntry {
  id?: string;
  name?: string;
  enabled?: boolean;
  capabilities?: OpenCodeModelDef["capabilities"];
}

interface AgentEntry {
  mode?: string;
  hidden?: boolean;
  name: string;
  description?: string;
}

function flattenProviders(providers: OpenCodeProvider[]): FlattenResult {
  const result = new Map<string, ModelEntry>();
  const caps: Record<string, ModelCaps> = {};
  for (const p of providers) {
    if (p.configured === false) continue;
    const providerName = p.name || p.id;
    const rawModels = p.models || {};
    const entries: RawModelEntry[] = Array.isArray(rawModels)
      ? Object.values(rawModels).map((m) => ({ id: m.id || m.name || "", name: m.name || m.id || "", enabled: m.enabled, capabilities: m.capabilities }))
      : Object.values(rawModels).map((m) => ({ id: (m as OpenCodeModelDef).id || (m as OpenCodeModelDef).name || "", name: (m as OpenCodeModelDef).name || (m as OpenCodeModelDef).id || "", enabled: (m as OpenCodeModelDef).enabled, capabilities: (m as OpenCodeModelDef).capabilities }));
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
    const data = response as { providers?: OpenCodeProvider[] } | OpenCodeProvider[];
    const providers: OpenCodeProvider[] = Array.isArray(data) ? data : (data?.providers ?? []);
    const r = flattenProviders(providers);
    return { models: r.models, caps: r.caps, defaultModel: "" };
  } catch {}

  const tempPort = configuredPort === 16226 ? 16227 : configuredPort + 1;
  try {
    temp = await startTempOpenCodeServer(bin, vaultDir, tempPort);
    if (!temp) throw new Error("启动临时服务器失败");
    const response = await httpGetOpenCode(temp.url, "/config/providers", vaultDir);
    const data = response as { providers?: OpenCodeProvider[] } | OpenCodeProvider[];
    const providers: OpenCodeProvider[] = Array.isArray(data) ? data : (data?.providers ?? []);
    const r = flattenProviders(providers);
    return { models: r.models, caps: r.caps, defaultModel: "" };
  } finally {
    if (temp) stopTempServer(temp.proc);
  }
}

function findOpenCodeConfigFiles(vaultDir: string): Record<string, unknown>[] {
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
  const results: Record<string, unknown>[] = [];
  for (const p of candidates) {
    if (seen.has(p)) continue;
    seen.add(p);
    try {
      const content = fs.readFileSync(p, "utf-8");
      results.push(JSON.parse(content) as Record<string, unknown>);
    } catch {}
  }
  return results;
}

interface ProviderConfig {
  name?: string;
  models?: Record<string, unknown> | unknown[];
}

function extractModelsFromConfig(parsed: Record<string, unknown>): ModelEntry[] {
  const result = new Map<string, ModelEntry>();
  const providers = (parsed?.providers ?? parsed?.profiles ?? {}) as Record<string, unknown>;
  for (const [providerId, cfg] of Object.entries(providers)) {
    const pc = cfg as ProviderConfig;
    const providerName = pc.name || providerId;
    const rawModels = pc.models ?? {};
    const entries: RawModelEntry[] = Array.isArray(rawModels)
      ? rawModels.map((m) => {
          const mm = m as Record<string, unknown>;
          return { id: (mm.id as string) || (mm.name as string) || "", name: (mm.name as string) || (mm.id as string) || "" };
        })
      : Object.values(rawModels).map((m) => {
          const mm = m as Record<string, unknown>;
          return { id: (mm.id as string) || (mm.name as string) || "", name: (mm.name as string) || (mm.id as string) || "" };
        });
    for (const m of entries) {
      if (!m.id) continue;
      const modelId = m.id.includes("/") ? m.id : `${providerId}/${m.id}`;
      if (!result.has(modelId)) result.set(modelId, { id: modelId, displayName: `${providerName} · ${m.name || m.id}` });
    }
  }
  if (result.size === 0 && Array.isArray(parsed?.models)) {
    for (const m of parsed.models as Array<string | Record<string, string>>) {
      const rawId = typeof m === "string" ? m : ((m as Record<string, string>).id || (m as Record<string, string>).name || "");
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
    const agents = (await httpGetOpenCode(url, "/agent", vaultDir)) as AgentEntry[];
    if (Array.isArray(agents)) return filterAgents(agents);
  } catch {}
  try {
    const effectiveBin = await resolveOpenCodePath(opencodePath);
    const temp = await startTempOpenCodeServer(effectiveBin, vaultDir, port);
    try {
      const agents = (await httpGetOpenCode(temp.url, "/agent", vaultDir)) as AgentEntry[];
      if (Array.isArray(agents)) return filterAgents(agents);
    } finally {
      stopTempServer(temp.proc);
    }
  } catch {}
  return [];
}

function filterAgents(agents: AgentEntry[]): { name: string; description?: string }[] {
  return agents
    .filter((a) => a.mode === "primary" && !a.hidden)
    .map((a) => ({ name: a.name, description: a.description }));
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