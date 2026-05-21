import { requestUrl } from "obsidian";
import type { XiaoyuanAISettings } from "./types";

let serverProcess: any = null;
let serverStartPromise: Promise<void> | null = null;
const EXTERNAL_SERVER = {};

export function getVaultBasePath(vault: any): string {
  return vault.adapter.getBasePath();
}

async function probeServer(port: number): Promise<boolean> {
  try {
    const resp = await requestUrl({
      url: `http://localhost:${port}/config/providers`,
      method: "GET",
      throw: false,
    });
    return resp.status >= 200 && resp.status < 500;
  } catch {
    return false;
  }
}

function startOpenCodeServer(
  opencodePath: string,
  port: number,
  password: string,
  vaultDir: string,
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const alive = await probeServer(port);
    if (alive) {
      serverProcess = EXTERNAL_SERVER;
      serverStartPromise = Promise.resolve();
      resolve();
      return;
    }

    try {
      const cp = require("child_process");
      const proc = cp.spawn("cmd.exe", ["/c", opencodePath, "serve", "--port", String(port)], {
        cwd: vaultDir,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, OPENCODE_SERVER_PASSWORD: password },
      });

      serverProcess = proc;

      let started = false;
      const onData = (chunk: Buffer) => {
        const text = chunk.toString();
        if (!started && text.includes("listening")) {
          started = true;
          resolve();
        }
      };
      proc.stdout.on("data", onData);
      proc.stderr.on("data", onData);

      proc.on("error", (err: Error) => {
        reject(err);
      });
      proc.on("close", (code: number) => {
        if (serverProcess === proc) serverProcess = null;
        if (!started) {
          serverStartPromise = null;
          reject(new Error(`opencode serve 异常退出（${code}）`));
        }
      });

      setTimeout(() => {
        if (!started) {
          started = true;
          resolve();
        }
      }, 15000);
    } catch (err: unknown) {
      reject(err);
    }
  });
}

function stopOpenCodeServer(): Promise<void> {
  if (!serverProcess || serverProcess === EXTERNAL_SERVER) {
    serverProcess = null;
    serverStartPromise = null;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const proc = serverProcess;
    let resolved = false;
    const done = () => {
      if (!resolved) {
        resolved = true;
        serverProcess = null;
        serverStartPromise = null;
        resolve();
      }
    };

    proc.on("close", done);
    proc.on("error", done);

    try {
      proc.kill("SIGTERM");
    } catch {}

    setTimeout(done, 3000);
  });
}

export async function ensureServer(s: XiaoyuanAISettings, vaultDir: string): Promise<void> {
  if (serverProcess) return;
  if (serverStartPromise) {
    try { await serverStartPromise; return; }
    catch { serverStartPromise = null; }
  }

  const pw = s.serverPassword || "xiaoyuan-plugin-" + Math.random().toString(36).slice(2, 10);
  if (!s.serverPassword) s.serverPassword = pw;

  const alive = await probeServer(s.serverPort);
  if (alive) {
    serverProcess = EXTERNAL_SERVER;
    return;
  }

  serverStartPromise = startOpenCodeServer(s.opencodePath, s.serverPort, pw, vaultDir).catch((err) => {
    serverStartPromise = null;
    throw err;
  });
  await serverStartPromise;
}

export async function stopServer(): Promise<void> {
  await stopOpenCodeServer();
}
