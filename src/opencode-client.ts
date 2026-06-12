import * as http from "http";
import * as path from "path";
import * as fs from "fs";
import type { SSEEventPart } from "./types";
import { tryParseJson } from "./utils";

interface ServerConn { url: string; authHeader: string }

interface SSEEventProperties {
  sessionID?: string;
  partID?: string;
  field?: string;
  delta?: string;
  part?: SSEEventPart;
  status?: { type: string };
}

interface SSEEvent { type: string; properties?: SSEEventProperties }

export function readServerConn(vaultDir: string, _configuredPort: number): ServerConn | null {
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

export function httpGetOpenCode(baseUrl: string, path: string, directory: string): Promise<unknown> {
  const url = new URL(path, baseUrl.replace(/\/+$/, ""));
  url.searchParams.set("directory", directory);
  return new Promise((resolve, reject) => {
    http.get(url.toString(), (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString();
        if (!res.statusCode || res.statusCode >= 300) {
          reject(new Error(`OpenCode API ${path}: ${res.statusCode} ${res.statusCode ? (http.STATUS_CODES[res.statusCode] || "") : ""}${body ? ` - ${body.slice(0, 200)}` : ""}`));
          return;
        }
        let parsed: unknown;
        try { parsed = JSON.parse(body); }
        catch (err: unknown) { reject(new Error(`OpenCode API ${path}: JSON 解析失败 — ${err instanceof Error ? err.message : String(err)}`)); return; }
        if (parsed && typeof parsed === "object" && "error" in parsed && parsed.error) {
          const errObj = (parsed as Record<string, unknown>).error;
          const errMap = errObj as Record<string, unknown>;
          const errMsg = (errMap.message as string) || ((errMap.data as Record<string, unknown>)?.message as string) || JSON.stringify(errObj);
          reject(new Error(`OpenCode API 错误: ${errMsg}`));
          return;
        }
        if (parsed && typeof parsed === "object" && "data" in parsed) {
          resolve((parsed as Record<string, unknown>).data);
        } else {
          resolve(parsed);
        }
      });
    }).on("error", reject);
  });
}

export async function healthCheck(baseUrl: string, vaultDir: string): Promise<boolean> {
  try {
    await httpGetOpenCode(baseUrl, "/global/health", vaultDir);
    return true;
  } catch {
    return false;
  }
}

export function requestOpenCode<T>(
  base: string, apiPath: string, method: string, body?: Record<string, unknown> | undefined, authHeader?: string,
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
        try {
          const parsed = tryParseJson<T>(raw);
          if (parsed === null) throw new Error("Invalid JSON response");
          resolve(parsed);
        } catch (err: unknown) { reject(new Error(`OpenCode ${method} ${apiPath}: JSON parse error — ${err instanceof Error ? err.message : String(err)}`)); }
      });
    });
    req.on("error", reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error(`OpenCode ${method} ${apiPath}: timeout`)); });
    if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });
}

export function connectSSE(
  base: string, authHeader: string, sessionId: string, signal: AbortSignal,
  onEvent: (evt: SSEEvent) => void,
  onDone?: () => void,
  onError?: (err: Error) => void,
): void {
  const handleDone = onDone || (() => {});
  const handleError = onError || (() => {});
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
    res.on("end", handleDone);
    res.on("error", (err) => handleError(err instanceof Error ? err : new Error(String(err))));
  });
  req.on("error", (err) => handleError(err instanceof Error ? err : new Error(String(err))));
  req.setTimeout(15000, () => { const err = new Error("SSE 连接超时"); req.destroy(); handleError(err); });
  signal.addEventListener("abort", () => req.destroy(), { once: true });
  req.end();
}

export function combineSignals(...sigs: (AbortSignal | undefined)[]): AbortSignal {
  const ctrl = new AbortController();
  const cleanup: (() => void)[] = [];
  for (const s of sigs) {
    if (!s) continue;
    if (s.aborted) { ctrl.abort(s.reason); return ctrl.signal; }
    const handler = () => { ctrl.abort(s.reason); };
    s.addEventListener("abort", handler, { once: true });
    cleanup.push(() => s.removeEventListener("abort", handler));
  }
  const origAbort = ctrl.abort.bind(ctrl);
  ctrl.abort = (reason?: unknown) => {
    for (const c of cleanup) c();
    origAbort(reason);
  };
  return ctrl.signal;
}