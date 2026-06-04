import { getVaultBasePath } from "./server";
import { checkOpenCodeStatus } from "./opencode-config";
import { ensureOpenCodeServer } from "./opencode-server";
import { getActiveProvider } from "./constants";
import type { XiaoyuanAISettings } from "./types";

export async function checkConnection(settings: XiaoyuanAISettings, vaultDir: string): Promise<boolean> {
  if (settings.execMode === "cli") {
    let ok = false;
    const status = await checkOpenCodeStatus(settings.opencode.cliPath, vaultDir, settings.opencode.port, settings.opencode.hostname);
    if (status.ok) {
      ok = true;
    } else if (settings.opencode.autoStart) {
      try {
        await ensureOpenCodeServer(settings.opencode.cliPath, settings.opencode.hostname, settings.opencode.port, vaultDir, true);
        ok = true;
      } catch {}
    }
    return ok;
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