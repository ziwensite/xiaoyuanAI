import { ensureOpenCodeServer } from "./opencode-server";
import { getActiveProvider } from "./constants";
import type { XiaoyuanAISettings } from "./types";
import { readServerConn, healthCheck } from "./opencode-client";

export async function getCLIConnections(settings: XiaoyuanAISettings, vaultDir: string): Promise<string[]> {
  const active: string[] = [];

  const lockConn = readServerConn(vaultDir, settings.opencode.port);
  if (lockConn) {
    if (await healthCheck(lockConn.url, vaultDir)) {
      active.push(lockConn.url.replace(/\/$/, ""));
    }
  }

  const configUrl = `http://${settings.opencode.hostname || "127.0.0.1"}:${settings.opencode.port || 16226}`;
  if (!active.some((u) => u === configUrl) && await healthCheck(configUrl, vaultDir)) {
    active.push(configUrl);
  }

  return active;
}

export async function checkConnection(settings: XiaoyuanAISettings, vaultDir: string, mode: "cli" | "api" = "cli"): Promise<boolean> {
  if (mode === "cli") {
    const urls = await getCLIConnections(settings, vaultDir);
    if (urls.length > 0) return true;
    if (settings.opencode.autoStart) {
      try {
        await ensureOpenCodeServer(settings.opencode.cliPath, settings.opencode.hostname, settings.opencode.port, vaultDir, true);
        return true;
      } catch {}
    }
    return false;
  }

  const provider = getActiveProvider(settings);
  if (!provider || !provider.baseUrl || !provider.apiKey) return false;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const modelsUrl = provider.baseUrl.replace(/\/+$/, "") + "/models";
    const resp = await fetch(modelsUrl, {
      headers: { Authorization: `Bearer ${provider.apiKey}` },
      signal: controller.signal,
    });
    clearTimeout(timer);
    return resp.ok;
  } catch {
    return false;
  }
}