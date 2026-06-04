import * as http from "http";
import * as path from "path";
import * as fs from "fs";

type ServerConn = { url: string; authHeader: string };

type SSEEvent = { type: string; properties?: any };

export function readServerConn(vaultDir: string, configuredPort: number): ServerConn | null {
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

export function httpGetOpenCode(baseUrl: string, path: string, directory: string): Promise<any> {
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

export function requestOpenCode<T>(
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
  for (const s of sigs) {
    if (!s) continue;
    if (s.aborted) { ctrl.abort(s.reason); return ctrl.signal; }
    s.addEventListener("abort", () => ctrl.abort(s.reason), { once: true });
  }
  return ctrl.signal;
}