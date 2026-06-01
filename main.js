"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/server.ts
var server_exports = {};
__export(server_exports, {
  getVaultBasePath: () => getVaultBasePath
});
function getVaultBasePath(vault) {
  return vault.adapter.getBasePath();
}
var init_server = __esm({
  "src/server.ts"() {
    "use strict";
  }
});

// src/ai.ts
var ai_exports = {};
__export(ai_exports, {
  callAIWithAPI: () => callAIWithAPI,
  callAIWithAPIJson: () => callAIWithAPIJson,
  callAIWithCLI: () => callAIWithCLI,
  checkOpenCodeStatus: () => checkOpenCodeStatus,
  clearCLISessionID: () => clearCLISessionID,
  ensureOpenCodeServer: () => ensureOpenCodeServer,
  envWithProxy: () => envWithProxy,
  estimateTokens: () => estimateTokens,
  fetchOpenCodeAgents: () => fetchOpenCodeAgents,
  fetchOpenCodeModelsFromCLI: () => fetchOpenCodeModelsFromCLI,
  getCLISessionID: () => getCLISessionID,
  getVaultBasePath: () => getVaultBasePath,
  isCLICallInProgress: () => isCLICallInProgress,
  isServerAutoStarted: () => isServerAutoStarted,
  resolveOpenCodePath: () => resolveOpenCodePath,
  stopOpenCodeServer: () => stopOpenCodeServer
});
function getCLISessionID() {
  return currentCLISessionID;
}
function clearCLISessionID() {
  currentCLISessionID = "";
  cliCallInProgress = false;
}
function isCLICallInProgress() {
  return cliCallInProgress;
}
function stripAnsi(str) {
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
}
function buildSpawn(bin, args) {
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
async function resolveOpenCodePath(hint) {
  if (hint && hint !== "opencode") return hint;
  try {
    const isWin = process.platform === "win32";
    const out = (0, import_child_process.execSync)(isWin ? "where opencode" : "which opencode", { encoding: "utf-8", timeout: 3e3, windowsHide: true });
    const first = out.trim().split(/\r?\n/)[0];
    if (first) return first;
  } catch {
  }
  const commonPaths = [
    path.join(process.env.APPDATA || "", "npm", "opencode.cmd"),
    path.join(process.env.LOCALAPPDATA || "", "opencode", "opencode.exe"),
    "/usr/local/bin/opencode"
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }
  return hint;
}
function spawnWithTimeout(bin, args, cwd, timeoutMs = 8e3) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let timer;
    try {
      const spec = buildSpawn(bin, args);
      const proc = (0, import_child_process.spawn)(spec.command, spec.args, { cwd, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env } });
      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          try {
            proc.kill();
          } catch {
          }
          reject(new Error(`\u64CD\u4F5C\u8D85\u65F6 (${timeoutMs}ms)`));
        }, timeoutMs);
      }
      proc.stdout.on("data", (d) => stdout += d.toString());
      proc.stderr.on("data", (d) => stderr += d.toString());
      proc.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0 && stdout) resolve(stdout);
        else reject(new Error(stderr.trim() || `\u8FDB\u7A0B\u5F02\u5E38\u9000\u51FA (${code})`));
      });
      proc.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
}
async function checkOpenCodeStatus(opencodePath, vaultDir, port = 16226, hostname = "127.0.0.1") {
  try {
    const effectiveBin = await resolveOpenCodePath(opencodePath);
    const serverUrl = `http://${hostname}:${port}`;
    try {
      await httpGetOpenCode(serverUrl, "/global/health", vaultDir);
      return { ok: true, version: "", bin: effectiveBin };
    } catch {
      const out = await spawnWithTimeout(effectiveBin, ["--version"], vaultDir, 5e3).catch(() => "");
      return { ok: false, version: out.trim(), bin: effectiveBin, error: "opencode serve \u672A\u8FD0\u884C\n\u8BF7\u6267\u884C opencode serve \u542F\u52A8\u670D\u52A1\uFF0C\u6216\u5F00\u542F\u8BBE\u7F6E\u4E2D\u7684\u300C\u81EA\u52A8\u542F\u52A8\u300D" };
    }
  } catch (err) {
    return { ok: false, version: "", bin: opencodePath, error: err.message };
  }
}
function httpGetOpenCode(baseUrl, path2, directory) {
  const url = new URL(path2, baseUrl.replace(/\/+$/, ""));
  url.searchParams.set("directory", directory);
  return new Promise((resolve, reject) => {
    http.get(url.toString(), (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString();
        if (!res.statusCode || res.statusCode >= 300) {
          reject(new Error(`OpenCode API ${path2}: ${res.statusCode} ${res.statusMessage || ""}${body ? ` - ${body.slice(0, 200)}` : ""}`));
          return;
        }
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          reject(new Error(`OpenCode API ${path2}: JSON \u89E3\u6790\u5931\u8D25 \u2014 ${e.message}`));
          return;
        }
        if (parsed && typeof parsed === "object" && "error" in parsed && parsed.error) {
          const errMsg = parsed.error?.message || parsed.error?.data?.message || JSON.stringify(parsed.error);
          reject(new Error(`OpenCode API \u9519\u8BEF: ${errMsg}`));
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
function flattenProviders(providers) {
  const result = /* @__PURE__ */ new Map();
  const caps = {};
  for (const p of providers) {
    if (p.configured === false) continue;
    const providerName = p.name || p.id;
    const rawModels = p.models || {};
    const entries = Array.isArray(rawModels) ? rawModels.map((m) => ({ id: m.id || m.name || "", name: m.name || m.id || "", enabled: m.enabled, capabilities: m.capabilities })) : Object.values(rawModels).map((m) => ({ id: m.id || m.name || "", name: m.name || m.id || "", enabled: m.enabled, capabilities: m.capabilities }));
    for (const m of entries) {
      if (!m.id) continue;
      if (m.enabled === false) continue;
      const modelId = m.id.includes("/") ? m.id : `${p.id}/${m.id}`;
      const displayName = `${providerName} \xB7 ${m.name || m.id}`;
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
          temperature: c.temperature ?? true
        };
      }
    }
  }
  return {
    models: [...result.values()].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    caps
  };
}
async function startTempOpenCodeServer(bin, vaultDir, port, hostname = "127.0.0.1") {
  const args = ["serve", `--hostname=${hostname}`, `--port=${port}`];
  const spec = buildSpawn(bin, args);
  return new Promise((resolve, reject) => {
    const proc = (0, import_child_process.spawn)(spec.command, spec.args, {
      cwd: vaultDir,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env }
    });
    let output = "";
    const timer = setTimeout(() => {
      try {
        proc.kill();
      } catch {
      }
      reject(new Error(`opencode server \u542F\u52A8\u8D85\u65F6: ${output.trim()}`));
    }, OPENCODE_START_TIMEOUT_MS);
    const finish = (value) => {
      clearTimeout(timer);
      resolve(value);
    };
    proc.stdout?.on("data", (chunk) => {
      output += chunk.toString();
      const match = output.match(/opencode server listening.*\s(on\s+)?(https?:\/\/[^\s]+)/);
      if (match?.[2]) finish({ url: match[2].replace(/\/$/, ""), proc });
    });
    proc.stderr?.on("data", (chunk) => {
      output += chunk.toString();
    });
    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`opencode server \u5DF2\u9000\u51FA: ${code ?? "unknown"}
${output.trim()}`));
    });
  });
}
function stopTempServer(proc) {
  if (proc.exitCode !== null || proc.signalCode !== null) return;
  if (process.platform === "win32" && proc.pid) {
    try {
      (0, import_child_process.execSync)(`taskkill /f /t /pid ${proc.pid}`, { timeout: 3e3, windowsHide: true });
      return;
    } catch {
    }
  }
  try {
    proc.kill("SIGTERM");
  } catch {
  }
}
async function fetchModelsViaServer(bin, vaultDir, configuredPort) {
  const serverUrl = `http://127.0.0.1:${configuredPort}`;
  let temp = null;
  try {
    await httpGetOpenCode(serverUrl, "/global/health", vaultDir);
    const response = await httpGetOpenCode(serverUrl, "/config/providers", vaultDir);
    const providers = response?.providers ?? response ?? [];
    const r = flattenProviders(providers);
    return { models: r.models, caps: r.caps, defaultModel: "" };
  } catch {
  }
  const tempPort = configuredPort === 16226 ? 16227 : configuredPort + 1;
  try {
    temp = await startTempOpenCodeServer(bin, vaultDir, tempPort);
    const response = await httpGetOpenCode(temp.url, "/config/providers", vaultDir);
    const providers = response?.providers ?? response ?? [];
    const r = flattenProviders(providers);
    return { models: r.models, caps: r.caps, defaultModel: "" };
  } finally {
    if (temp) stopTempServer(temp.proc);
  }
}
function findOpenCodeConfigFiles(vaultDir) {
  const candidates = [
    path.join(vaultDir, ".opencode.json"),
    path.join(vaultDir, ".opencode", "config.json"),
    path.join(process.env.APPDATA || "", "opencode", "config.json"),
    path.join(process.env.USERPROFILE || "", ".opencode.json"),
    path.join(process.env.USERPROFILE || "", ".opencode", "config.json"),
    path.join(process.env.USERPROFILE || "", ".config", "opencode", "config.json"),
    path.join(process.env.LOCALAPPDATA || "", "opencode", "config.json")
  ];
  const seen = /* @__PURE__ */ new Set();
  const results = [];
  for (const p of candidates) {
    if (seen.has(p)) continue;
    seen.add(p);
    try {
      const content = fs.readFileSync(p, "utf-8");
      results.push(JSON.parse(content));
    } catch {
    }
  }
  return results;
}
function extractModelsFromConfig(parsed) {
  const result = /* @__PURE__ */ new Map();
  const providers = parsed?.providers ?? parsed?.profiles ?? {};
  for (const [providerId, cfg] of Object.entries(providers)) {
    const providerName = cfg?.name || providerId;
    const rawModels = cfg?.models ?? {};
    const entries = Array.isArray(rawModels) ? rawModels.map((m) => ({ id: m.id || m.name || m || "", name: m.name || m.id || m || "" })) : Object.values(rawModels).map((m) => ({ id: m.id || m.name || "", name: m.name || m.id || "" }));
    for (const m of entries) {
      if (!m.id) continue;
      const modelId = m.id.includes("/") ? m.id : `${providerId}/${m.id}`;
      if (!result.has(modelId)) result.set(modelId, { id: modelId, displayName: `${providerName} \xB7 ${m.name || m.id}` });
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
async function fetchOpenCodeModelsFromCLI(opencodePath, vaultDir, port = 16226) {
  const modelMap = /* @__PURE__ */ new Map();
  let caps = {};
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
      const out = await spawnWithTimeout(effectiveBin, ["config", "--format", "json"], vaultDir, 8e3).catch(() => "");
      if (out) {
        for (const m of extractModelsFromConfig(JSON.parse(out))) {
          if (!modelMap.has(m.id)) modelMap.set(m.id, m);
        }
      }
    } catch {
    }
  }
  return { models: [...modelMap.values()], caps, defaultModel: "" };
}
async function fetchOpenCodeAgents(opencodePath, vaultDir, port = 16226) {
  const url = `http://127.0.0.1:${port}`;
  try {
    await httpGetOpenCode(url, "/global/health", vaultDir);
    const agents = await httpGetOpenCode(url, "/agent", vaultDir);
    if (Array.isArray(agents)) return filterAgents(agents);
  } catch {
  }
  try {
    const effectiveBin = await resolveOpenCodePath(opencodePath);
    const temp = await startTempOpenCodeServer(effectiveBin, vaultDir, port);
    try {
      const agents = await httpGetOpenCode(temp.url, "/agent", vaultDir);
      if (Array.isArray(agents)) return filterAgents(agents);
    } finally {
      stopTempServer(temp.proc);
    }
  } catch {
  }
  return [];
}
function filterAgents(agents) {
  return agents.filter((a) => a.mode === "primary" && !a.hidden).map((a) => ({ name: a.name, description: a.description }));
}
function envWithProxy(settings) {
  if (!settings.proxyEnabled || !settings.proxyUrl) return {};
  const url = settings.proxyUrl;
  return { HTTP_PROXY: url, HTTPS_PROXY: url, http_proxy: url, https_proxy: url };
}
async function callAIWithCLI(prompt, settings, vaultDir, attachments, signal, onConnected, onThinking, onTextUpdate, onDiffs, onToolProgress) {
  const effectiveBin = await resolveOpenCodePath(settings.opencode.cliPath);
  const args = ["run", "--format", "json", "--thinking"];
  if (settings.defaultReasoning) args.push("--variant", settings.defaultReasoning);
  const agent = settings.opencode.agent;
  if (agent) args.push("--agent", agent);
  if (settings.defaultPermission !== "read-only") args.push("--dangerously-skip-permissions");
  if (settings.opencode.model) args.push("--model", settings.opencode.model);
  if (settings.mcpEnabled) args.push("--mcp");
  return new Promise((resolve, reject) => {
    cliCallInProgress = true;
    let connected = false;
    let stdoutBuf = "";
    let stderrBuf = "";
    let fullText = "";
    let resolved = false;
    let proc;
    const cleanup = () => {
      cliCallInProgress = false;
    };
    try {
      const spec = buildSpawn(effectiveBin, args);
      proc = (0, import_child_process.spawn)(spec.command, spec.args, {
        cwd: vaultDir,
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env, ...envWithProxy(settings), OPENCODE_CALLER: "obsidian" }
      });
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
      return;
    }
    proc.stdin.write(prompt);
    proc.stdin.end();
    const done = (err) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      if (err) reject(err);
      else resolve(fullText || "(\u65E0\u54CD\u5E94\u5185\u5BB9)");
    };
    const parseEvent = (raw) => {
      let event;
      try {
        event = JSON.parse(raw);
      } catch {
        return;
      }
      if (!connected) {
        connected = true;
        if (onConnected) onConnected();
      }
      if (event.sessionID && !currentCLISessionID) currentCLISessionID = event.sessionID;
      if (event.type === "error") {
        const errMsg = event.error?.data?.message || event.error?.message || "opencode \u8FD4\u56DE\u672A\u77E5\u9519\u8BEF";
        done(new Error(errMsg));
        return;
      }
      if (event.type === "thinking") {
        const t = event.part?.text ?? event.text ?? event.content ?? "";
        if (t && onThinking) onThinking(t);
        return;
      }
      if (event.type === "text") {
        const t = event.part?.text ?? event.text ?? event.content ?? "";
        if (t) {
          fullText = t;
          if (onTextUpdate) onTextUpdate(t);
        }
        return;
      }
      if (event.type === "tool_use") {
        const tool = event.part?.tool || event.tool || "";
        const status = event.part?.state?.status || "running";
        if (tool && onToolProgress) onToolProgress(tool, status);
        return;
      }
      if (event.type === "files" && event.files) {
        const diffs = (Array.isArray(event.files) ? event.files : []).map((f) => ({
          file: typeof f === "string" ? f : f.path || f.file || "",
          before: f.before || "",
          after: f.after || "",
          diff: f.diff || "",
          additions: Number(f.additions) || 0,
          deletions: Number(f.deletions) || 0
        })).filter((d) => d.file);
        if (diffs.length && onDiffs) onDiffs(diffs);
      }
    };
    proc.stdout.on("data", (chunk) => {
      stdoutBuf += chunk.toString();
      const lines = stdoutBuf.split("\n");
      stdoutBuf = lines.pop() || "";
      for (const line of lines) {
        const trimmed = stripAnsi(line).trim();
        if (trimmed) parseEvent(trimmed);
      }
    });
    proc.stderr.on("data", (chunk) => {
      stderrBuf += stripAnsi(chunk.toString());
    });
    proc.on("error", (err) => done(err));
    proc.on("close", (code) => {
      if (resolved) return;
      if (code !== 0) done(new Error(stderrBuf.trim() || `\u8FDB\u7A0B\u9000\u51FA\u7801 ${code}`));
      else if (!connected) done(new Error("\u672A\u6536\u5230\u6570\u636E\n\u8BF7\u68C0\u67E5 opencode \u8DEF\u5F84\u548C\u6A21\u578B\u914D\u7F6E\uFF0C\u6216\u91CD\u542F opencode serve"));
      else resolve(fullText || "(\u65E0\u54CD\u5E94\u5185\u5BB9)");
    });
    if (signal) {
      if (signal.aborted) {
        try {
          stopTempServer(proc);
        } catch {
        }
        clearCLISessionID();
        done(new DOMException("\u5DF2\u4E2D\u65AD", "AbortError"));
        return;
      }
      signal.addEventListener("abort", () => {
        try {
          stopTempServer(proc);
        } catch {
        }
        clearCLISessionID();
        done(new DOMException("\u5DF2\u4E2D\u65AD", "AbortError"));
      }, { once: true });
    }
  });
}
async function callAIWithAPI(apiEndpoint, apiKey, model, messages, maxTokens, temperature, stream = false, signal, reasoningEffort) {
  const body = { model, messages, max_tokens: maxTokens, temperature, stream };
  if (reasoningEffort && reasoningEffort !== "none") {
    body.reasoning_effort = reasoningEffort;
  }
  const resp = await fetch(apiEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`API ${resp.status}: ${errText.slice(0, 200)}`);
  }
  return resp;
}
async function callAIWithAPIJson(apiEndpoint, apiKey, model, messages, maxTokens, temperature, reasoningEffort) {
  const resp = await callAIWithAPI(apiEndpoint, apiKey, model, messages, maxTokens, temperature, false, void 0, reasoningEffort);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "\uFF08\u65E0\u54CD\u5E94\uFF09";
}
function estimateTokens(text) {
  let tokens = 0;
  for (const ch of text) {
    tokens += ch.charCodeAt(0) > 127 ? 1.5 : 0.25;
  }
  return Math.ceil(tokens);
}
function registerProcessCleanup(proc) {
  if (processCleanupRegistered) return;
  processCleanupRegistered = true;
  const cleanup = () => {
    try {
      proc.kill();
    } catch {
    }
  };
  process.on("exit", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("SIGINT", cleanup);
}
function isServerAutoStarted() {
  if (autoStartedProc && autoStartedProc.exitCode !== null) {
    autoStartedProc = null;
  }
  return autoStartedProc !== null && autoStartedProc.exitCode === null;
}
async function ensureOpenCodeServer(cliPath, hostname, port, vaultDir, autoStart) {
  const serverUrl = `http://${hostname || "127.0.0.1"}:${port || 16226}`;
  try {
    await httpGetOpenCode(serverUrl, "/global/health", vaultDir);
    return serverUrl;
  } catch {
  }
  if (!autoStart) throw new Error("opencode serve \u672A\u8FD0\u884C\uFF0C\u4E14\u81EA\u52A8\u542F\u52A8\u672A\u5F00\u542F");
  if (autoStartedProc && autoStartedProc.exitCode === null) {
    stopTempServer(autoStartedProc);
    autoStartedProc = null;
  }
  const effectiveBin = await resolveOpenCodePath(cliPath);
  const temp = await startTempOpenCodeServer(effectiveBin, vaultDir, port, hostname);
  autoStartedProc = temp.proc;
  registerProcessCleanup(temp.proc);
  return temp.url;
}
function stopOpenCodeServer() {
  if (autoStartedProc) {
    stopTempServer(autoStartedProc);
    autoStartedProc = null;
  }
}
var import_child_process, http, fs, path, OPENCODE_START_TIMEOUT_MS, currentCLISessionID, cliCallInProgress, autoStartedProc, processCleanupRegistered;
var init_ai = __esm({
  "src/ai.ts"() {
    "use strict";
    import_child_process = require("child_process");
    http = __toESM(require("http"));
    fs = __toESM(require("fs"));
    path = __toESM(require("path"));
    init_server();
    OPENCODE_START_TIMEOUT_MS = 15e3;
    currentCLISessionID = "";
    cliCallInProgress = false;
    autoStartedProc = null;
    processCleanupRegistered = false;
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => XiaoyuanAIPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian5 = require("obsidian");

// src/types.ts
var DEFAULT_OPENCODE_SETTINGS = {
  cliPath: "opencode",
  autoStart: false,
  hostname: "127.0.0.1",
  port: 16226,
  model: "",
  agent: "build",
  textEnabled: true,
  imageEnabled: false,
  pdfEnabled: false
};
var DEFAULT_SETTINGS = {
  execMode: "cli",
  opencode: { ...DEFAULT_OPENCODE_SETTINGS },
  activeApiProviderId: "",
  apiProviders: [
    { id: "default", name: "\u9ED8\u8BA4 API", baseUrl: "https://api.openai.com/v1", model: "gpt-4o", apiKey: "" }
  ],
  proxyEnabled: false,
  proxyUrl: "",
  mcpEnabled: false,
  defaultReasoning: "low",
  apiReasoningEffort: "none",
  defaultPermission: "read-only",
  autoOpen: true,
  showContext: false,
  chatViewType: "right",
  systemPrompt: "\u4F60\u662F\u4E00\u4E2A AI \u52A9\u624B\uFF0C\u96C6\u6210\u5728 Obsidian \u7B14\u8BB0\u8F6F\u4EF6\u4E2D\u3002\u7528\u6237\u6B63\u5728\u505A\u7B14\u8BB0\u6216\u5199\u4F5C\u3002\u8BF7\u7528\u4E2D\u6587\u56DE\u7B54\uFF0C\u4FDD\u6301\u7B80\u6D01\u4E13\u4E1A\u3002",
  maxTokens: 4096,
  temperature: 0.7,
  chatHistoryPath: ".chatHistory",
  showDiffPreview: true,
  showThinking: true
};
function getActiveProvider(s) {
  if (s.activeApiProviderId) return s.apiProviders.find((p) => p.id === s.activeApiProviderId);
  return s.apiProviders[0];
}
var CHAT_SESSIONS_KEY = "xiaoyuan-chat-sessions";
var CURRENT_SESSION_KEY = "xiaoyuan-current-session";
var VIEW_TYPE_XIAOYUAN_AI_CHAT = "xiaoyuan-chat-view";
var OPERATION_PROMPTS = {
  polish: "\u4F60\u662F\u4E00\u4E2A\u6587\u5B57\u6DA6\u8272\u52A9\u624B\u3002\u8BF7\u6DA6\u8272\u4EE5\u4E0B\u6587\u672C\uFF0C\u6539\u8FDB\u8868\u8FBE\u3001\u8BED\u6CD5\u548C\u6D41\u7545\u5EA6\uFF0C\u4FDD\u6301\u539F\u610F\u4E0D\u53D8\u3002\u53EA\u8F93\u51FA\u6DA6\u8272\u540E\u7684\u7ED3\u679C\uFF0C\u4E0D\u8981\u6DFB\u52A0\u4EFB\u4F55\u89E3\u91CA\uFF1A\n\n",
  summarize: "\u4F60\u662F\u4E00\u4E2A\u603B\u7ED3\u52A9\u624B\u3002\u8BF7\u5BF9\u4EE5\u4E0B\u6587\u672C\u8FDB\u884C\u7B80\u6D01\u7684\u603B\u7ED3\uFF0C\u63D0\u53D6\u5173\u952E\u8981\u70B9\u3002\u7528\u4E2D\u6587\u603B\u7ED3\uFF0C\u53EA\u8F93\u51FA\u603B\u7ED3\u5185\u5BB9\uFF1A\n\n",
  complete: "\u4F60\u662F\u4E00\u4E2A\u5199\u4F5C\u52A9\u624B\u3002\u8BF7\u6839\u636E\u4E0A\u4E0B\u6587\uFF0C\u81EA\u7136\u5730\u8865\u5168\u4EE5\u4E0B\u5185\u5BB9\uFF0C\u4FDD\u6301\u98CE\u683C\u4E00\u81F4\uFF1A\n\n",
  expand: "\u4F60\u662F\u4E00\u4E2A\u5199\u4F5C\u52A9\u624B\u3002\u8BF7\u6269\u5199\u4EE5\u4E0B\u5185\u5BB9\uFF0C\u589E\u52A0\u7EC6\u8282\u3001\u4F8B\u5B50\u548C\u6DF1\u5EA6\uFF0C\u4FDD\u7559\u539F\u6587\u7684\u6838\u5FC3\u89C2\u70B9\uFF1A\n\n",
  translate: "\u4F60\u662F\u4E00\u4E2A\u7FFB\u8BD1\u52A9\u624B\u3002\u8BF7\u5C06\u4EE5\u4E0B\u6587\u672C\u7FFB\u8BD1\u6210\u4E2D\u6587\uFF0C\u4FDD\u6301\u4E13\u4E1A\u6027\u548C\u6D41\u7545\u5EA6\uFF1A\n\n",
  continue: "\u4F60\u662F\u4E00\u4E2A\u5199\u4F5C\u52A9\u624B\u3002\u8BF7\u6839\u636E\u4EE5\u4E0B\u5185\u5BB9\u81EA\u7136\u5730\u7EED\u5199\uFF0C\u4FDD\u6301\u98CE\u683C\u4E00\u81F4\uFF1A\n\n"
};
var OPERATION_LABELS = {
  polish: "\u6DA6\u8272",
  summarize: "\u603B\u7ED3",
  complete: "\u8865\u5168",
  expand: "\u6269\u5199",
  translate: "\u7FFB\u8BD1\u4E3A\u4E2D\u6587",
  continue: "\u7EED\u5199"
};
var WIKI_SYSTEM_PROMPTS = {
  query: "\u4F60\u662F\u4E00\u4E2A\u7EF4\u57FA\u77E5\u8BC6\u5E93\u7684\u68C0\u7D22\u52A9\u624B\u3002\u6839\u636E\u7528\u6237\u7684\u95EE\u9898\uFF0C\u4ECE\u77E5\u8BC6\u5E93\u89D2\u5EA6\u7ED9\u51FA\u7EFC\u5408\u6027\u7684\u56DE\u7B54\u3002\u5982\u679C\u4E0D\u77E5\u9053\uFF0C\u5C31\u8BDA\u5B9E\u8BF4\u4E0D\u77E5\u9053\u3002",
  capture: "\u4F60\u6B63\u5728\u5C06\u7528\u6237\u63D0\u4F9B\u7684\u5185\u5BB9\u6574\u7406\u4E3A\u7EF4\u57FA\u7B14\u8BB0\u3002\u8BF7\u63D0\u53D6\u5173\u952E\u4FE1\u606F\uFF0C\u5206\u7C7B\uFF08concept/skill/reference/decision\uFF09\uFF0C\u8F93\u51FA\u5E26 YAML frontmatter \u7684 Obsidian Markdown \u683C\u5F0F\u3002",
  ingest: "\u4F60\u6B63\u5728\u6444\u5165\u6587\u6863\u3002\u8BF7\u5206\u6790\u5185\u5BB9\uFF0C\u84B8\u998F\u51FA\u6838\u5FC3\u6982\u5FF5\u3001\u5B9E\u4F53\u3001\u6280\u80FD\uFF0C\u7528\u4E2D\u6587\u8F93\u51FA\u591A\u4E2A\u7EF4\u57FA\u9875\u9762\uFF08\u5E26 frontmatter \u548C [[\u7EF4\u57FA\u94FE\u63A5]]\uFF09\u3002"
};

// src/chat-view.ts
var import_obsidian2 = require("obsidian");

// src/markdown.ts
function renderMarkdown(text) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const blocks = [];
  let h = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const idx = blocks.length;
    blocks.push(`<pre><code class="language-${lang}">${esc(code.trim())}</code></pre>`);
    return `\0CODEBLOCK${idx}\0`;
  });
  h = esc(h);
  h = h.replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>").replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>').replace(/^- (.+)$/gm, "\u2022 $1").replace(/\n/g, "<br>");
  h = h.replace(/\x00CODEBLOCK(\d+)\x00/g, (_m, idx) => blocks[parseInt(idx)]);
  return h;
}

// src/chat-view.ts
init_ai();

// src/session.ts
function getChatHistoryPath(chatHistoryPath) {
  return chatHistoryPath || ".chatHistory";
}
function getSessionFilePath(chatHistoryPath, sessionId) {
  return `${getChatHistoryPath(chatHistoryPath)}/${sessionId}.md`;
}
async function ensureChatHistoryFolder(vault, path2) {
  const folder = vault.getFolderByPath(path2);
  if (folder) return;
  try {
    await vault.createFolder(path2);
  } catch (e) {
    if (e instanceof Error && e.message.includes("already exists")) {
      return;
    }
    throw e;
  }
}
function parseMarkdownToMessages(content) {
  const messages = [];
  const parts = content.split(/\n---\n+/);
  let idCounter = 0;
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;
    const lines = part.split("\n");
    let role = null;
    let msgContent = "";
    let thinkingLines = [];
    let inThinking = false;
    for (const line of lines) {
      if (line.startsWith("**\u4F60**:")) {
        role = "user";
      } else if (line.startsWith("**\u5C0F\u5143**:")) {
        role = "assistant";
      } else if (line.trim() === "> [!thinking] \u601D\u8003\u8FC7\u7A0B") {
        inThinking = true;
      } else if (inThinking) {
        if (line.startsWith("> ")) {
          thinkingLines.push(line.slice(2));
        } else {
          inThinking = false;
          msgContent += line + "\n";
        }
      } else if (role) {
        msgContent += line + "\n";
      }
    }
    if (role && msgContent.trim()) {
      const msg = {
        id: "msg-" + ++idCounter,
        role,
        content: msgContent.trim()
      };
      if (thinkingLines.length > 0) msg.thinking = thinkingLines.join("\n").trim();
      messages.push(msg);
    }
  }
  return messages;
}
function sessionToMarkdown(session, messages) {
  let content = `---
title: ${session?.title || "\u65B0\u5BF9\u8BDD"}
created: ${session?.createdAt || Date.now()}
updated: ${Date.now()}
---

`;
  messages.forEach((msg) => {
    content += `**${msg.role === "user" ? "\u4F60" : "\u5C0F\u5143"}**:

${msg.content}

`;
    if (msg.thinking) {
      content += `> [!thinking] \u601D\u8003\u8FC7\u7A0B
> ${msg.thinking.replace(/\n/g, "\n> ")}

`;
    }
    content += `---

`;
  });
  return content;
}
async function collectSessionFiles(vault, folderPath) {
  const prefix = folderPath + "/";
  try {
    const listed = await vault.adapter.list(folderPath);
    const files = listed.files.filter((f) => f.endsWith(".md"));
    if (files.length > 0) return files;
  } catch {
  }
  try {
    const files = vault.getFiles().filter((f) => f.path.startsWith(prefix) && f.extension === "md").map((f) => f.path);
    if (files.length > 0) return files;
  } catch {
  }
  return [];
}
async function scanChatHistoryFolder(vault, chatHistoryPath) {
  try {
    const folderPath = getChatHistoryPath(chatHistoryPath);
    const filePaths = await collectSessionFiles(vault, folderPath);
    const loaded = [];
    for (const filePath of filePaths) {
      const sessionId = filePath.split("/").pop().replace(".md", "");
      try {
        const content = await vault.adapter.read(filePath);
        const messages = parseMarkdownToMessages(content);
        const match = content.match(/title:\s*(.+)/);
        const title = match ? match[1].trim() : messages[0]?.content?.slice(0, 30) || "\u5386\u53F2\u5BF9\u8BDD";
        const matchCreated = content.match(/created:\s*(\d+)/);
        const createdAt = matchCreated ? parseInt(matchCreated[1]) : Date.now();
        const matchUpdated = content.match(/updated:\s*(\d+)/);
        const updatedAt = matchUpdated ? parseInt(matchUpdated[1]) : Date.now();
        loaded.push({
          id: sessionId,
          title,
          createdAt,
          updatedAt
        });
      } catch (e) {
        console.warn(`\u8BFB\u53D6\u4F1A\u8BDD\u6587\u4EF6 ${filePath} \u5931\u8D25:`, e);
      }
    }
    loaded.sort((a, b) => b.updatedAt - a.updatedAt);
    return loaded;
  } catch (e) {
    console.warn("\u626B\u63CF\u5386\u53F2\u4F1A\u8BDD\u6587\u4EF6\u5939\u5931\u8D25:", e);
    return [];
  }
}
async function readVaultFile(vault, filePath) {
  try {
    if (await vault.adapter.exists(filePath)) {
      return vault.adapter.read(filePath);
    }
  } catch {
  }
  try {
    const file = vault.getFiles().find((f) => f.path === filePath);
    if (file) return vault.read(file);
  } catch {
  }
  return null;
}
async function loadSessionFromFile(vault, chatHistoryPath, sessionId) {
  const filePath = getSessionFilePath(chatHistoryPath, sessionId);
  const content = await readVaultFile(vault, filePath);
  if (!content) return [];
  return parseMarkdownToMessages(content);
}
async function saveSessionToFile(vault, chatHistoryPath, sessionId, session, messages) {
  const filePath = getSessionFilePath(chatHistoryPath, sessionId);
  const content = sessionToMarkdown(session, messages);
  try {
    if (await vault.adapter.exists(filePath)) {
      await vault.adapter.write(filePath, content);
    } else {
      await vault.create(filePath, content);
    }
  } catch (e) {
    console.warn(`\u4FDD\u5B58\u4F1A\u8BDD\u6587\u4EF6 ${filePath} \u5931\u8D25:`, e);
  }
}
async function deleteSessionFile(vault, chatHistoryPath, sessionId) {
  const filePath = getSessionFilePath(chatHistoryPath, sessionId);
  try {
    if (await vault.adapter.exists(filePath)) {
      await vault.adapter.remove(filePath);
    }
  } catch (e) {
    console.warn(`\u5220\u9664\u4F1A\u8BDD\u6587\u4EF6 ${filePath} \u5931\u8D25:`, e);
  }
}
async function loadSessionsMeta(plugin) {
  const data = await plugin.loadData();
  let sessions = [];
  let currentSessionId = "";
  if (data?.[CHAT_SESSIONS_KEY]) {
    try {
      sessions = JSON.parse(data[CHAT_SESSIONS_KEY]);
    } catch {
    }
  }
  if (data?.[CURRENT_SESSION_KEY]) {
    currentSessionId = data[CURRENT_SESSION_KEY];
  }
  return { sessions, currentSessionId };
}
async function saveSessionsMeta(plugin, sessions, currentSessionId) {
  const data = await plugin.loadData() || {};
  data[CHAT_SESSIONS_KEY] = JSON.stringify(sessions.map((s) => {
    const { messages, ...rest } = s;
    return rest;
  }));
  data[CURRENT_SESSION_KEY] = currentSessionId;
  await plugin.saveData(data);
}
function migrateOldData(data) {
  if (data?.["xiaoyuan-chat-history"]) {
    try {
      return JSON.parse(data["xiaoyuan-chat-history"]);
    } catch {
      return null;
    }
  }
  return null;
}

// src/popup.ts
function showPopup(trigger, buildContent, options) {
  if (document.querySelector(".xy-popup")) {
    document.querySelectorAll(".xy-popup").forEach((el) => el.remove());
    return null;
  }
  const popup = document.body.createDiv({ cls: "xy-popup" });
  const rect = trigger.getBoundingClientRect();
  if (options?.fullWidth) {
    const container = trigger.closest(".xiaoyuan-chat");
    if (container) {
      const cr = container.getBoundingClientRect();
      popup.style.cssText = `position:fixed;left:${cr.left}px;width:${cr.width}px;`;
    } else {
      popup.style.cssText = `position:fixed;left:${rect.left}px;`;
    }
  } else {
    popup.style.cssText = `position:fixed;left:${rect.left}px;`;
  }
  if (options?.maxHeight) popup.style.maxHeight = options.maxHeight;
  buildContent(popup);
  if (options?.direction === "up") {
    document.body.appendChild(popup);
    popup.style.bottom = `${window.innerHeight - rect.top + 2}px`;
  } else {
    popup.style.top = `${rect.bottom}px`;
    document.body.appendChild(popup);
  }
  setTimeout(() => {
    const handler = (ev) => {
      if (!popup.contains(ev.target)) {
        popup.remove();
        document.removeEventListener("click", handler);
      }
    };
    document.addEventListener("click", handler);
  }, 0);
  return popup;
}
function addPopupItem(parent, label, checked, onClick) {
  const item = parent.createDiv({ cls: "xy-popup-item" });
  const check = item.createSpan({ cls: "xy-popup-check" });
  check.textContent = checked ? "\u2713" : "";
  const labelEl = item.createSpan({ cls: "xy-popup-label" });
  labelEl.textContent = label;
  item.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
    const popup = item.closest(".xy-popup");
    if (popup) popup.remove();
  });
  return item;
}

// src/toolbar.ts
var import_obsidian = require("obsidian");
function buildToolbarContent(container, view) {
  const s = view.plugin.settings;
  const attachBtn = container.createSpan({ cls: "xiaoyuan-attach-btn" });
  attachBtn.textContent = "+";
  (0, import_obsidian.setTooltip)(attachBtn, "\u6DFB\u52A0\u9644\u4EF6");
  attachBtn.addEventListener("click", () => view.pickFiles());
  if (s.execMode === "cli") {
    const agentOptions = (s.opencodeAgents || []).length ? (s.opencodeAgents || []).map((a) => ({ value: a.name, label: a.name })) : [{ value: "build", label: "build" }, { value: "plan", label: "plan" }];
    const agentText = container.createSpan({ cls: "xiaoyuan-level-select" });
    agentText.textContent = s.opencode.agent;
    (0, import_obsidian.setTooltip)(agentText, "\u70B9\u51FB\u5207\u6362 agent");
    agentText.addEventListener("click", (e) => {
      e.stopPropagation();
      showPopup(agentText, (popup) => {
        for (const m of agentOptions) {
          addPopupItem(popup, m.label, m.value === s.opencode.agent, () => {
            s.opencode.agent = m.value;
            view.plugin.saveSettings();
            agentText.textContent = m.value;
            const chatEl = agentText.closest(".xiaoyuan-chat");
            if (chatEl) {
              chatEl.removeClass("xy-agent-plan", "xy-agent-build");
              if (m.value === "plan") chatEl.addClass("xy-agent-plan");
              else if (m.value === "build") chatEl.addClass("xy-agent-build");
            }
            new import_obsidian.Notice(`\u5DF2\u5207\u6362\u5230 agent: ${m.value}`);
          });
        }
      }, { direction: "up" });
    });
    container.appendChild(agentText);
  }
  const trigger = container.createSpan({ cls: "xiaoyuan-model-select" });
  trigger.textContent = s.execMode === "cli" ? s.opencode.model ? s.opencode.model.split("/").pop() || s.opencode.model : "\u6A21\u578B" : getActiveProvider(s)?.model || "\u6A21\u578B";
  (0, import_obsidian.setTooltip)(trigger, s.execMode === "cli" ? s.opencode.model || "\u672A\u9009\u62E9" : getActiveProvider(s)?.model || "\u672A\u9009\u62E9");
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    showPopup(trigger, async (popup) => {
      if (s.execMode === "cli") {
        const syncItem = popup.createDiv({ cls: "xy-popup-item" });
        syncItem.createSpan({ cls: "xy-popup-label" }).textContent = "\u27F3 \u540C\u6B65\u6A21\u578B\u5217\u8868";
        syncItem.addEventListener("click", (ev) => {
          ev.stopPropagation();
          popup.remove();
          view.syncCLIModels();
        });
        let models = s.opencodeModels || [];
        if (models.length === 0) {
          const loadingItem = popup.createDiv({ cls: "xy-popup-item" });
          loadingItem.createSpan({ cls: "xy-popup-label" }).textContent = "\u6B63\u5728\u540C\u6B65...";
          await view.syncCLIModels().catch(() => {
          });
          models = s.opencodeModels || [];
          popup.empty();
          const syncItem2 = popup.createDiv({ cls: "xy-popup-item" });
          syncItem2.createSpan({ cls: "xy-popup-label" }).textContent = "\u27F3 \u540C\u6B65\u6A21\u578B\u5217\u8868";
          syncItem2.addEventListener("click", (ev) => {
            ev.stopPropagation();
            popup.remove();
            view.syncCLIModels();
          });
        }
        if (models.length === 0) {
          const emptyItem = popup.createDiv({ cls: "xy-popup-item" });
          emptyItem.createSpan({ cls: "xy-popup-label" }).textContent = "\u672A\u83B7\u53D6\u5230\u6A21\u578B\u5217\u8868";
          return;
        }
        const groups = /* @__PURE__ */ new Map();
        for (const m of models) {
          const provider = m.value.includes("/") ? m.value.split("/")[0] : "\u5176\u4ED6";
          if (!groups.has(provider)) groups.set(provider, []);
          groups.get(provider).push(m);
        }
        const sortedGroups = [...groups.entries()].sort(([a], [b]) => {
          if (a === "opencode") return -1;
          if (b === "opencode") return 1;
          return a.localeCompare(b);
        });
        for (const [providerName, items] of sortedGroups) {
          popup.createDiv({ cls: "xy-popup-separator" });
          const groupTitle = popup.createDiv({ cls: "xy-popup-group-title" });
          const arrow = groupTitle.createSpan({ cls: "xy-popup-arrow" });
          arrow.textContent = "\u25B6";
          groupTitle.createSpan({ cls: "xy-popup-label" }).textContent = providerName;
          const children = popup.createDiv({ cls: "xy-popup-group-children" });
          children.classList.add("is-collapsed");
          for (const m of items) {
            addPopupItem(children, m.label, m.value === s.opencode.model, () => {
              s.opencode.model = m.value;
              view.plugin.saveSettings();
              const shortName = m.value.split("/").pop() || m.value;
              trigger.textContent = shortName;
              (0, import_obsidian.setTooltip)(trigger, m.value);
              new import_obsidian.Notice(`\u5DF2\u5207\u6362\u5230\u6A21\u578B: ${shortName}`);
            });
          }
          groupTitle.addEventListener("click", (ev) => {
            ev.stopPropagation();
            const open = arrow.textContent === "\u25BC";
            arrow.textContent = open ? "\u25B6" : "\u25BC";
            children.classList.toggle("is-collapsed", open);
          });
        }
      } else {
        const providers = s.apiProviders;
        const activeProvider = getActiveProvider(s);
        let hasItem = false;
        for (const p of providers) {
          if (!p.model) continue;
          hasItem = true;
          const label = p.name ? `${p.name}: ${p.model}` : p.model;
          const isActive = p.id === activeProvider?.id;
          addPopupItem(popup, label, isActive, () => {
            s.activeApiProviderId = p.id;
            view.plugin.saveSettings();
            trigger.textContent = p.model;
            (0, import_obsidian.setTooltip)(trigger, p.name ? `${p.name}: ${p.model}` : p.model);
            new import_obsidian.Notice(`\u5DF2\u5207\u6362\u5230 ${label}`);
          });
        }
        if (!hasItem) {
          const emptyItem = popup.createDiv({ cls: "xy-popup-item" });
          emptyItem.createSpan({ cls: "xy-popup-label" }).textContent = "\u672A\u914D\u7F6E API \u6A21\u578B\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u6DFB\u52A0";
        }
      }
    }, { direction: "up", maxHeight: "50vh" });
  });
  const apiLevels = [
    { value: "none", label: "none" },
    { value: "low", label: "low" },
    { value: "medium", label: "medium" },
    { value: "high", label: "high" }
  ];
  if (s.execMode === "cli") {
    const levels = [
      { value: "none", label: "none" },
      { value: "minimal", label: "minimal" },
      { value: "low", label: "low" },
      { value: "medium", label: "medium" },
      { value: "high", label: "high" },
      { value: "xhigh", label: "xhigh" }
    ];
    const levelText = container.createSpan({ cls: "xiaoyuan-level-select" });
    levelText.textContent = s.defaultReasoning;
    (0, import_obsidian.setTooltip)(levelText, "\u70B9\u51FB\u5207\u6362\u601D\u8003\u5F3A\u5EA6");
    levelText.addEventListener("click", (e) => {
      e.stopPropagation();
      showPopup(levelText, (popup) => {
        for (const m of levels) {
          addPopupItem(popup, m.label, m.value === s.defaultReasoning, () => {
            s.defaultReasoning = m.value;
            view.plugin.saveSettings();
            levelText.textContent = m.label;
            new import_obsidian.Notice(`\u63A8\u7406\u5F3A\u5EA6: ${m.label}`);
          });
        }
      }, { direction: "up" });
    });
    container.appendChild(levelText);
  } else {
    const apiLevelText = container.createSpan({ cls: "xiaoyuan-level-select" });
    apiLevelText.textContent = s.apiReasoningEffort;
    (0, import_obsidian.setTooltip)(apiLevelText, "\u70B9\u51FB\u5207\u6362\u601D\u8003\u5F3A\u5EA6");
    apiLevelText.addEventListener("click", (e) => {
      e.stopPropagation();
      showPopup(apiLevelText, (popup) => {
        for (const m of apiLevels) {
          addPopupItem(popup, m.label, m.value === s.apiReasoningEffort, () => {
            s.apiReasoningEffort = m.value;
            view.plugin.saveSettings();
            apiLevelText.textContent = m.label;
            new import_obsidian.Notice(`\u63A8\u7406\u5F3A\u5EA6: ${m.label}`);
          });
        }
      }, { direction: "up" });
    });
    container.appendChild(apiLevelText);
  }
  const sendBtn = container.createSpan({ cls: "xiaoyuan-attach-btn" });
  sendBtn.style.marginLeft = "auto";
  sendBtn.addEventListener("click", () => {
    if (view.abortController) {
      view.abortController.abort();
    } else {
      view.sendMessage();
    }
  });
  return sendBtn;
}

// src/chat-view.ts
var XiaoyuanAIChatView = class extends import_obsidian2.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.messages = [];
    this.sessions = [];
    this.currentSessionId = "";
    this.msgIdCounter = 0;
    this.abortController = null;
    this.pendingDiffs = null;
    this.connectionStatusEl = null;
    this.attachments = [];
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_XIAOYUAN_AI_CHAT;
  }
  getDisplayText() {
    return "\u5C0F\u5143AI";
  }
  getIcon() {
    return "message-circle";
  }
  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("xiaoyuan-chat-container");
    this.viewContainer = contentEl.createDiv({ cls: "xiaoyuan-chat" });
    this.buildHeader();
    this.messagesEl = this.viewContainer.createDiv({ cls: "xiaoyuan-chat-messages" });
    this.buildInputArea();
    if (this.plugin.settings.execMode === "cli") {
      this.syncCLIModels();
    } else {
      this.checkConnectionStatus();
    }
    await this.loadSessions();
  }
  async onClose() {
    await this.saveCurrentSession();
    this.viewContainer.empty();
  }
  refresh() {
    this.messages = [];
    this.messagesEl.empty();
    this.addWelcomeMessage();
  }
  async newChat() {
    clearCLISessionID();
    await this.saveCurrentSession();
    await this.createNewSession();
  }
  addMessage(role, content) {
    const id = "msg-" + ++this.msgIdCounter;
    this.messages.push({ id, role, content });
    this.messagesEl.appendChild(this.renderMessageEl(id, role, content, false));
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }
  getActiveEditor() {
    return this.app.workspace.activeEditor?.editor || null;
  }
  rebuildToolbar() {
    if (!this.toolbarEl) return;
    this.toolbarEl.empty();
    this.buildToolbarContent(this.toolbarEl);
    this.updateAgentBorderClass();
    if (this.plugin.settings.execMode === "cli") {
      this.syncCLIModels();
    } else {
      this.checkConnectionStatus();
    }
  }
  // ─── Header ──────────────────────────────────────────────────────
  buildHeader() {
    const headerEl = this.viewContainer.createDiv({ cls: "xiaoyuan-chat-header" });
    const left = headerEl.createSpan({ cls: "xiaoyuan-chat-header-left" });
    const right = headerEl.createSpan({ cls: "xiaoyuan-chat-header-right" });
    const newChatBtn = left.createSpan({ cls: "xiaoyuan-new-chat-icon" });
    (0, import_obsidian2.setIcon)(newChatBtn, "message-square-plus");
    (0, import_obsidian2.setTooltip)(newChatBtn, "\u65B0\u5EFA\u5BF9\u8BDD");
    newChatBtn.addEventListener("click", () => this.newChat());
    this.sessionSelector = left.createSpan({ cls: "xiaoyuan-session-selector" });
    (0, import_obsidian2.setTooltip)(this.sessionSelector, "\u70B9\u51FB\u9009\u62E9\u4F1A\u8BDD");
    this.sessionSelector.textContent = "\u65B0\u5BF9\u8BDD";
    this.sessionSelector.addEventListener("click", async (e) => {
      e.stopPropagation();
      await this.showSessionDropdown(e);
    });
    this.buildHeaderContent(right);
  }
  rebuildHeader() {
    const headerEl = this.viewContainer.querySelector(".xiaoyuan-chat-header");
    if (!headerEl) return;
    const right = headerEl.querySelector(".xiaoyuan-chat-header-right");
    if (!right) return;
    const oldDot = right.querySelector(".xy-status-dot");
    if (oldDot) oldDot.remove();
    right.empty();
    this.buildHeaderContent(right);
  }
  buildHeaderContent(right) {
    const s = this.plugin.settings;
    this.connectionStatusEl = right.createSpan({ cls: "xy-status-dot" });
    this.updateConnectionStatusUI(false);
    this.connectionStatusEl.addEventListener("click", () => {
      if (s.execMode === "cli") {
        this.syncCLIModels();
      } else {
        this.checkConnectionStatus();
      }
    });
    const modeText = right.createSpan({ cls: "xiaoyuan-mode-selector" });
    modeText.textContent = s.execMode === "cli" ? "CLI" : "API";
    (0, import_obsidian2.setTooltip)(modeText, "\u70B9\u51FB\u5207\u6362\u6267\u884C\u6A21\u5F0F");
    modeText.addEventListener("click", (e) => {
      e.stopPropagation();
      showPopup(modeText, (popup) => {
        addPopupItem(popup, "API", s.execMode === "api", () => {
          s.execMode = "api";
          this.plugin.saveSettings();
          this.rebuildHeader();
          this.rebuildToolbar();
          this.addSystemMessage("\u2705 \u5DF2\u5207\u6362\u5230 API \u6A21\u5F0F");
          new import_obsidian2.Notice("\u5DF2\u5207\u6362\u5230 API \u6A21\u5F0F");
        });
        addPopupItem(popup, "CLI", s.execMode === "cli", () => {
          s.execMode = "cli";
          this.plugin.saveSettings();
          this.rebuildHeader();
          this.rebuildToolbar();
          this.addSystemMessage("\u2705 \u5DF2\u5207\u6362\u5230 CLI \u6A21\u5F0F");
          new import_obsidian2.Notice("\u5DF2\u5207\u6362\u5230 CLI \u6A21\u5F0F");
        });
      });
    });
    right.appendChild(modeText);
    const settingsIcon = right.createSpan({ cls: "xiaoyuan-settings-icon" });
    (0, import_obsidian2.setIcon)(settingsIcon, "settings");
    (0, import_obsidian2.setTooltip)(settingsIcon, "\u8BBE\u7F6E");
    settingsIcon.addEventListener("click", () => {
      this.app.setting.open();
      this.app.setting.openTabById("xiaoyuanAI");
    });
  }
  // ─── Input ───────────────────────────────────────────────────────
  buildInputArea() {
    const container = this.viewContainer.createDiv({ cls: "xiaoyuan-input-container" });
    this.inputEl = container.createEl("textarea", {
      cls: "xiaoyuan-chat-input",
      attr: { placeholder: "\u8F93\u5165\u4F60\u7684\u95EE\u9898..." }
    });
    this.attachPreviewEl = container.createDiv({ cls: "xiaoyuan-attach-preview" });
    this.toolbarEl = container.createDiv({ cls: "xiaoyuan-toolbar" });
    this.buildToolbarContent(this.toolbarEl);
    this.updateAgentBorderClass();
    this.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }
  updateAgentBorderClass() {
    const agent = this.plugin.settings.opencode.agent;
    this.viewContainer.removeClass("xy-agent-plan", "xy-agent-build");
    if (agent === "plan") this.viewContainer.addClass("xy-agent-plan");
    else if (agent === "build") this.viewContainer.addClass("xy-agent-build");
  }
  buildToolbarContent(container) {
    this.sendBtn = buildToolbarContent(container, this);
    this.setProcessingState(false);
  }
  async syncCLIModels() {
    const s = this.plugin.settings;
    try {
      if (s.opencode.autoStart) {
        await ensureOpenCodeServer(s.opencode.cliPath, s.opencode.hostname, s.opencode.port, getVaultBasePath(this.app.vault), true).catch(() => {
        });
      }
      const result = await fetchOpenCodeModelsFromCLI(s.opencode.cliPath, getVaultBasePath(this.app.vault), s.opencode.port);
      s.opencodeModels = result.models.map((m) => ({ label: m.displayName, value: m.id }));
      s.opencodeModelCaps = result.caps;
      if (result.defaultModel && !s.opencode.model) {
        s.opencode.model = result.defaultModel;
      }
      if (!s.opencode.model && result.models.length > 0) {
        s.opencode.model = result.models[0].id;
      }
      if (s.opencode.model && result.models.length > 0 && !result.models.some((m) => m.id === s.opencode.model)) {
        s.opencode.model = result.defaultModel || result.models[0].id;
      }
      await this.plugin.saveSettings();
      if (result.models.length === 0) {
        new import_obsidian2.Notice("\u672A\u627E\u5230\u6A21\u578B\uFF0C\u8BF7\u68C0\u67E5 opencode \u914D\u7F6E");
      } else {
        new import_obsidian2.Notice(`\u5DF2\u540C\u6B65 ${result.models.length} \u4E2A\u6A21\u578B`);
      }
      this.updateConnectionStatusUI(true);
    } catch (err) {
      this.updateConnectionStatusUI(false);
      new import_obsidian2.Notice(`\u540C\u6B65\u6A21\u578B\u5931\u8D25\uFF1A${err.message}`);
    }
  }
  async checkConnectionStatus() {
    const s = this.plugin.settings;
    if (s.execMode === "cli") {
      const vaultDir = getVaultBasePath(this.app.vault);
      let ok = false;
      const status = await checkOpenCodeStatus(s.opencode.cliPath, vaultDir, s.opencode.port, s.opencode.hostname);
      if (status.ok) {
        ok = true;
      } else if (s.opencode.autoStart) {
        try {
          await ensureOpenCodeServer(s.opencode.cliPath, s.opencode.hostname, s.opencode.port, vaultDir, true);
          ok = true;
        } catch {
        }
      }
      this.updateConnectionStatusUI(ok);
      return;
    }
    const provider = getActiveProvider(s);
    if (!provider || !provider.baseUrl || !provider.apiKey) {
      this.updateConnectionStatusUI(false);
      return;
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8e3);
      const modelsUrl = provider.baseUrl.replace(/\/+$/, "") + "/models";
      const resp = await fetch(modelsUrl, {
        headers: { Authorization: `Bearer ${provider.apiKey}` },
        signal: controller.signal
      });
      clearTimeout(timer);
      this.updateConnectionStatusUI(resp.ok);
    } catch {
      this.updateConnectionStatusUI(false);
    }
  }
  updateConnectionStatusUI(ok) {
    if (!this.connectionStatusEl) return;
    const mode = this.plugin.settings.execMode;
    this.connectionStatusEl.style.cssText = `display:inline-block;width:8px;height:8px;border-radius:50%;cursor:pointer;background:${ok ? "var(--color-green)" : "var(--color-red)"};`;
    const tip = mode === "cli" ? ok ? "opencode \u53EF\u7528" : "opencode \u4E0D\u53EF\u7528" : ok ? "API \u8FDE\u63A5\u6B63\u5E38" : "API \u672A\u8FDE\u63A5";
    (0, import_obsidian2.setTooltip)(this.connectionStatusEl, tip);
  }
  // ─── Message rendering ───────────────────────────────────────────
  renderMessageEl(id, role, content, streaming = false, thinking) {
    const msgEl = createDiv({ cls: `xiaoyuan-msg xiaoyuan-msg-${role}` });
    msgEl.id = id;
    const bubbleEl = msgEl.createDiv({ cls: "xiaoyuan-msg-bubble" });
    if (role === "user") {
      bubbleEl.createSpan().textContent = content;
      if (!streaming) {
        const actionsEl = msgEl.createDiv({ cls: "xiaoyuan-msg-actions" });
        const undoBtn = actionsEl.createSpan({ cls: "xiaoyuan-msg-action" });
        undoBtn.textContent = "\u21A9";
        (0, import_obsidian2.setTooltip)(undoBtn, "\u64A4\u9500\u6B64\u6D88\u606F");
        undoBtn.addEventListener("click", () => {
          if (window.confirm("\u786E\u8BA4\u64A4\u9500\u6B64\u6D88\u606F\uFF1F")) this.undoMessage(id);
        });
        const copyBtn = actionsEl.createSpan({ cls: "xiaoyuan-msg-action" });
        copyBtn.textContent = "\u{1F4CB}";
        (0, import_obsidian2.setTooltip)(copyBtn, "\u590D\u5236");
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(content);
          new import_obsidian2.Notice("\u5DF2\u590D\u5236");
        });
      }
    } else {
      const s = this.plugin.settings;
      if (thinking && s.showThinking) {
        const detailsEl = bubbleEl.createEl("details", { cls: "xiaoyuan-thinking" });
        detailsEl.createEl("summary", { text: "\u{1F914} \u601D\u8003\u8FC7\u7A0B" });
        const tc = detailsEl.createDiv({ cls: "xiaoyuan-thinking-content" });
        tc.innerHTML = renderMarkdown(thinking.trim());
      }
      bubbleEl.insertAdjacentHTML("beforeend", renderMarkdown(content.trim()));
      if (!streaming) {
        const actionsEl = msgEl.createDiv({ cls: "xiaoyuan-msg-actions" });
        const copyBtn = actionsEl.createSpan({ cls: "xiaoyuan-msg-action" });
        copyBtn.textContent = "\u{1F4CB}";
        (0, import_obsidian2.setTooltip)(copyBtn, "\u590D\u5236");
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(content);
          new import_obsidian2.Notice("\u5DF2\u590D\u5236");
        });
      }
      setTimeout(() => {
        if (!bubbleEl.isConnected) return;
        window.Prism?.highlightAllUnder(bubbleEl);
        bubbleEl.querySelectorAll("pre").forEach((pre) => {
          if (pre.querySelector(".xy-copy-btn")) return;
          const btn = document.createElement("button");
          btn.className = "xy-copy-btn";
          btn.textContent = "\u590D\u5236";
          pre.style.position = "relative";
          btn.addEventListener("click", () => {
            navigator.clipboard.writeText(pre.textContent || "");
            btn.textContent = "\u5DF2\u590D\u5236";
            setTimeout(() => {
              btn.textContent = "\u590D\u5236";
            }, 2e3);
          });
          pre.appendChild(btn);
        });
      }, 0);
    }
    return msgEl;
  }
  addWelcomeMessage() {
    const s = this.plugin.settings;
    const modeInfo = s.execMode === "cli" ? "\u5F53\u524D\u6A21\u5F0F\uFF1ACLI\uFF08opencode run\uFF09" : "\u5F53\u524D\u6A21\u5F0F\uFF1AAPI\uFF08\u76F4\u63A5\u8C03\u7528\uFF09";
    const msgEl = this.messagesEl.createDiv({ cls: "xiaoyuan-msg xiaoyuan-msg-assistant xiaoyuan-welcome" });
    msgEl.createDiv({ cls: "xiaoyuan-msg-bubble" }).innerHTML = `\u{1F44B} \u4F60\u597D\uFF01\u6211\u662F\u5C0F\u5143\u3002<br><br>${modeInfo}<br><br>\u6211\u53EF\u4EE5\u5E2E\u4F60\uFF1A<br>\u2022 \u{1F4AC} \u804A\u5929\u5BF9\u8BDD<br>\u2022 \u270D\uFE0F \u6DA6\u8272\u3001\u603B\u7ED3\u3001\u8865\u5168\u7B14\u8BB0<br>\u2022 \u{1F50D} \u67E5\u8BE2\u7EF4\u57FA\u77E5\u8BC6<br><br>\u9009\u4E2D\u6587\u672C\u540E\u53F3\u952E \u2192 \u4F7F\u7528 AI \u64CD\u4F5C\u3002`;
  }
  addSystemMessage(text) {
    const msgEl = this.messagesEl.createDiv({ cls: "xiaoyuan-msg xiaoyuan-msg-system" });
    msgEl.createDiv({ cls: "xiaoyuan-msg-bubble" }).textContent = text;
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return msgEl;
  }
  truncateMessagesIfNeeded() {
    const s = this.plugin.settings;
    const threshold = Math.floor(s.maxTokens * 0.75);
    const sysTokens = estimateTokens(s.systemPrompt);
    const msgTokens = estimateTokens(this.messages.map((m) => m.content).join("\n"));
    if (sysTokens + msgTokens <= threshold) return;
    let removed = 0;
    while (this.messages.length > 0) {
      const remaining = this.messages.slice(removed).map((m) => m.content).join("\n");
      if (estimateTokens(remaining) + sysTokens <= threshold) break;
      removed++;
    }
    if (removed === 0) return;
    const kept = this.messages.slice(removed);
    this.messages = kept;
    this.messagesEl.empty();
    this.addWelcomeMessage();
    for (const m of kept) {
      this.messagesEl.appendChild(this.renderMessageEl(m.id, m.role, m.content, false));
    }
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    this.addSystemMessage(`\u5DF2\u81EA\u52A8\u622A\u65AD ${removed} \u6761\u5386\u53F2\u6D88\u606F\u4EE5\u63A7\u5236 Token \u7528\u91CF`);
  }
  // ─── Send / AI ───────────────────────────────────────────────────
  async sendMessage() {
    if (this.abortController) return;
    const text = this.inputEl.value.trim();
    if (!text) return;
    this.addMessage("user", text);
    this.updateSessionTitle();
    this.inputEl.value = "";
    this.abortController = new AbortController();
    this.pendingDiffs = null;
    this.setProcessingState(true);
    this.truncateMessagesIfNeeded();
    let statusMsg = null;
    if (this.plugin.settings.execMode === "cli") {
      statusMsg = this.addSystemMessage("\u6B63\u5728\u8FDE\u63A5 opencode...");
    }
    try {
      const response = await this.callAI(text, this.abortController.signal, statusMsg);
      this.attachments = [];
      this.renderAttachments();
      if (statusMsg) statusMsg.remove();
      if (this.plugin.settings.execMode === "cli") {
        const streamId = this.finalizeStreamingMessage();
        await this.saveCurrentSession();
        const actualDiffs = this.pendingDiffs;
        if (this.plugin.settings.showDiffPreview && streamId && actualDiffs?.length) {
          const diffs = actualDiffs;
          this.renderDiffs(streamId, diffs);
          await this.saveCurrentSession();
        }
      } else {
        const finalized = this.finalizeStreamingMessage();
        if (!finalized && response) {
          this.addMessage("assistant", response);
        }
        await this.saveCurrentSession();
      }
    } catch (err) {
      if (statusMsg) statusMsg.remove();
      if (err.name === "AbortError") {
        clearCLISessionID();
        this.addSystemMessage("\u23F9 \u5DF2\u4E2D\u65AD");
      } else {
        this.addMessage("assistant", `\u274C \u9519\u8BEF\uFF1A${err.message}`);
      }
      await this.saveCurrentSession();
    } finally {
      this.abortController = null;
      this.pendingDiffs = null;
      this.setProcessingState(false);
      this.inputEl.focus();
    }
  }
  async callAI(userMessage, signal, statusMsg) {
    const s = this.plugin.settings;
    let enrichedMessage = userMessage;
    if (this.attachments.length > 0) {
      const attachBlocks = await Promise.all(this.attachments.map(async (att) => {
        if (att.type.startsWith("image/")) {
          return `![${att.name}](${att.data})`;
        }
        return `[\u9644\u4EF6: ${att.name}]
\`\`\`
${att.data}
\`\`\``;
      }));
      enrichedMessage = attachBlocks.join("\n\n") + "\n\n" + userMessage;
    }
    if (s.execMode === "cli") {
      const vaultDir = getVaultBasePath(this.app.vault);
      if (s.opencode.autoStart) {
        try {
          await ensureOpenCodeServer(s.opencode.cliPath, s.opencode.hostname, s.opencode.port, vaultDir, true);
        } catch (err) {
          new import_obsidian2.Notice(`\u26A0 \u542F\u52A8 opencode \u5931\u8D25: ${err.message}`);
          throw new Error(`\u65E0\u6CD5\u542F\u52A8 opencode serve: ${err.message}`);
        }
      }
      if (this.messages.length > 0 && this.messages[this.messages.length - 1].role === "user") {
        this.messages[this.messages.length - 1].content = enrichedMessage;
      }
      const modeIdentity2 = "\n\n\u5F53\u524D\u6A21\u5F0F\uFF1ACLI\uFF08opencode run\uFF09";
      const allMessages = [
        { role: "system", content: s.systemPrompt + modeIdentity2 },
        ...this.messages.map((m) => ({ role: m.role, content: m.content }))
      ];
      const prompt = allMessages.map((m) => `${m.role === "system" ? "[\u7CFB\u7EDF]" : m.role === "user" ? "[\u7528\u6237]" : "[\u52A9\u624B]"}: ${m.content}`).join("\n\n");
      let streamingId = "";
      let thinkingText = "";
      return callAIWithCLI(
        prompt,
        s,
        vaultDir,
        void 0,
        signal,
        () => {
          if (statusMsg) {
            const bubble = statusMsg.querySelector(".xiaoyuan-msg-bubble");
            if (bubble) bubble.textContent = "\u5DF2\u8FDE\u63A5\uFF0C\u7B49\u5F85\u54CD\u5E94...";
          }
        },
        (text) => {
          thinkingText += text;
          if (streamingId) this.updateStreamingThinking(streamingId, thinkingText);
        },
        (text) => {
          if (statusMsg) {
            statusMsg.remove();
            statusMsg = null;
          }
          if (!streamingId) {
            streamingId = this.addStreamingMessage(text, thinkingText);
          } else {
            this.updateStreamingMessage(streamingId, text);
          }
        },
        (diffs) => {
          this.pendingDiffs = diffs;
        },
        (tool, status) => {
          if (streamingId) this.addToolLogEntry(streamingId, tool, status);
        }
      );
    }
    const provider = getActiveProvider(s);
    if (!provider || !provider.apiKey) throw new Error("API Key \u672A\u914D\u7F6E\u3002\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199\u3002");
    const apiUrl = provider.baseUrl.includes("/chat/completions") ? provider.baseUrl : provider.baseUrl + "/chat/completions";
    const modeIdentity = "\n\n\u5F53\u524D\u6A21\u5F0F\uFF1AAPI | \u6A21\u578B\uFF1A" + provider.model + " | \u63D0\u4F9B\u5546\uFF1A" + provider.name;
    const resp = await callAIWithAPI(apiUrl, provider.apiKey, provider.model, [
      { role: "system", content: s.systemPrompt + modeIdentity },
      ...this.messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: enrichedMessage }
    ], s.maxTokens, s.temperature, true, signal, s.apiReasoningEffort);
    return this.processStreamResponse(resp);
  }
  async processStreamResponse(resp) {
    return new Promise((resolve, reject) => {
      const reader = resp.body?.getReader();
      if (!reader) {
        reject(new Error("\u65E0\u6CD5\u8BFB\u53D6\u54CD\u5E94\u6D41"));
        return;
      }
      const decoder = new TextDecoder("utf-8");
      let fullContent = "";
      let fullThinking = "";
      let messageId = "";
      let closed = false;
      const finish = (err) => {
        if (closed) return;
        closed = true;
        try {
          reader.releaseLock();
        } catch {
        }
        if (err) reject(err);
        else resolve(fullContent || fullThinking || "\uFF08\u65E0\u54CD\u5E94\uFF09");
      };
      const readChunk = async () => {
        try {
          const { done, value } = await reader.read();
          if (done) {
            finish();
            return;
          }
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith("data:")) continue;
            const dataStr = trimmedLine.slice(5).trim();
            if (dataStr === "[DONE]") {
              finish();
              return;
            }
            try {
              const data = JSON.parse(dataStr);
              const delta = data.choices?.[0]?.delta;
              const content = delta?.content;
              const reasoning = delta?.reasoning_content;
              if (reasoning) fullThinking += reasoning;
              if (content) fullContent += content;
              if (reasoning || content) {
                if (!messageId) {
                  messageId = this.addStreamingMessage(fullContent, fullThinking);
                } else {
                  if (content) this.updateStreamingMessage(messageId, fullContent);
                  if (reasoning) this.updateStreamingThinking(messageId, fullThinking);
                }
              }
            } catch {
            }
          }
          readChunk();
        } catch (err) {
          finish(err instanceof Error ? err : new Error("\u6D41\u5F0F\u54CD\u5E94\u5904\u7406\u5931\u8D25"));
        }
      };
      readChunk();
    });
  }
  addStreamingMessage(content, thinking) {
    const id = "msg-" + ++this.msgIdCounter;
    this.messages.push({ id, role: "assistant", content, thinking });
    const msgEl = createDiv({ cls: "xiaoyuan-msg xiaoyuan-msg-assistant" });
    msgEl.id = id;
    const bubbleEl = msgEl.createDiv({ cls: "xiaoyuan-msg-bubble" });
    if (thinking && this.plugin.settings.showThinking) {
      const detailsEl = bubbleEl.createEl("details", { cls: "xiaoyuan-thinking" });
      detailsEl.createEl("summary", { text: "\u{1F914} \u601D\u8003\u8FC7\u7A0B" });
      const tc = detailsEl.createDiv({ cls: "xiaoyuan-thinking-content" });
      tc.textContent = thinking;
    }
    const contentEl = bubbleEl.createDiv({ cls: "xy-stream-content" });
    contentEl.textContent = content;
    this.messagesEl.appendChild(msgEl);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return id;
  }
  updateStreamingMessage(messageId, content) {
    const msgEl = this.messagesEl.querySelector(`#${messageId}`);
    if (!msgEl) return;
    const contentEl = msgEl.querySelector(".xy-stream-content");
    if (contentEl) contentEl.textContent = content;
    const idx = this.messages.findIndex((m) => m.id === messageId);
    if (idx !== -1) this.messages[idx].content = content;
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }
  updateStreamingThinking(messageId, thinking) {
    const msgEl = this.messagesEl.querySelector(`#${messageId}`);
    if (!msgEl || !this.plugin.settings.showThinking) return;
    let tc = msgEl.querySelector(".xiaoyuan-thinking-content");
    const idx = this.messages.findIndex((m) => m.id === messageId);
    if (idx !== -1) this.messages[idx].thinking = thinking;
    if (tc) {
      tc.textContent = thinking;
    } else {
      const bubbleEl = msgEl.querySelector(".xiaoyuan-msg-bubble");
      if (!bubbleEl) return;
      const detailsEl = bubbleEl.createEl("details", { cls: "xiaoyuan-thinking" });
      detailsEl.createEl("summary", { text: "\u{1F914} \u601D\u8003\u8FC7\u7A0B" });
      tc = detailsEl.createDiv({ cls: "xiaoyuan-thinking-content" });
      tc.textContent = thinking;
    }
  }
  addToolLogEntry(messageId, toolName, status) {
    const msgEl = this.messagesEl.querySelector(`#${messageId}`);
    if (!msgEl) return;
    let logEl = msgEl.querySelector(".xy-tool-log");
    if (!logEl) {
      const bubbleEl = msgEl.querySelector(".xiaoyuan-msg-bubble");
      if (!bubbleEl) return;
      logEl = bubbleEl.createDiv({ cls: "xy-tool-log" });
    }
    const toolLabel = toolName === "bash" ? "\u6267\u884C\u547D\u4EE4" : toolName === "write" ? "\u5199\u5165\u6587\u4EF6" : toolName === "edit" ? "\u7F16\u8F91\u6587\u4EF6" : toolName === "read" ? "\u8BFB\u53D6\u6587\u4EF6" : toolName;
    const icon = status === "running" ? "\u23F3" : "\u2705";
    let entry = logEl.querySelector(`[data-tool="${toolName}"]`);
    if (!entry) {
      entry = logEl.createDiv({ cls: "xy-tool-entry" });
      entry.setAttribute("data-tool", toolName);
    }
    entry.textContent = `${icon} ${toolLabel}`;
  }
  finalizeStreamingMessage() {
    const lastMsg = this.messages[this.messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return null;
    const msgEl = this.messagesEl.querySelector(`#${lastMsg.id}`);
    if (!msgEl) return null;
    const bubbleEl = msgEl.querySelector(".xiaoyuan-msg-bubble");
    if (!bubbleEl) return null;
    const streamContent = bubbleEl.querySelector(".xy-stream-content");
    const toolLog = bubbleEl.querySelector(".xy-tool-log");
    const existingThinking = bubbleEl.querySelector(".xiaoyuan-thinking");
    if (streamContent) streamContent.remove();
    if (existingThinking) existingThinking.remove();
    if (lastMsg.thinking && this.plugin.settings.showThinking) {
      const detailsEl = bubbleEl.createEl("details", { cls: "xiaoyuan-thinking" });
      detailsEl.createEl("summary", { text: "\u{1F914} \u601D\u8003\u8FC7\u7A0B" });
      const tc = detailsEl.createDiv({ cls: "xiaoyuan-thinking-content" });
      tc.innerHTML = renderMarkdown(lastMsg.thinking.trim());
    }
    const renderedHTML = renderMarkdown(lastMsg.content.trim());
    if (toolLog) {
      toolLog.insertAdjacentHTML("beforebegin", renderedHTML);
    } else {
      bubbleEl.insertAdjacentHTML("beforeend", renderedHTML);
    }
    if (!msgEl.querySelector(".xiaoyuan-msg-actions")) {
      const actionsEl = msgEl.createDiv({ cls: "xiaoyuan-msg-actions" });
      const copyBtn = actionsEl.createSpan({ cls: "xiaoyuan-msg-action" });
      copyBtn.textContent = "\u{1F4CB}";
      (0, import_obsidian2.setTooltip)(copyBtn, "\u590D\u5236");
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(lastMsg.content);
        new import_obsidian2.Notice("\u5DF2\u590D\u5236");
      });
    }
    setTimeout(() => {
      if (!bubbleEl.isConnected) return;
      window.Prism?.highlightAllUnder(bubbleEl);
      bubbleEl.querySelectorAll("pre").forEach((pre) => {
        if (pre.querySelector(".xy-copy-btn")) return;
        const btn = document.createElement("button");
        btn.className = "xy-copy-btn";
        btn.textContent = "\u590D\u5236";
        pre.style.position = "relative";
        btn.addEventListener("click", () => {
          navigator.clipboard.writeText(pre.textContent || "");
          btn.textContent = "\u5DF2\u590D\u5236";
          setTimeout(() => {
            btn.textContent = "\u590D\u5236";
          }, 2e3);
        });
        pre.appendChild(btn);
      });
    }, 0);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return lastMsg.id;
  }
  renderDiffs(messageId, diffs) {
    const msgEl = this.messagesEl.querySelector(`#${messageId}`);
    if (!msgEl) return;
    const existing = msgEl.querySelector(".xiaoyuan-diffs");
    if (existing) existing.remove();
    const diffsEl = msgEl.createDiv({ cls: "xiaoyuan-diffs" });
    const toggle = diffsEl.createEl("details");
    const summary = toggle.createEl("summary", { cls: "xiaoyuan-diffs-summary" });
    const totalAdd = diffs.reduce((s, d) => s + d.additions, 0);
    const totalDel = diffs.reduce((s, d) => s + d.deletions, 0);
    summary.textContent = `\u{1F4CB} \u6587\u4EF6\u53D8\u66F4\uFF08+${totalAdd}/-${totalDel}\uFF0C${diffs.length} \u4E2A\u6587\u4EF6\uFF09`;
    for (const diff of diffs) {
      const fileEl = toggle.createDiv({ cls: "xiaoyuan-diff-file" });
      const headerEl = fileEl.createDiv({ cls: "xiaoyuan-diff-file-header" });
      headerEl.textContent = `${diff.file} (+${diff.additions}/-${diff.deletions})`;
      const contentEl = fileEl.createDiv({ cls: "xiaoyuan-diff-content" });
      const beforeLines = diff.before.split("\n");
      const afterLines = diff.after.split("\n");
      const maxLen = Math.max(beforeLines.length, afterLines.length);
      const table = contentEl.createEl("table", { cls: "xiaoyuan-diff-table" });
      for (let i = 0; i < maxLen; i++) {
        const row = table.createEl("tr");
        row.createEl("td", { text: String(i + 1) });
        row.createEl("td", { text: String(i + 1) });
        const b = beforeLines[i] ?? "";
        const a = afterLines[i] ?? "";
        if (b === a) {
          row.classList.add("diff-context");
          row.createEl("td", { text: b });
        } else if (b && !a) {
          row.classList.add("diff-removed");
          row.createEl("td", { text: b });
        } else if (!b && a) {
          row.classList.add("diff-added");
          row.createEl("td", { text: a });
        } else {
          row.classList.add("diff-changed");
          const cell = row.createEl("td");
          cell.createEl("span", { text: b, cls: "diff-removed" });
          cell.createEl("br");
          cell.createEl("span", { text: a, cls: "diff-added" });
        }
      }
    }
  }
  // ─── Session management ──────────────────────────────────────────
  async loadSessions() {
    try {
      const path2 = getChatHistoryPath(this.plugin.settings.chatHistoryPath);
      await ensureChatHistoryFolder(this.app.vault, path2);
      const meta = await loadSessionsMeta(this.plugin);
      this.sessions = await scanChatHistoryFolder(this.app.vault, path2);
      this.sessions.sort((a, b) => b.updatedAt - a.updatedAt);
      this.currentSessionId = meta.currentSessionId;
      if (this.sessions.length === 0) {
        const oldMessages = migrateOldData(meta);
        if (oldMessages && oldMessages.length > 0) {
          const newSession = {
            id: "session-" + Date.now(),
            title: oldMessages[0]?.content?.slice(0, 30) || "\u5386\u53F2\u5BF9\u8BDD",
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          this.sessions.push(newSession);
          this.messages = [...oldMessages];
          await saveSessionToFile(this.app.vault, path2, newSession.id, newSession, oldMessages);
        }
      }
    } catch (e) {
      console.warn("\u52A0\u8F7D\u4F1A\u8BDD\u5931\u8D25:", e);
    }
    if (this.sessions.length === 0) {
      await this.createNewSession();
    } else {
      const target = this.sessions.find((s) => s.id === this.currentSessionId) || this.sessions[0];
      this.currentSessionId = target.id;
      await this.loadSession(target);
      await saveSessionsMeta(this.plugin, this.sessions, this.currentSessionId);
    }
    this.updateSessionSelector();
  }
  async loadSession(session) {
    const path2 = getChatHistoryPath(this.plugin.settings.chatHistoryPath);
    this.messages = await loadSessionFromFile(this.app.vault, path2, session.id);
    this.msgIdCounter = this.messages.length;
    this.messagesEl.empty();
    if (this.messages.length === 0) {
      this.addWelcomeMessage();
      return;
    }
    for (const msg of this.messages) {
      this.messagesEl.appendChild(this.renderMessageEl(msg.id, msg.role, msg.content, false));
    }
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }
  sessionTitleFromMessages() {
    const firstUser = this.messages.find((m) => m.role === "user");
    const text = firstUser?.content || this.messages[0]?.content || "\u65B0\u5BF9\u8BDD";
    const cleaned = text.replace(/^#+\s*/, "").replace(/[*_`~]/g, "").trim();
    return cleaned.length > 30 ? cleaned.slice(0, 30) + "\u2026" : cleaned;
  }
  async saveCurrentSession() {
    const path2 = getChatHistoryPath(this.plugin.settings.chatHistoryPath);
    const session = this.sessions.find((s) => s.id === this.currentSessionId);
    if (session) {
      session.updatedAt = Date.now();
      if (session.title === "\u65B0\u5BF9\u8BDD" || session.title === "") {
        session.title = this.messages.length > 0 ? this.sessionTitleFromMessages() : "\u65B0\u5BF9\u8BDD";
        this.updateSessionSelector();
      }
    }
    await saveSessionToFile(this.app.vault, path2, this.currentSessionId, session, this.messages);
    await saveSessionsMeta(this.plugin, this.sessions, this.currentSessionId);
  }
  updateSessionTitle() {
    const session = this.sessions.find((s) => s.id === this.currentSessionId);
    if (session && (session.title === "\u65B0\u5BF9\u8BDD" || session.title === "") && this.messages.length > 0) {
      session.title = this.sessionTitleFromMessages();
      session.updatedAt = Date.now();
      this.updateSessionSelector();
    }
  }
  async createNewSession() {
    const newSession = {
      id: "session-" + Date.now(),
      title: "\u65B0\u5BF9\u8BDD",
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.sessions.unshift(newSession);
    this.currentSessionId = newSession.id;
    this.messages = [];
    this.msgIdCounter = 0;
    this.messagesEl.empty();
    this.addWelcomeMessage();
    this.updateSessionSelector();
  }
  async switchSession(sessionId) {
    await this.saveCurrentSession();
    const session = this.sessions.find((s) => s.id === sessionId);
    if (session) {
      this.currentSessionId = sessionId;
      await this.loadSession(session);
      this.updateSessionSelector();
      await saveSessionsMeta(this.plugin, this.sessions, this.currentSessionId);
      this.addSystemMessage(`\u5DF2\u5207\u6362\u5230\u4F1A\u8BDD: ${session.title}`);
    }
  }
  async deleteSession(sessionId) {
    if (this.sessions.length <= 1) {
      new import_obsidian2.Notice("\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u5BF9\u8BDD");
      return;
    }
    const idx = this.sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return;
    this.sessions.splice(idx, 1);
    await deleteSessionFile(this.app.vault, getChatHistoryPath(this.plugin.settings.chatHistoryPath), sessionId);
    if (this.currentSessionId === sessionId) {
      const next = this.sessions[0];
      this.currentSessionId = next.id;
      await this.loadSession(next);
    }
    await saveSessionsMeta(this.plugin, this.sessions, this.currentSessionId);
    this.updateSessionSelector();
    new import_obsidian2.Notice("\u5DF2\u5220\u9664");
  }
  async showSessionDropdown(e) {
    if (document.querySelector(".xy-popup")) {
      document.querySelectorAll(".xy-popup").forEach((el) => el.remove());
      return;
    }
    await this.saveCurrentSession();
    const path2 = getChatHistoryPath(this.plugin.settings.chatHistoryPath);
    const diskSessions = await scanChatHistoryFolder(this.app.vault, path2);
    const diskIds = new Set(diskSessions.map((s) => s.id));
    const unsaved = this.sessions.filter((s) => !diskIds.has(s.id));
    this.sessions = [...diskSessions, ...unsaved];
    if (!this.sessions.find((s) => s.id === this.currentSessionId)) {
      if (this.sessions.length > 0) {
        this.currentSessionId = this.sessions[0].id;
        await this.loadSession(this.sessions[0]);
      } else {
        await this.createNewSession();
      }
      this.updateSessionSelector();
    }
    await saveSessionsMeta(this.plugin, this.sessions, this.currentSessionId);
    const headerEl = this.viewContainer.querySelector(".xiaoyuan-chat-header");
    showPopup(headerEl, (popup) => {
      const searchInput = popup.createEl("input", { cls: "xy-popup-search", type: "text", placeholder: "\u641C\u7D22\u4F1A\u8BDD..." });
      const listEl = popup.createDiv({ cls: "xy-popup-session-list" });
      for (const session of this.sessions) {
        const item = listEl.createDiv({ cls: "xy-popup-item" });
        const checkEl = item.createSpan({ cls: "xy-popup-check" });
        checkEl.textContent = session.id === this.currentSessionId ? "\u2713" : "";
        const titleEl = item.createSpan({ cls: "xy-popup-label" });
        titleEl.textContent = session.title;
        const startRename = (ev) => {
          ev.stopPropagation();
          const popupEl = titleEl.closest(".xy-popup");
          const origWidth = popupEl ? popupEl.style.width : "";
          if (popupEl) popupEl.style.width = "auto";
          const input = document.createElement("input");
          input.type = "text";
          input.value = session.title;
          input.style.cssText = "flex:1;padding:2px 4px;font-size:inherit;background:transparent;border:1px solid var(--background-modifier-border);border-radius:4px;color:var(--text-normal);";
          const finish = (save) => {
            if (popupEl) popupEl.style.width = origWidth;
            if (save) {
              const newTitle = input.value.trim() || session.title;
              if (newTitle !== session.title) {
                session.title = newTitle;
                this.updateSessionSelector();
                saveSessionsMeta(this.plugin, this.sessions, this.currentSessionId);
              }
            }
            const span = createSpan({ cls: "xy-popup-label" });
            span.textContent = session.title;
            input.replaceWith(span);
          };
          input.addEventListener("keydown", (e2) => {
            if (e2.key === "Enter") {
              e2.preventDefault();
              finish(true);
            } else if (e2.key === "Escape") {
              finish(false);
            }
          });
          input.addEventListener("blur", () => finish(true));
          input.addEventListener("click", (e2) => e2.stopPropagation());
          titleEl.replaceWith(input);
          input.focus();
          input.select();
        };
        const suffix = item.createSpan({ cls: "xy-popup-suffix" });
        const renameBtn = suffix.createSpan({ cls: "xy-popup-suffix-btn" });
        renameBtn.textContent = "\u270E";
        renameBtn.style.fontSize = "12px";
        (0, import_obsidian2.setTooltip)(renameBtn, "\u91CD\u547D\u540D");
        renameBtn.addEventListener("click", startRename);
        const deleteBtn = suffix.createSpan({ cls: "xy-popup-suffix-btn" });
        deleteBtn.classList.add("danger");
        deleteBtn.textContent = "\xD7";
        deleteBtn.style.fontSize = "16px";
        (0, import_obsidian2.setTooltip)(deleteBtn, "\u5220\u9664\u6B64\u5BF9\u8BDD");
        deleteBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          this.deleteSession(session.id);
          popup.remove();
        });
        item.addEventListener("click", () => {
          this.switchSession(session.id);
          popup.remove();
        });
      }
      searchInput.addEventListener("input", () => {
        const q = searchInput.value.toLowerCase();
        Array.from(listEl.children).forEach((child) => {
          const el = child;
          const label = el.querySelector(".xy-popup-label");
          const match = !q || (label?.textContent || "").toLowerCase().includes(q);
          el.style.display = match ? "" : "none";
        });
      });
      setTimeout(() => searchInput.focus(), 50);
    }, { fullWidth: true, maxHeight: "300px" });
  }
  updateSessionSelector() {
    const current = this.sessions.find((s) => s.id === this.currentSessionId);
    if (current && this.sessionSelector) {
      this.sessionSelector.textContent = current.title;
    }
  }
  undoMessage(id) {
    const idx = this.messages.findIndex((m) => m.id === id);
    if (idx === -1) return;
    const content = this.messages[idx].content;
    this.messages = this.messages.slice(0, idx);
    const msgEls = this.messagesEl.querySelectorAll(".xiaoyuan-msg");
    for (let i = msgEls.length - 1; i >= idx; i--) msgEls[i].remove();
    this.inputEl.value = content;
    this.inputEl.focus();
    this.saveCurrentSession();
  }
  // ─── Attachments ───────────────────────────────────────────────
  pickFiles() {
    const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,.pdf,.txt,.md,.csv,.json,.yaml,.yml,.xml";
    input.addEventListener("change", async () => {
      const files = Array.from(input.files || []);
      for (const file of files) {
        if (file.size > MAX_ATTACHMENT_SIZE) {
          new import_obsidian2.Notice(`\u6587\u4EF6\u8FC7\u5927: ${file.name} (\u6700\u5927 10MB)`);
          continue;
        }
        try {
          const data = await this.readFileAsBase64(file);
          this.attachments.push({ name: file.name, type: file.type || "application/octet-stream", data, size: file.size });
        } catch {
        }
      }
      this.renderAttachments();
    });
    input.click();
  }
  readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  renderAttachments() {
    this.attachPreviewEl.empty();
    if (this.attachments.length === 0) {
      this.attachPreviewEl.style.display = "none";
      return;
    }
    this.attachPreviewEl.style.display = "flex";
    for (let i = 0; i < this.attachments.length; i++) {
      const att = this.attachments[i];
      const chip = this.attachPreviewEl.createDiv({ cls: "xiaoyuan-attach-chip" });
      chip.textContent = att.name.length > 20 ? att.name.slice(0, 17) + "..." : att.name;
      const removeBtn = chip.createSpan({ text: " \xD7" });
      removeBtn.style.cursor = "pointer";
      removeBtn.addEventListener("click", () => {
        this.attachments.splice(i, 1);
        this.renderAttachments();
      });
    }
  }
  // ─── Popup helpers ───────────────────────────────────────────────
  // ─── UI helpers ──────────────────────────────────────────────────
  setProcessingState(processing) {
    if (processing) {
      (0, import_obsidian2.setIcon)(this.sendBtn, "circle-stop");
      (0, import_obsidian2.setTooltip)(this.sendBtn, "\u505C\u6B62");
      this.sendBtn.style.color = "var(--color-red)";
    } else {
      (0, import_obsidian2.setIcon)(this.sendBtn, "circle-arrow-right");
      (0, import_obsidian2.setTooltip)(this.sendBtn, "\u53D1\u9001");
      this.sendBtn.style.color = "";
    }
    this.inputEl.disabled = processing;
  }
};

// src/settings.ts
var import_obsidian3 = require("obsidian");
var XiaoyuanAISettingTab = class extends import_obsidian3.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.activeTab = "general";
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    this.buildModeSelector(containerEl);
    this.buildStatusCard(containerEl);
    this.buildTabBar(containerEl);
    this.buildTabContents(containerEl);
  }
  // ─── helpers ─────────────────────────────────────────────────────
  s() {
    return this.plugin.settings;
  }
  decorateSetting(setting, iconName) {
    const nameEl = setting.nameEl;
    if (!nameEl) return setting;
    const settingEl = setting.settingEl;
    settingEl?.addClass("xy-setting-with-icon");
    nameEl.addClass("xy-setting-name-with-icon");
    const icon = document.createElement("span");
    icon.addClass("xy-setting-icon");
    (0, import_obsidian3.setIcon)(icon, iconName);
    nameEl.prepend(icon);
    return setting;
  }
  addStatusRow(container, iconName, label, value) {
    const row = container.createDiv({ cls: "xy-settings-status-row" });
    const icon = row.createSpan({ cls: "xy-settings-status-icon" });
    (0, import_obsidian3.setIcon)(icon, iconName);
    row.createSpan({ cls: "xy-settings-status-label", text: label });
    row.createSpan({ cls: "xy-settings-status-value", text: value });
  }
  // ─── ① Mode Selector ─────────────────────────────────────────────
  buildModeSelector(container) {
    const s = this.s();
    this.decorateSetting(new import_obsidian3.Setting(container).setName("\u667A\u80FD\u52A9\u7406\u6A21\u5F0F").setDesc(s.execMode === "cli" ? "\u6240\u6709\u64CD\u4F5C\u901A\u8FC7 opencode run \u6267\u884C\uFF0C\u9002\u5408\u672C\u5730\u5F00\u53D1\u9879\u76EE" : "\u6240\u6709\u64CD\u4F5C\u76F4\u63A5\u8C03\u7528 OpenAI \u517C\u5BB9 API\uFF0C\u9002\u5408\u7EAF\u5BF9\u8BDD\u573A\u666F").addDropdown((dd) => {
      dd.addOption("cli", "CLI \u6A21\u5F0F");
      dd.addOption("api", "API \u6A21\u5F0F");
      dd.setValue(s.execMode);
      dd.onChange(async (val) => {
        s.execMode = val;
        await this.plugin.saveSettings();
        const leaf = this.app.workspace.getLeavesOfType("xiaoyuan-chat-view").first();
        if (leaf?.view && "rebuildToolbar" in leaf.view) {
          leaf.view.rebuildToolbar();
        }
        this.display();
      });
    }), "bot");
  }
  // ─── ② Status Card ───────────────────────────────────────────────
  async refreshStatusCard() {
    const card = this.containerEl.querySelector(".xy-settings-status");
    if (!card) return;
    const s = this.s();
    try {
      const { checkOpenCodeStatus: checkOpenCodeStatus2, ensureOpenCodeServer: ensureOpenCodeServer2 } = await Promise.resolve().then(() => (init_ai(), ai_exports));
      const vaultDir = (await Promise.resolve().then(() => (init_server(), server_exports))).getVaultBasePath(this.app.vault);
      if (s.execMode === "cli") {
        let ok = false;
        const status = await checkOpenCodeStatus2(s.opencode.cliPath, vaultDir, s.opencode.port, s.opencode.hostname);
        if (status.ok) {
          ok = true;
        } else if (s.opencode.autoStart) {
          try {
            await ensureOpenCodeServer2(s.opencode.cliPath, s.opencode.hostname, s.opencode.port, vaultDir, true);
            ok = true;
          } catch {
          }
        }
        this.updateRow(card, 0, ok ? "\u5DF2\u8FDE\u63A5" : "\u672A\u8FDE\u63A5");
      } else {
        const active = this.activeProvider();
        if (active && active.baseUrl && active.apiKey) {
          this.updateRow(card, 0, "\u5DF2\u8FDE\u63A5");
        } else {
          this.updateRow(card, 0, "\u672A\u914D\u7F6E");
        }
      }
      this.updateRow(card, 1, s.execMode === "cli" ? s.opencode.model || "\u672A\u9009\u62E9" : this.activeProvider()?.model || "\u672A\u9009\u62E9");
      this.updateRow(card, 2, s.proxyEnabled ? s.proxyUrl : "\u5DF2\u5173\u95ED");
    } catch {
      this.updateRow(card, 0, "\u68C0\u6D4B\u5931\u8D25");
    }
  }
  updateRow(card, index, value) {
    const rows = card.querySelectorAll(".xy-settings-status-row");
    if (rows[index]) {
      const valEl = rows[index].querySelector(".xy-settings-status-value");
      if (valEl) valEl.textContent = value;
    }
  }
  activeProvider() {
    const s = this.s();
    if (s.activeApiProviderId) return s.apiProviders.find((p) => p.id === s.activeApiProviderId);
    return s.apiProviders[0];
  }
  buildStatusCard(container) {
    const s = this.s();
    const card = container.createDiv({ cls: "xy-settings-status" });
    this.addStatusRow(card, "activity", "\u8FDE\u63A5\u72B6\u6001", "\u68C0\u6D4B\u4E2D...");
    this.addStatusRow(card, "box", "\u5F53\u524D\u6A21\u578B", s.execMode === "cli" ? s.opencode.model || "\u672A\u9009\u62E9" : this.activeProvider()?.model || "\u672A\u9009\u62E9");
    this.addStatusRow(card, "waypoints", "\u4EE3\u7406", s.proxyEnabled ? s.proxyUrl : "\u5DF2\u5173\u95ED");
    const actions = card.createDiv({ cls: "xy-settings-status-actions" });
    const refreshBtn = actions.createEl("button", { cls: "xy-status-btn", text: "\u5237\u65B0" });
    refreshBtn.addEventListener("click", async () => {
      await this.refreshStatusCard();
      if (s.execMode === "cli") {
        const { fetchOpenCodeModelsFromCLI: fetchOpenCodeModelsFromCLI2, fetchOpenCodeAgents: fetchOpenCodeAgents2 } = await Promise.resolve().then(() => (init_ai(), ai_exports));
        const { getVaultBasePath: getVaultBasePath2 } = await Promise.resolve().then(() => (init_server(), server_exports));
        const vaultDir = getVaultBasePath2(this.app.vault);
        try {
          const result = await fetchOpenCodeModelsFromCLI2(s.opencode.cliPath, vaultDir, s.opencode.port);
          s.opencodeModels = result.models.map((m) => ({ label: m.displayName, value: m.id }));
          s.opencodeModelCaps = result.caps;
          if (result.defaultModel && !s.opencode.model) {
            s.opencode.model = result.defaultModel;
          }
          s.opencodeAgents = await fetchOpenCodeAgents2(s.opencode.cliPath, vaultDir, s.opencode.port);
          await this.plugin.saveSettings();
        } catch {
        }
      }
      this.display();
    });
    void this.refreshStatusCard();
  }
  // ─── ③ Tab Bar ───────────────────────────────────────────────────
  buildTabBar(container) {
    const tabs = [
      { id: "general", icon: "settings", label: "\u901A\u7528" },
      { id: "cli", icon: "terminal-square", label: "CLI \u8BBE\u7F6E" },
      { id: "api", icon: "key-round", label: "API \u8BBE\u7F6E" }
    ];
    const bar = container.createDiv({ cls: "xy-settings-tabs" });
    for (const t of tabs) {
      const btn = bar.createEl("button", {
        cls: `xy-settings-tab ${this.activeTab === t.id ? "is-active" : ""}`,
        attr: { type: "button" }
      });
      const icon = btn.createSpan({ cls: "xy-settings-tab-icon" });
      (0, import_obsidian3.setIcon)(icon, t.icon);
      btn.createSpan({ text: t.label });
      btn.onclick = () => {
        this.activeTab = t.id;
        this.display();
      };
    }
  }
  // ─── ④ Tab Contents ──────────────────────────────────────────────
  buildTabContents(container) {
    switch (this.activeTab) {
      case "cli":
        this.buildCLITab(container);
        break;
      case "api":
        this.buildAPITab(container);
        break;
      case "general":
        this.buildGeneralTab(container);
        break;
    }
  }
  // ─── CLI 设置 ─────────────────────────────────────────────────────
  buildCLITab(container) {
    const s = this.s();
    const pathSetting = this.decorateSetting(new import_obsidian3.Setting(container).setName("OpenCode \u8DEF\u5F84").setDesc("\u53EF\u6267\u884C\u6587\u4EF6\u8DEF\u5F84\u3002\u5168\u5C40\u5B89\u88C5\u586B opencode\uFF0C\u975E\u5168\u5C40\u5199\u5B8C\u6574\u7EDD\u5BF9\u8DEF\u5F84\u3002").addText(
      (text) => text.setPlaceholder("opencode").setValue(s.opencode.cliPath).onChange(async (val) => {
        s.opencode.cliPath = val;
        await this.plugin.saveSettings();
      })
    ), "terminal-square");
    (async () => {
      try {
        const { resolveOpenCodePath: resolveOpenCodePath2 } = await Promise.resolve().then(() => (init_ai(), ai_exports));
        const detected = await resolveOpenCodePath2(s.opencode.cliPath);
        if (detected && detected !== s.opencode.cliPath) pathSetting.setDesc(`\u5DF2\u68C0\u6D4B\u5230: ${detected}`);
      } catch {
      }
    })();
    this.decorateSetting(new import_obsidian3.Setting(container).setName("\u81EA\u52A8\u542F\u52A8 OpenCode Server").setDesc("\u6253\u5F00 Obsidian \u6216\u68C0\u6D4B\u5230\u670D\u52A1\u672A\u8FD0\u884C\u65F6\u81EA\u52A8\u542F\u52A8 opencode serve").addToggle((t) => {
      t.setValue(s.opencode.autoStart);
      t.onChange(async (val) => {
        s.opencode.autoStart = val;
        await this.plugin.saveSettings();
        if (val && s.execMode === "cli") {
          const { ensureOpenCodeServer: ensureOpenCodeServer2 } = await Promise.resolve().then(() => (init_ai(), ai_exports));
          const { getVaultBasePath: getVaultBasePath2 } = await Promise.resolve().then(() => (init_server(), server_exports));
          ensureOpenCodeServer2(s.opencode.cliPath, s.opencode.hostname, s.opencode.port, getVaultBasePath2(this.app.vault), true).catch(() => {
          });
        }
      });
    }), "play");
    this.decorateSetting(new import_obsidian3.Setting(container).setName("Host").setDesc("opencode \u670D\u52A1\u5668\u4E3B\u673A\u5730\u5740").addText(
      (text) => text.setPlaceholder("127.0.0.1").setValue(s.opencode.hostname).onChange(async (val) => {
        s.opencode.hostname = val;
        await this.plugin.saveSettings();
      })
    ), "globe");
    this.decorateSetting(new import_obsidian3.Setting(container).setName("Port").setDesc("opencode \u670D\u52A1\u5668\u7AEF\u53E3").addText(
      (text) => text.setPlaceholder("16226").setValue(String(s.opencode.port)).onChange(async (val) => {
        const n = parseInt(val);
        if (n > 0) {
          s.opencode.port = n;
          await this.plugin.saveSettings();
        }
      })
    ), "plug");
    const modelSetting = this.decorateSetting(new import_obsidian3.Setting(container).setName("\u6A21\u578B").setDesc("\u70B9\u51FB\u9009\u62E9\u6A21\u578B\uFF0C\u6216\u70B9 \u21BB \u4ECE opencode \u540C\u6B65").addText((text) => {
      text.setPlaceholder("\u70B9\u51FB\u9009\u62E9\u6216\u8F93\u5165 providerID/modelID").setValue(s.opencode.model);
      text.inputEl.addClass("xy-model-picker-trigger");
      text.inputEl.readOnly = false;
      text.onChange(async (val) => {
        s.opencode.model = val;
        await this.plugin.saveSettings();
      });
      text.inputEl.addEventListener("click", (e) => {
        if (s.opencodeModels && s.opencodeModels.length > 0) {
          e.preventDefault();
          this.showModelPicker(text.inputEl, s.opencodeModels, (val) => {
            s.opencode.model = val;
            this.plugin.saveSettings().then(() => this.display());
          });
        }
      });
    }).addButton((btn) => {
      btn.setButtonText("\u21BB");
      btn.setTooltip("\u4ECE opencode \u540C\u6B65\u6A21\u578B\u5217\u8868");
      btn.onClick(async () => {
        const { fetchOpenCodeModelsFromCLI: fetchOpenCodeModelsFromCLI2 } = await Promise.resolve().then(() => (init_ai(), ai_exports));
        const { getVaultBasePath: getVaultBasePath2 } = await Promise.resolve().then(() => (init_server(), server_exports));
        try {
          const result = await fetchOpenCodeModelsFromCLI2(s.opencode.cliPath, getVaultBasePath2(this.app.vault), s.opencode.port);
          s.opencodeModels = result.models.map((m) => ({ label: m.displayName, value: m.id }));
          s.opencodeModelCaps = result.caps;
          if (result.defaultModel && !s.opencode.model) {
            s.opencode.model = result.defaultModel;
          }
          const { fetchOpenCodeAgents: fetchOpenCodeAgents2 } = await Promise.resolve().then(() => (init_ai(), ai_exports));
          s.opencodeAgents = await fetchOpenCodeAgents2(s.opencode.cliPath, getVaultBasePath2(this.app.vault), s.opencode.port);
          await this.plugin.saveSettings();
          new import_obsidian3.Notice(result.models.length === 0 ? "\u672A\u627E\u5230\u6A21\u578B" : `\u5DF2\u540C\u6B65 ${result.models.length} \u4E2A\u6A21\u578B`);
          this.display();
        } catch (err) {
          new import_obsidian3.Notice(`\u540C\u6B65\u5931\u8D25\uFF1A${err.message}`);
        }
      });
    }), "box");
    {
      const caps = s.opencodeModelCaps?.[s.opencode.model];
      if (caps) {
        const inputFlags = [];
        for (const [k, v] of Object.entries({ \u6587\u672C: caps.text, \u56FE\u50CF: caps.image, PDF: caps.pdf, \u97F3\u9891: caps.audio, \u89C6\u9891: caps.video })) {
          inputFlags.push(v ? `${k}\u2713` : `${k}\xD7`);
        }
        modelSetting.descEl.createDiv({ text: `\u8F93\u5165: ${inputFlags.join(" ")}` });
        const featFlags = [];
        for (const [k, v] of Object.entries({ \u63A8\u7406: caps.reasoning, \u5DE5\u5177: caps.toolcall, \u9644\u4EF6: caps.attachment, \u6E29\u5EA6: caps.temperature })) {
          featFlags.push(v ? `${k}\u2713` : `${k}\xD7`);
        }
        modelSetting.descEl.createDiv({ text: `\u529F\u80FD: ${featFlags.join(" ")}` });
      }
    }
    {
      const agentItems = s.opencodeAgents || [];
      const fallbackItems = !agentItems.length ? [{ name: "build" }, { name: "plan" }] : [];
      const allItems = agentItems.length ? agentItems : fallbackItems;
      const currentAgent = s.opencode.agent;
      const inList = allItems.some((a) => a.name === currentAgent);
      this.decorateSetting(new import_obsidian3.Setting(container).setName("Agent").setDesc(currentAgent ? `\u5F53\u524D: ${currentAgent}${allItems.find((a) => a.name === currentAgent)?.description ? ` \u2014 ${allItems.find((a) => a.name === currentAgent).description}` : ""}` : "\u9009\u62E9 agent").addDropdown((dd) => {
        for (const a of allItems) dd.addOption(a.name, a.name);
        dd.setValue(inList ? currentAgent : allItems[0]?.name || "build");
        dd.onChange(async (val) => {
          s.opencode.agent = val;
          await this.plugin.saveSettings();
          this.display();
        });
      }).addButton((btn) => {
        btn.setButtonText("\u21BB");
        btn.setTooltip("\u4ECE opencode \u540C\u6B65 agent \u5217\u8868");
        btn.onClick(async () => {
          try {
            const { fetchOpenCodeAgents: fetchOpenCodeAgents2 } = await Promise.resolve().then(() => (init_ai(), ai_exports));
            const { getVaultBasePath: getVaultBasePath2 } = await Promise.resolve().then(() => (init_server(), server_exports));
            const vaultDir = getVaultBasePath2(this.app.vault);
            const agents = await fetchOpenCodeAgents2(s.opencode.cliPath, vaultDir, s.opencode.port);
            s.opencodeAgents = agents;
            await this.plugin.saveSettings();
            new import_obsidian3.Notice(`\u5DF2\u540C\u6B65 ${agents.length} \u4E2A agent`);
            this.display();
          } catch (err) {
            new import_obsidian3.Notice(`\u540C\u6B65\u5931\u8D25\uFF1A${err.message}`);
          }
        });
      }), "bot");
    }
    this.decorateSetting(new import_obsidian3.Setting(container).setName("\u601D\u8003\u5F3A\u5EA6").setDesc("\u63A7\u5236\u6A21\u578B\u7684\u63A8\u7406\u6DF1\u5EA6").addDropdown((dd) => {
      dd.addOption("none", "none");
      dd.addOption("minimal", "minimal");
      dd.addOption("low", "low");
      dd.addOption("medium", "medium");
      dd.addOption("high", "high");
      dd.addOption("xhigh", "xhigh");
      dd.setValue(s.defaultReasoning);
      dd.onChange(async (val) => {
        s.defaultReasoning = val;
        await this.plugin.saveSettings();
      });
    }), "brain");
    this.decorateSetting(new import_obsidian3.Setting(container).setName("\u6587\u4EF6\u6743\u9650").setDesc('AI \u5BF9\u5DE5\u4F5C\u533A\u6587\u4EF6\u7684\u8BBF\u95EE\u6743\u9650\uFF08\u4EC5"\u5B8C\u5168\u653E\u5F00"\u65F6\u4F20\u9012 --dangerously-skip-permissions\uFF09').addDropdown((dd) => {
      dd.addOption("read-only", "\u53EA\u8BFB");
      dd.addOption("workspace-write", "\u5DE5\u4F5C\u533A\u53EF\u5199");
      dd.addOption("danger-full-access", "\u5B8C\u5168\u653E\u5F00");
      dd.setValue(s.defaultPermission);
      dd.onChange(async (val) => {
        s.defaultPermission = val;
        await this.plugin.saveSettings();
      });
    }), "shield-check");
  }
  // ─── API 设置 ─────────────────────────────────────────────────────
  buildAPITab(container) {
    const s = this.s();
    const providers = s.apiProviders;
    const activeId = s.activeApiProviderId || providers[0]?.id || "";
    for (const provider of providers) {
      const isActive = provider.id === activeId;
      const card = container.createDiv({ cls: `xy-api-provider-row${isActive ? " is-active" : ""}` });
      const head = card.createDiv({ cls: "xy-api-provider-head" });
      const title = head.createDiv({ cls: "xy-api-provider-title" });
      const nameSpan = title.createSpan({ text: provider.name || "\u672A\u547D\u540D" });
      const modelSmall = title.createEl("small", { text: ` \xB7 ${provider.model || "\u672A\u9009\u62E9\u6A21\u578B"}` });
      const updateHeader = () => {
        nameSpan.textContent = provider.name || "\u672A\u547D\u540D";
        modelSmall.textContent = ` \xB7 ${provider.model || "\u672A\u9009\u62E9\u6A21\u578B"}`;
      };
      const headActions = head.createDiv({ cls: "xy-api-provider-actions" });
      if (!isActive) {
        const activateBtn = headActions.createEl("button", { cls: "xy-status-btn", text: "\u542F\u7528" });
        activateBtn.addEventListener("click", async () => {
          s.activeApiProviderId = provider.id;
          await this.plugin.saveSettings();
          this.display();
          const ok = await this.testApiConnection(provider);
          new import_obsidian3.Notice(ok ? `\u2705 \u5DF2\u5207\u6362\u5230: ${provider.name}` : `\u274C \u8FDE\u63A5\u5931\u8D25: ${provider.name}`);
        });
      }
      const testBtn = headActions.createEl("button", { cls: "xy-status-btn", text: "\u8FDE\u63A5\u6D4B\u8BD5" });
      testBtn.addEventListener("click", async () => {
        const ok = await this.testApiConnection(provider);
        new import_obsidian3.Notice(ok ? `\u2705 ${provider.name} \u8FDE\u63A5\u6210\u529F` : `\u274C ${provider.name} \u8FDE\u63A5\u5931\u8D25`);
      });
      const deleteBtn = headActions.createEl("button", { cls: "xy-status-btn", text: "\u5220\u9664" });
      deleteBtn.addEventListener("click", async () => {
        if (providers.length <= 1) {
          new import_obsidian3.Notice("\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A API \u63D0\u4F9B\u8005");
          return;
        }
        s.apiProviders = providers.filter((p) => p.id !== provider.id);
        if (s.activeApiProviderId === provider.id) {
          s.activeApiProviderId = s.apiProviders[0]?.id || "";
        }
        await this.plugin.saveSettings();
        this.display();
      });
      let collapsed = true;
      const content = card.createDiv({ cls: "xy-api-provider-content" });
      content.style.display = "none";
      head.style.cursor = "pointer";
      head.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        collapsed = !collapsed;
        content.style.display = collapsed ? "none" : "";
      });
      this.addProviderText(content, "\u540D\u79F0", provider.name, "\u4F8B\u5982 OpenAI API", async (val) => {
        provider.name = val;
        await this.plugin.saveSettings();
        updateHeader();
      });
      this.addProviderText(content, "Base URL", provider.baseUrl, "https://api.openai.com/v1", async (val) => {
        provider.baseUrl = val;
        await this.plugin.saveSettings();
      });
      this.addProviderText(content, "\u6A21\u578B", provider.model, "gpt-4o", async (val) => {
        provider.model = val;
        await this.plugin.saveSettings();
        updateHeader();
      });
      this.addProviderText(content, "API Key", provider.apiKey, "sk-...", async (val) => {
        provider.apiKey = val;
        await this.plugin.saveSettings();
      }, true);
    }
    const addBtn = container.createDiv({ cls: "xy-settings-status-actions" });
    const newBtn = addBtn.createEl("button", { cls: "xy-status-btn", text: "+ \u65B0\u589E API \u63D0\u4F9B\u8005" });
    newBtn.addEventListener("click", async () => {
      const newId = `provider_${Date.now()}`;
      s.apiProviders.push({ id: newId, name: "\u65B0 API", baseUrl: "", model: "", apiKey: "" });
      await this.plugin.saveSettings();
      this.display();
    });
    container.createEl("hr");
    container.createEl("h3", { text: "API \u53C2\u6570" });
    this.decorateSetting(new import_obsidian3.Setting(container).setName("\u601D\u8003\u5F3A\u5EA6").setDesc("\u63A7\u5236\u6A21\u578B\u7684\u63A8\u7406\u6DF1\u5EA6\uFF08none / low / medium / high\uFF09").addDropdown((dd) => {
      dd.addOption("none", "none");
      dd.addOption("low", "low");
      dd.addOption("medium", "medium");
      dd.addOption("high", "high");
      dd.setValue(s.apiReasoningEffort);
      dd.onChange(async (val) => {
        s.apiReasoningEffort = val;
        await this.plugin.saveSettings();
      });
    }), "brain");
    this.decorateSetting(new import_obsidian3.Setting(container).setName("\u6E29\u5EA6").setDesc("\u6A21\u578B\u8F93\u51FA\u7684\u968F\u673A\u6027\uFF080=\u786E\u5B9A\uFF0C2=\u968F\u673A\uFF09").addSlider(
      (slider) => slider.setLimits(0, 2, 0.1).setValue(s.temperature).onChange(async (val) => {
        s.temperature = val;
        await this.plugin.saveSettings();
      })
    ), "thermometer");
    this.decorateSetting(new import_obsidian3.Setting(container).setName("\u6700\u5927 Token \u6570").addText(
      (text) => text.setPlaceholder("4096").setValue(String(s.maxTokens)).onChange(async (val) => {
        const n = parseInt(val);
        if (n > 0) {
          s.maxTokens = n;
          await this.plugin.saveSettings();
        }
      })
    ), "subtitles");
  }
  addProviderText(container, label, value, placeholder, onChange, password = false) {
    const field = container.createDiv({ cls: "xy-api-provider-field" });
    field.createSpan({ cls: "xy-api-provider-label", text: label });
    const input = field.createEl("input", { cls: "xy-api-provider-input", attr: { placeholder } });
    input.value = value;
    if (password) input.type = "password";
    input.addEventListener("change", () => {
      void onChange(input.value);
    });
  }
  async testApiConnection(provider) {
    if (!provider.baseUrl || !provider.apiKey) return false;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8e3);
      const modelsUrl = provider.baseUrl.replace(/\/+$/, "") + "/models";
      const resp = await fetch(modelsUrl, {
        headers: { Authorization: `Bearer ${provider.apiKey}` },
        signal: controller.signal
      });
      clearTimeout(timer);
      return resp.ok;
    } catch {
      return false;
    }
  }
  // ─── 通用设置 ─────────────────────────────────────────────────────
  buildGeneralTab(container) {
    const s = this.s();
    this.decorateSetting(new import_obsidian3.Setting(container).setName("\u542F\u7528\u672C\u5730\u4EE3\u7406").setDesc("\u53EA\u5F71\u54CD\u63D2\u4EF6\u901A\u8FC7 opencode \u542F\u52A8\u7684\u5B50\u8FDB\u7A0B").addToggle((t) => {
      t.setValue(s.proxyEnabled);
      t.onChange(async (val) => {
        s.proxyEnabled = val;
        await this.plugin.saveSettings();
      });
    }), "waypoints");
    this.decorateSetting(new import_obsidian3.Setting(container).setName("\u4EE3\u7406\u5730\u5740").setDesc("HTTP \u4EE3\u7406\u5730\u5740").addText(
      (text) => text.setPlaceholder("http://127.0.0.1:7890").setValue(s.proxyUrl).onChange(async (val) => {
        s.proxyUrl = val.trim();
        await this.plugin.saveSettings();
      })
    ), "route");
    this.decorateSetting(new import_obsidian3.Setting(container).setName("\u542F\u7528 MCP \u5DE5\u5177").setDesc("\u9ED8\u8BA4\u5173\u95ED\u4EE5\u52A0\u5FEB\u666E\u901A\u804A\u5929\u901F\u5EA6\uFF08\u5F53\u524D\u672A\u5B9E\u73B0\uFF09").addToggle((t) => {
      t.setValue(s.mcpEnabled);
      t.onChange(async (val) => {
        s.mcpEnabled = val;
        await this.plugin.saveSettings();
      });
    }), "blocks");
    this.decorateSetting(new import_obsidian3.Setting(container).setName("\u542F\u52A8\u65F6\u81EA\u52A8\u6253\u5F00\u4FA7\u680F").addToggle((t) => {
      t.setValue(s.autoOpen);
      t.onChange(async (val) => {
        s.autoOpen = val;
        await this.plugin.saveSettings();
      });
    }), "panel-right-open");
    container.createEl("hr");
    container.createEl("h3", { text: "\u804A\u5929\u8BBE\u7F6E" });
    this.decorateSetting(new import_obsidian3.Setting(container).setName("\u804A\u5929\u5386\u53F2\u5B58\u50A8\u8DEF\u5F84").setDesc("\u804A\u5929\u5386\u53F2 Markdown \u6587\u4EF6\u7684\u5B58\u50A8\u76EE\u5F55").addText(
      (text) => text.setPlaceholder(".chatHistory").setValue(s.chatHistoryPath).onChange(async (val) => {
        if (val.trim()) {
          s.chatHistoryPath = val.trim();
          await this.plugin.saveSettings();
        }
      })
    ), "folder");
    this.decorateSetting(new import_obsidian3.Setting(container).setName("\u804A\u5929\u9762\u677F\u4F4D\u7F6E").addDropdown((dd) => {
      dd.addOption("left", "\u5DE6\u4FA7");
      dd.addOption("right", "\u53F3\u4FA7");
      dd.setValue(s.chatViewType);
      dd.onChange(async (val) => {
        s.chatViewType = val;
        await this.plugin.saveSettings();
      });
    }), "layout-dashboard");
    this.decorateSetting(new import_obsidian3.Setting(container).setName("Diff \u9884\u89C8").setDesc("\u5728 AI \u56DE\u590D\u4E2D\u663E\u793A\u6587\u4EF6\u53D8\u66F4\u9884\u89C8").addToggle((t) => {
      t.setValue(s.showDiffPreview);
      t.onChange(async (val) => {
        s.showDiffPreview = val;
        await this.plugin.saveSettings();
      });
    }), "file-diff");
    this.decorateSetting(new import_obsidian3.Setting(container).setName("\u663E\u793A\u601D\u8003\u8FC7\u7A0B").setDesc("\u5728 AI \u56DE\u590D\u4E2D\u4EE5\u6298\u53E0\u5757\u663E\u793A\u6A21\u578B\u7684\u601D\u8003\u8FC7\u7A0B").addToggle((t) => {
      t.setValue(s.showThinking);
      t.onChange(async (val) => {
        s.showThinking = val;
        await this.plugin.saveSettings();
      });
    }), "brain");
    container.createEl("hr");
    container.createEl("h3", { text: "\u7CFB\u7EDF\u63D0\u793A\u8BCD" });
    this.decorateSetting(new import_obsidian3.Setting(container).setName("\u663E\u793A\u6587\u4EF6\u4E0A\u4E0B\u6587").setDesc("\u5728\u804A\u5929\u5DE5\u5177\u680F\u663E\u793A\u5F53\u524D\u7B14\u8BB0\u7684\u4E0A\u4E0B\u6587\u4FE1\u606F").addToggle((t) => {
      t.setValue(s.showContext);
      t.onChange(async (val) => {
        s.showContext = val;
        await this.plugin.saveSettings();
        this.display();
      });
    }), "file-text");
    this.decorateSetting(new import_obsidian3.Setting(container).setName("\u7CFB\u7EDF\u63D0\u793A\u8BCD").addTextArea((text) => {
      text.setValue(s.systemPrompt);
      text.inputEl.rows = 4;
      text.onChange(async (val) => {
        s.systemPrompt = val;
        await this.plugin.saveSettings();
      });
    }), "message-square");
  }
  showModelPicker(trigger, models, onSelect) {
    showPopup(trigger, (popup) => {
      const s = this.plugin.settings;
      const currentModel = s.opencode.model;
      const syncItem = popup.createDiv({ cls: "xy-popup-item" });
      syncItem.createSpan({ cls: "xy-popup-label" }).textContent = "\u27F3 \u540C\u6B65\u6A21\u578B\u5217\u8868";
      syncItem.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        popup.remove();
        try {
          const { fetchOpenCodeModelsFromCLI: fetchOpenCodeModelsFromCLI2, ensureOpenCodeServer: ensureOpenCodeServer2 } = await Promise.resolve().then(() => (init_ai(), ai_exports));
          const vaultDir = (await Promise.resolve().then(() => (init_server(), server_exports))).getVaultBasePath(this.app.vault);
          await ensureOpenCodeServer2(s.opencode.cliPath, s.opencode.hostname, s.opencode.port, vaultDir, true);
          const result = await fetchOpenCodeModelsFromCLI2(s.opencode.cliPath, vaultDir, s.opencode.port);
          s.opencodeModels = result.models.map((m) => ({ label: m.id, value: m.id }));
          s.opencodeModelCaps = result.caps;
          if (!s.opencode.model || !result.models.some((m) => m.id === s.opencode.model)) {
            s.opencode.model = result.defaultModel || result.models[0]?.id || "";
          }
          await this.plugin.saveSettings();
          new import_obsidian3.Notice(`\u5DF2\u540C\u6B65 ${result.models.length} \u4E2A\u6A21\u578B`);
        } catch (err) {
          new import_obsidian3.Notice(`\u540C\u6B65\u5931\u8D25: ${err.message}`);
        }
      });
      const groups = /* @__PURE__ */ new Map();
      for (const m of models) {
        const provider = m.value.includes("/") ? m.value.split("/")[0] : "\u5176\u4ED6";
        if (!groups.has(provider)) groups.set(provider, []);
        groups.get(provider).push(m);
      }
      for (const [providerName, items] of groups) {
        popup.createDiv({ cls: "xy-popup-separator" });
        const groupTitle = popup.createDiv({ cls: "xy-popup-group-title" });
        const arrow = groupTitle.createSpan({ cls: "xy-popup-arrow" });
        arrow.textContent = "\u25B6";
        groupTitle.createSpan({ cls: "xy-popup-label" }).textContent = providerName;
        const children = popup.createDiv({ cls: "xy-popup-group-children" });
        children.classList.add("is-collapsed");
        for (const m of items) {
          addPopupItem(children, m.label, m.value === currentModel, () => {
            onSelect(m.value);
          });
        }
        groupTitle.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const open = arrow.textContent === "\u25BC";
          arrow.textContent = open ? "\u25B6" : "\u25BC";
          children.classList.toggle("is-collapsed", open);
        });
      }
    }, { direction: "down", maxHeight: "50vh" });
  }
};

// src/modals.ts
var import_obsidian4 = require("obsidian");
init_ai();
function ensureApiUrl(baseUrl) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : trimmed + "/chat/completions";
}
function makeDraggable(handle, modalEl) {
  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    const rect = modalEl.getBoundingClientRect();
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;
    modalEl.style.position = "fixed";
    modalEl.style.top = `${e.clientY - dy}px`;
    modalEl.style.left = `${e.clientX - dx}px`;
    modalEl.style.margin = "0";
    const move = (ev) => {
      modalEl.style.top = `${ev.clientY - dy}px`;
      modalEl.style.left = `${ev.clientX - dx}px`;
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  });
}
var TextOperationModal = class extends import_obsidian4.Modal {
  constructor(app, plugin, operation, inputText) {
    super(app);
    this.plugin = plugin;
    this.operation = operation;
    this.inputText = inputText;
  }
  onOpen() {
    const { contentEl, modalEl } = this;
    contentEl.empty();
    contentEl.classList.add("xiaoyuan-modal-container");
    const headerRow = contentEl.createDiv({ cls: "xiaoyuan-modal-header" });
    this.titleEl = headerRow.createEl("h3", { text: `AI ${OPERATION_LABELS[this.operation] || this.operation}` });
    this.modeLabel = headerRow.createSpan({ cls: "xiaoyuan-modal-mode-label" });
    this.modeLabel.textContent = this.plugin.settings.execMode === "cli" ? "CLI" : "API";
    headerRow.style.cursor = "move";
    makeDraggable(headerRow, modalEl);
    this.loadingEl = contentEl.createDiv({ cls: "xiaoyuan-modal-loading", text: "\u23F3 \u5904\u7406\u4E2D..." });
    this.resultEl = contentEl.createDiv({ cls: "xiaoyuan-modal-result" });
    const btnRow = contentEl.createDiv({ cls: "xiaoyuan-modal-btn-row" });
    const toolsBtn = btnRow.createEl("button", { text: "AI\u5DE5\u5177", cls: "xiaoyuan-btn-secondary" });
    toolsBtn.addEventListener("click", (e) => this.showAIToolsMenu(e));
    const replaceBtn = btnRow.createEl("button", { text: "\u66FF\u6362\u539F\u6587", cls: "xiaoyuan-btn-primary" });
    replaceBtn.addEventListener("click", () => {
      const editor = this.plugin.getActiveEditor();
      if (editor) {
        editor.replaceSelection(this.resultEl.textContent || "");
        new import_obsidian4.Notice("\u5DF2\u66FF\u6362");
      } else new import_obsidian4.Notice("\u672A\u627E\u5230\u6D3B\u52A8\u7F16\u8F91\u5668");
      this.close();
    });
    const copyBtn = btnRow.createEl("button", { text: "\u590D\u5236\u7ED3\u679C", cls: "xiaoyuan-btn-secondary" });
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(this.resultEl.textContent || "");
      new import_obsidian4.Notice("\u5DF2\u590D\u5236");
    });
    const closeBtn = btnRow.createEl("button", { text: "\u5173\u95ED", cls: "xiaoyuan-btn-secondary" });
    closeBtn.addEventListener("click", () => this.close());
    if (this.inputText) {
      this.processOperation();
    } else {
      this.loadingEl.style.display = "none";
      this.resultEl.classList.add("show");
      this.resultEl.contentEditable = "true";
    }
  }
  showAIToolsMenu(e) {
    const menu = new import_obsidian4.Menu();
    ["polish", "summarize", "complete", "expand", "continue", "translate"].forEach((op) => {
      menu.addItem((item) => {
        item.setTitle(OPERATION_LABELS[op]);
        item.setIcon(
          op === "polish" ? "pencil" : op === "summarize" ? "file-text" : op === "complete" ? "check" : op === "expand" ? "maximize" : op === "continue" ? "arrow-right" : "globe"
        );
        item.onClick(() => this.reprocessWith(op));
      });
    });
    menu.showAtMouseEvent(e);
  }
  async reprocessWith(operation) {
    const fullText = this.resultEl.textContent || "";
    if (!fullText.trim()) {
      new import_obsidian4.Notice("\u5185\u5BB9\u4E3A\u7A7A\uFF0C\u8BF7\u5148\u8F93\u5165\u5185\u5BB9");
      return;
    }
    const sel = window.getSelection();
    let textToProcess = "";
    if (sel && sel.rangeCount > 0 && this.resultEl.contains(sel.anchorNode)) {
      textToProcess = sel.toString().trim();
    }
    if (!textToProcess) textToProcess = fullText;
    this.titleEl.textContent = `AI ${OPERATION_LABELS[operation] || operation}`;
    this.loadingEl.style.display = "";
    this.loadingEl.textContent = "\u23F3 \u5904\u7406\u4E2D...";
    this.resultEl.classList.remove("show");
    try {
      const s = this.plugin.settings;
      const prompt = (OPERATION_PROMPTS[operation] || OPERATION_PROMPTS.polish) + textToProcess;
      let result;
      if (s.execMode === "cli") {
        this.modeLabel.textContent = "CLI";
        const vaultDir = getVaultBasePath(this.app.vault);
        result = await callAIWithCLI(
          prompt,
          s,
          vaultDir,
          void 0,
          void 0,
          () => {
            this.loadingEl.textContent = "\u5DF2\u8FDE\u63A5\uFF0C\u7B49\u5F85\u54CD\u5E94...";
          },
          (text) => {
            this.loadingEl.textContent = `\u601D\u8003\u4E2D... ${text.slice(0, 60)}`;
          },
          () => {
            this.loadingEl.textContent = "\u2713 \u5DF2\u6536\u5230\u54CD\u5E94";
          }
        );
      } else {
        this.modeLabel.textContent = "API";
        const provider = getActiveProvider(s);
        if (!provider || !provider.apiKey) {
          new import_obsidian4.Notice("API Key \u672A\u914D\u7F6E");
          this.close();
          return;
        }
        result = await callAIWithAPIJson(ensureApiUrl(provider.baseUrl), provider.apiKey, provider.model, [
          { role: "system", content: s.systemPrompt },
          { role: "user", content: prompt }
        ], s.maxTokens, s.temperature, s.apiReasoningEffort);
      }
      this.loadingEl.style.display = "none";
      this.resultEl.classList.add("show");
      this.resultEl.textContent = result;
      this.resultEl.contentEditable = "true";
    } catch (err) {
      this.loadingEl.textContent = `\u274C \u9519\u8BEF\uFF1A${err.message}`;
    }
  }
  async processOperation() {
    try {
      const s = this.plugin.settings;
      const prompt = (OPERATION_PROMPTS[this.operation] || OPERATION_PROMPTS.polish) + this.inputText;
      let result;
      if (s.execMode === "cli") {
        this.modeLabel.textContent = "CLI";
        const vaultDir = getVaultBasePath(this.app.vault);
        result = await callAIWithCLI(
          prompt,
          s,
          vaultDir,
          void 0,
          void 0,
          () => {
            this.loadingEl.textContent = "\u5DF2\u8FDE\u63A5\uFF0C\u7B49\u5F85\u54CD\u5E94...";
          },
          (text) => {
            this.loadingEl.textContent = `\u601D\u8003\u4E2D... ${text.slice(0, 60)}`;
          },
          () => {
            this.loadingEl.textContent = "\u2713 \u5DF2\u6536\u5230\u54CD\u5E94";
          }
        );
      } else {
        this.modeLabel.textContent = "API";
        const provider = getActiveProvider(s);
        if (!provider || !provider.apiKey) {
          new import_obsidian4.Notice("API Key \u672A\u914D\u7F6E");
          this.close();
          return;
        }
        result = await callAIWithAPIJson(ensureApiUrl(provider.baseUrl), provider.apiKey, provider.model, [
          { role: "system", content: s.systemPrompt },
          { role: "user", content: prompt }
        ], s.maxTokens, s.temperature, s.apiReasoningEffort);
      }
      this.loadingEl.style.display = "none";
      this.resultEl.classList.add("show");
      this.resultEl.textContent = result;
      this.resultEl.contentEditable = "true";
    } catch (err) {
      this.loadingEl.textContent = `\u274C \u9519\u8BEF\uFF1A${err.message}`;
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
var WikiCommandModal = class extends import_obsidian4.Modal {
  constructor(app, plugin, command) {
    super(app);
    this.plugin = plugin;
    this.command = command;
  }
  onOpen() {
    const { contentEl, modalEl } = this;
    contentEl.empty();
    contentEl.classList.add("xiaoyuan-wiki-modal-container");
    const h3El = contentEl.createEl("h3", { text: `\u{1F9E0} Wiki \u547D\u4EE4\uFF1A/${this.command}` });
    h3El.style.cursor = "move";
    makeDraggable(h3El, modalEl);
    const inputEl = contentEl.createEl("textarea", {
      cls: "xiaoyuan-wiki-input",
      attr: { placeholder: this.command === "query" ? "\u8F93\u5165\u67E5\u8BE2\u5185\u5BB9..." : "\u8F93\u5165\u8981\u4FDD\u5B58\u7684\u5185\u5BB9..." }
    });
    const btnRow = contentEl.createDiv({ cls: "xiaoyuan-wiki-btn-row" });
    const submitBtn = btnRow.createEl("button", { text: "\u6267\u884C", cls: "xiaoyuan-btn-primary" });
    const resultEl = contentEl.createDiv({ cls: "xiaoyuan-wiki-result" });
    submitBtn.addEventListener("click", async () => {
      const text = inputEl.value.trim();
      if (!text) {
        new import_obsidian4.Notice("\u8BF7\u8F93\u5165\u5185\u5BB9");
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = "\u5904\u7406\u4E2D...";
      try {
        const s = this.plugin.settings;
        const systemPrompt = WIKI_SYSTEM_PROMPTS[this.command] || "";
        let result;
        if (s.execMode === "cli") {
          const fullPrompt = systemPrompt ? `${systemPrompt}

---
${text}` : text;
          const vaultDir = getVaultBasePath(this.app.vault);
          result = await callAIWithCLI(
            fullPrompt,
            s,
            vaultDir,
            void 0,
            void 0,
            () => {
              submitBtn.textContent = "\u5DF2\u8FDE\u63A5\uFF0C\u7B49\u5F85\u54CD\u5E94...";
            },
            (t) => {
              submitBtn.textContent = `\u601D\u8003\u4E2D... ${t.slice(0, 40)}`;
            },
            () => {
              resultEl.textContent = "\u2713 \u5DF2\u6536\u5230\u54CD\u5E94";
            }
          );
        } else {
          const provider = getActiveProvider(s);
          if (!provider || !provider.apiKey) {
            new import_obsidian4.Notice("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E API Key");
            return;
          }
          const messages = systemPrompt ? [{ role: "system", content: systemPrompt }, { role: "user", content: text }] : [{ role: "user", content: text }];
          result = await callAIWithAPIJson(ensureApiUrl(provider.baseUrl), provider.apiKey, provider.model, messages, s.maxTokens, s.temperature, s.apiReasoningEffort);
        }
        resultEl.classList.add("show");
        resultEl.textContent = result;
        resultEl.contentEditable = "true";
      } catch (err) {
        resultEl.classList.add("show");
        resultEl.textContent = `\u274C \u9519\u8BEF\uFF1A${err.message}`;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "\u6267\u884C";
      }
    });
    const closeBtn = btnRow.createEl("button", { text: "\u5173\u95ED", cls: "xiaoyuan-btn-secondary" });
    closeBtn.addEventListener("click", () => this.close());
  }
};

// src/main.ts
init_ai();
init_server();
var XiaoyuanAIPlugin = class extends import_obsidian5.Plugin {
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE_XIAOYUAN_AI_CHAT, (leaf) => new XiaoyuanAIChatView(leaf, this));
    this.addRibbonIcon("message-circle", "\u5C0F\u5143AI", () => this.activateChatView());
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        const sel = editor.getSelection();
        menu.addItem((item) => {
          item.setTitle("\u5C0F\u5143AI");
          item.setIcon("message-circle");
          const submenu = item.setSubmenu();
          ["polish", "summarize", "complete", "expand", "continue", "translate"].forEach((op) => {
            submenu.addItem((subItem) => {
              subItem.setTitle(OPERATION_LABELS[op]);
              subItem.setIcon(
                op === "polish" ? "pencil" : op === "summarize" ? "file-text" : op === "complete" ? "check" : op === "expand" ? "maximize" : op === "continue" ? "arrow-right" : "globe"
              );
              subItem.onClick(() => new TextOperationModal(this.app, this, op, sel).open());
            });
          });
        });
      })
    );
    this.addCommand({
      id: "xiaoyuanAI-toggle-chat",
      name: "\u5207\u6362\u5C0F\u5143AI\u804A\u5929\u9762\u677F",
      callback: () => this.activateChatView(),
      hotkeys: [{ modifiers: ["Ctrl", "Shift"], key: "C" }]
    });
    this.addCommand({
      id: "xiaoyuanAI-new-chat",
      name: "\u{1F4AC} \u65B0\u5EFA AI \u5BF9\u8BDD",
      callback: () => {
        const leaf = this.activateChatView();
        if (leaf?.view instanceof XiaoyuanAIChatView) leaf.view.newChat();
      },
      hotkeys: [{ modifiers: ["Ctrl", "Shift"], key: "N" }]
    });
    ["polish", "summarize", "complete", "expand", "translate", "continue"].forEach((op) => {
      this.addCommand({
        id: `xiaoyuanAI-${op}`,
        name: `AI ${OPERATION_LABELS[op]}\u9009\u4E2D\u6587\u672C`,
        editorCallback: (editor) => {
          const text = editor.getSelection();
          if (text) new TextOperationModal(this.app, this, op, text).open();
        }
      });
    });
    this.addCommand({
      id: "xiaoyuanAI-wiki-query",
      name: "\u{1F50D} Wiki \u67E5\u8BE2",
      callback: () => new WikiCommandModal(this.app, this, "query").open()
    });
    this.addCommand({
      id: "xiaoyuanAI-wiki-capture",
      name: "\u{1F4E5} Wiki \u6355\u6349",
      callback: () => new WikiCommandModal(this.app, this, "capture").open()
    });
    this.addCommand({
      id: "xiaoyuanAI-wiki-ingest",
      name: "\u{1F4E5} Wiki \u6444\u5165",
      callback: () => new WikiCommandModal(this.app, this, "ingest").open()
    });
    this.addCommand({
      id: "xiaoyuanAI-chat-with-note",
      name: "\u{1F4C4} \u7528\u5F53\u524D\u7B14\u8BB0\u5F00\u542F AI \u5BF9\u8BDD",
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new import_obsidian5.Notice("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u7B14\u8BB0");
          return;
        }
        const content = await this.app.vault.read(file);
        const leaf = this.activateChatView();
        if (leaf?.view instanceof XiaoyuanAIChatView) {
          leaf.view.addMessage("user", `\u6211\u6709\u4E00\u6BB5\u7B14\u8BB0\u5185\u5BB9\uFF0C\u5E2E\u6211\u5206\u6790\uFF1A

${content.slice(0, 3e3)}`);
        }
      }
    });
    this.addSettingTab(new XiaoyuanAISettingTab(this.app, this));
    if (this.settings.execMode === "cli" && this.settings.opencode.autoStart) {
      this.autoStartServer();
    }
    if (this.settings.autoOpen) {
      this.app.workspace.onLayoutReady(() => this.activateChatView());
    }
  }
  async autoStartServer() {
    try {
      const vaultDir = getVaultBasePath(this.app.vault);
      await ensureOpenCodeServer(
        this.settings.opencode.cliPath,
        this.settings.opencode.hostname,
        this.settings.opencode.port,
        vaultDir,
        true
      );
    } catch (err) {
      console.warn("\u81EA\u52A8\u542F\u52A8 opencode serve \u5931\u8D25:", err);
    }
  }
  activateChatView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT).first();
    if (!leaf) {
      const useRight = this.settings.chatViewType === "right";
      leaf = useRight ? workspace.getRightLeaf(false) ?? void 0 : workspace.getLeftLeaf(false) ?? void 0;
      if (leaf) leaf.setViewState({ type: VIEW_TYPE_XIAOYUAN_AI_CHAT, active: true });
    }
    if (leaf) workspace.revealLeaf(leaf);
    return leaf;
  }
  getActiveEditor() {
    return this.app.workspace.activeEditor?.editor || null;
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (!this.settings.opencode.agent) this.settings.opencode.agent = "build";
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async onunload() {
    stopOpenCodeServer();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT);
  }
};
