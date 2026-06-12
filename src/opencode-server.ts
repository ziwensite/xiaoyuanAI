import { spawn, execSync, type ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { healthCheck } from "./opencode-client";

const OPENCODE_START_TIMEOUT_MS = 15000;

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

export function spawnWithTimeout(bin: string, args: string[], cwd: string, timeoutMs = 8000): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let timer: ReturnType<typeof setTimeout> | undefined;
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
    } catch (err: unknown) {
      clearTimeout(timer);
      reject(err);
    }
  });
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

export async function startTempOpenCodeServer(
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

export function stopTempServer(proc: ChildProcess): void {
  if (proc.exitCode !== null || proc.signalCode !== null) return;
  if (process.platform === "win32" && proc.pid) {
    try {
      execSync(`taskkill /f /t /pid ${proc.pid}`, { timeout: 3000, windowsHide: true });
      return;
    } catch {}
  }
  try { proc.kill("SIGTERM"); } catch {}
}

// Module-level server state (Obsidian plugin is single-threaded, no concurrency concern)
let autoStartedProc: ChildProcess | null = null;
let autoStartedVaultDir = "";
let processCleanupRegistered = false;
let ensureServerPromise: Promise<string> | null = null;

function registerProcessCleanup(): void {
  if (processCleanupRegistered) return;
  processCleanupRegistered = true;
  const cleanup = () => {
    try { autoStartedProc?.kill(); } catch {}
  };
  process.on("exit", cleanup);
  if (process.platform !== "win32") {
    process.on("SIGTERM", cleanup);
    process.on("SIGINT", cleanup);
  }
}

export async function ensureOpenCodeServer(
  cliPath: string,
  hostname: string,
  port: number,
  vaultDir: string,
  autoStart: boolean,
): Promise<string> {
  if (ensureServerPromise) return ensureServerPromise;

  const serverUrl = `http://${hostname || "127.0.0.1"}:${port || 16226}`;

  if (await healthCheck(serverUrl, vaultDir)) return serverUrl;

  if (!autoStart) throw new Error("opencode serve 未运行，且自动启动未开启");

  ensureServerPromise = (async () => {
    if (autoStartedProc && autoStartedProc.exitCode === null) {
      stopTempServer(autoStartedProc);
      autoStartedProc = null;
    }

    const effectiveBin = await resolveOpenCodePath(cliPath);
    const temp = await startTempOpenCodeServer(effectiveBin, vaultDir, port, hostname);
    autoStartedProc = temp.proc;
    autoStartedVaultDir = vaultDir;
    registerProcessCleanup();
    return temp.url;
  })();

  try {
    return await ensureServerPromise;
  } finally {
    ensureServerPromise = null;
  }
}

export function stopOpenCodeServer(): void {
  if (autoStartedProc) {
    stopTempServer(autoStartedProc);
    autoStartedProc = null;
  }
  if (autoStartedVaultDir) {
    const lockPath = path.join(autoStartedVaultDir, ".opencode", "server.lock.json");
    try { fs.unlinkSync(lockPath); } catch {}
    autoStartedVaultDir = "";
  }
}