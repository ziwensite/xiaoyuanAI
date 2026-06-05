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

// src/constants.ts
function getActiveProvider(s) {
  if (s.activeApiProviderId) return s.apiProviders.find((p) => p.id === s.activeApiProviderId);
  return s.apiProviders[0];
}
var DEFAULT_OPENCODE_SETTINGS, DEFAULT_SETTINGS, CHAT_SESSIONS_KEY, CURRENT_SESSION_KEY, VIEW_TYPE_XIAOYUAN_AI_CHAT, OPERATIONS, OPERATION_PROMPTS, OPERATION_ICONS, OPERATION_LABELS;
var init_constants = __esm({
  "src/constants.ts"() {
    "use strict";
    DEFAULT_OPENCODE_SETTINGS = {
      cliPath: "opencode",
      autoStart: false,
      hostname: "127.0.0.1",
      port: 16226,
      model: "",
      agent: "build"
    };
    DEFAULT_SETTINGS = {
      execMode: "cli",
      opencode: { ...DEFAULT_OPENCODE_SETTINGS },
      activeApiProviderId: "",
      apiProviders: [
        { id: "default", name: "\u9ED8\u8BA4 API", baseUrl: "https://api.openai.com/v1", model: "gpt-4o", apiKey: "" }
      ],
      proxyEnabled: false,
      proxyUrl: "",
      mcpServers: [],
      defaultReasoning: "low",
      apiReasoningEffort: "none",
      defaultPermission: "read-only",
      autoOpen: true,
      showContext: false,
      chatViewType: "right",
      systemPrompt: "\u4F60\u662F\u4E00\u4E2A AI \u52A9\u624B\uFF0C\u96C6\u6210\u5728 Obsidian \u7B14\u8BB0\u8F6F\u4EF6\u4E2D\u3002\u7528\u6237\u6B63\u5728\u505A\u7B14\u8BB0\u6216\u5199\u4F5C\u3002\u8BF7\u7528\u4E2D\u6587\u56DE\u7B54\uFF0C\u4FDD\u6301\u7B80\u6D01\u4E13\u4E1A\u3002",
      maxTokens: 4096,
      temperature: 0.7,
      chatHistoryPath: "_chatHistory",
      showDiffPreview: true,
      showThinking: true,
      maxAttachmentSize: 10,
      skills: []
    };
    CHAT_SESSIONS_KEY = "xiaoyuan-chat-sessions";
    CURRENT_SESSION_KEY = "xiaoyuan-current-session";
    VIEW_TYPE_XIAOYUAN_AI_CHAT = "xiaoyuan-chat-view";
    OPERATIONS = [
      "polish",
      "summarize",
      "complete",
      "expand",
      "continue",
      "translate"
    ];
    OPERATION_PROMPTS = {
      polish: "\u4F60\u662F\u4E00\u4E2A\u6587\u5B57\u6DA6\u8272\u52A9\u624B\u3002\u8BF7\u6DA6\u8272\u4EE5\u4E0B\u6587\u672C\uFF0C\u6539\u8FDB\u8868\u8FBE\u3001\u8BED\u6CD5\u548C\u6D41\u7545\u5EA6\uFF0C\u4FDD\u6301\u539F\u610F\u4E0D\u53D8\u3002\u53EA\u8F93\u51FA\u6DA6\u8272\u540E\u7684\u7ED3\u679C\uFF0C\u4E0D\u8981\u6DFB\u52A0\u4EFB\u4F55\u89E3\u91CA\uFF1A\n\n",
      summarize: "\u4F60\u662F\u4E00\u4E2A\u603B\u7ED3\u52A9\u624B\u3002\u8BF7\u5BF9\u4EE5\u4E0B\u6587\u672C\u8FDB\u884C\u7B80\u6D01\u7684\u603B\u7ED3\uFF0C\u63D0\u53D6\u5173\u952E\u8981\u70B9\u3002\u7528\u4E2D\u6587\u603B\u7ED3\uFF0C\u53EA\u8F93\u51FA\u603B\u7ED3\u5185\u5BB9\uFF1A\n\n",
      complete: "\u4F60\u662F\u4E00\u4E2A\u5199\u4F5C\u52A9\u624B\u3002\u8BF7\u6839\u636E\u4E0A\u4E0B\u6587\uFF0C\u81EA\u7136\u5730\u8865\u5168\u4EE5\u4E0B\u5185\u5BB9\uFF0C\u4FDD\u6301\u98CE\u683C\u4E00\u81F4\uFF1A\n\n",
      expand: "\u4F60\u662F\u4E00\u4E2A\u5199\u4F5C\u52A9\u624B\u3002\u8BF7\u6269\u5199\u4EE5\u4E0B\u5185\u5BB9\uFF0C\u589E\u52A0\u7EC6\u8282\u3001\u4F8B\u5B50\u548C\u6DF1\u5EA6\uFF0C\u4FDD\u7559\u539F\u6587\u7684\u6838\u5FC3\u89C2\u70B9\uFF1A\n\n",
      translate: "\u4F60\u662F\u4E00\u4E2A\u7FFB\u8BD1\u52A9\u624B\u3002\u8BF7\u5C06\u4EE5\u4E0B\u6587\u672C\u7FFB\u8BD1\u6210\u4E2D\u6587\uFF0C\u4FDD\u6301\u4E13\u4E1A\u6027\u548C\u6D41\u7545\u5EA6\uFF1A\n\n",
      continue: "\u4F60\u662F\u4E00\u4E2A\u5199\u4F5C\u52A9\u624B\u3002\u8BF7\u6839\u636E\u4EE5\u4E0B\u5185\u5BB9\u81EA\u7136\u5730\u7EED\u5199\uFF0C\u4FDD\u6301\u98CE\u683C\u4E00\u81F4\uFF1A\n\n"
    };
    OPERATION_ICONS = {
      polish: "pencil",
      summarize: "file-text",
      complete: "check",
      expand: "maximize",
      continue: "arrow-right",
      translate: "languages"
    };
    OPERATION_LABELS = {
      polish: "\u6DA6\u8272",
      summarize: "\u603B\u7ED3",
      complete: "\u8865\u5168",
      expand: "\u6269\u5199",
      translate: "\u7FFB\u8BD1\u4E3A\u4E2D\u6587",
      continue: "\u7EED\u5199"
    };
  }
});

// src/opencode-client.ts
function readServerConn(vaultDir, _configuredPort) {
  try {
    const lockPath = path.join(vaultDir, ".opencode", "server.lock.json");
    if (fs.existsSync(lockPath)) {
      const lock = JSON.parse(fs.readFileSync(lockPath, "utf-8"));
      const authHeader = lock.password ? `Basic ${Buffer.from(`opencode:${lock.password}`).toString("base64")}` : "";
      return { url: `http://127.0.0.1:${lock.port}`, authHeader };
    }
  } catch (e) {
  }
  return null;
}
function httpGetOpenCode(baseUrl, path5, directory) {
  const url = new URL(path5, baseUrl.replace(/\/+$/, ""));
  url.searchParams.set("directory", directory);
  return new Promise((resolve, reject) => {
    http.get(url.toString(), (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        var _a;
        const body = Buffer.concat(chunks).toString();
        if (!res.statusCode || res.statusCode >= 300) {
          reject(new Error(`OpenCode API ${path5}: ${res.statusCode} ${res.statusCode ? http.STATUS_CODES[res.statusCode] || "" : ""}${body ? ` - ${body.slice(0, 200)}` : ""}`));
          return;
        }
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          reject(new Error(`OpenCode API ${path5}: JSON \u89E3\u6790\u5931\u8D25 \u2014 ${e.message}`));
          return;
        }
        if (parsed && typeof parsed === "object" && "error" in parsed && parsed.error) {
          const errObj = parsed.error;
          const errMap = errObj;
          const errMsg = errMap.message || ((_a = errMap.data) == null ? void 0 : _a.message) || JSON.stringify(errObj);
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
function requestOpenCode(base, apiPath, method, body, authHeader) {
  const u = new URL(apiPath, base.replace(/\/+$/, ""));
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: u.hostname,
      port: Number(u.port) || 16226,
      path: u.pathname + u.search,
      method,
      headers: { "Content-Type": "application/json" }
    };
    if (authHeader) opts.headers["Authorization"] = authHeader;
    const req = http.request(opts, (res) => {
      const chunks = [];
      res.on("data", (ch) => chunks.push(ch));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString();
        if (!res.statusCode || res.statusCode >= 300) {
          reject(new Error(`OpenCode ${method} ${apiPath}: ${res.statusCode} ${raw.slice(0, 200)}`));
          return;
        }
        if (res.statusCode === 204) {
          resolve({});
          return;
        }
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error(`OpenCode ${method} ${apiPath}: JSON parse error \u2014 ${e.message}`));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(1e4, () => {
      req.destroy();
      reject(new Error(`OpenCode ${method} ${apiPath}: timeout`));
    });
    if (body !== void 0) req.write(JSON.stringify(body));
    req.end();
  });
}
function connectSSE(base, authHeader, sessionId, signal, onEvent, onDone, onError) {
  const handleDone = onDone || (() => {
  });
  const handleError = onError || (() => {
  });
  const u = new URL("/event", base.replace(/\/+$/, ""));
  const opts = {
    hostname: u.hostname,
    port: Number(u.port) || 16226,
    path: u.pathname + u.search,
    method: "GET",
    headers: {}
  };
  if (authHeader) opts.headers["Authorization"] = authHeader;
  const req = http.request(opts, (res) => {
    const dec = new TextDecoder();
    let buf = "";
    res.on("data", (chunk) => {
      if (signal.aborted) {
        res.destroy();
        return;
      }
      buf += dec.decode(chunk, { stream: true });
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          onEvent(JSON.parse(payload));
        } catch (e) {
        }
      }
    });
    res.on("end", handleDone);
    res.on("error", (err) => handleError(err instanceof Error ? err : new Error(String(err))));
  });
  req.on("error", (err) => handleError(err instanceof Error ? err : new Error(String(err))));
  req.setTimeout(15e3, () => {
    const err = new Error("SSE \u8FDE\u63A5\u8D85\u65F6");
    req.destroy();
    handleError(err);
  });
  signal.addEventListener("abort", () => req.destroy(), { once: true });
  req.end();
}
function combineSignals(...sigs) {
  const ctrl = new AbortController();
  const cleanup = [];
  for (const s of sigs) {
    if (!s) continue;
    if (s.aborted) {
      ctrl.abort(s.reason);
      return ctrl.signal;
    }
    const handler = () => {
      ctrl.abort(s.reason);
    };
    s.addEventListener("abort", handler, { once: true });
    cleanup.push(() => s.removeEventListener("abort", handler));
  }
  const origAbort = ctrl.abort.bind(ctrl);
  ctrl.abort = (reason) => {
    for (const c of cleanup) c();
    origAbort(reason);
  };
  return ctrl.signal;
}
var http, path, fs;
var init_opencode_client = __esm({
  "src/opencode-client.ts"() {
    "use strict";
    http = __toESM(require("http"));
    path = __toESM(require("path"));
    fs = __toESM(require("fs"));
  }
});

// src/opencode-server.ts
var opencode_server_exports = {};
__export(opencode_server_exports, {
  ensureOpenCodeServer: () => ensureOpenCodeServer,
  resolveOpenCodePath: () => resolveOpenCodePath,
  spawnWithTimeout: () => spawnWithTimeout,
  startTempOpenCodeServer: () => startTempOpenCodeServer,
  stopOpenCodeServer: () => stopOpenCodeServer,
  stopTempServer: () => stopTempServer
});
function buildSpawn(bin, args) {
  if (process.platform !== "win32") return { command: bin, args };
  const ext = path2.extname(bin).toLowerCase();
  if (ext === ".cmd" || ext === ".bat") {
    return { command: "cmd.exe", args: ["/c", bin, ...args] };
  }
  if (ext === ".exe") {
    return { command: bin, args };
  }
  return { command: "cmd.exe", args: ["/c", bin, ...args] };
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
          } catch (e) {
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
async function resolveOpenCodePath(hint) {
  if (hint && hint !== "opencode") return hint;
  try {
    const isWin = process.platform === "win32";
    const out = (0, import_child_process.execSync)(isWin ? "where opencode" : "which opencode", { encoding: "utf-8", timeout: 3e3, windowsHide: true });
    const first = out.trim().split(/\r?\n/)[0];
    if (first) return first;
  } catch (e) {
  }
  const commonPaths = [
    path2.join(process.env.APPDATA || "", "npm", "opencode.cmd"),
    path2.join(process.env.LOCALAPPDATA || "", "opencode", "opencode.exe"),
    "/usr/local/bin/opencode"
  ];
  for (const p of commonPaths) {
    if (fs2.existsSync(p)) return p;
  }
  return hint;
}
async function startTempOpenCodeServer(bin, vaultDir, port, hostname = "127.0.0.1") {
  const args = ["serve", `--hostname=${hostname}`, `--port=${port}`];
  const spec = buildSpawn(bin, args);
  return new Promise((resolve, reject) => {
    var _a, _b;
    const proc = (0, import_child_process.spawn)(spec.command, spec.args, {
      cwd: vaultDir,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env }
    });
    let output = "";
    const timer = setTimeout(() => {
      try {
        proc.kill();
      } catch (e) {
      }
      reject(new Error(`opencode server \u542F\u52A8\u8D85\u65F6: ${output.trim()}`));
    }, OPENCODE_START_TIMEOUT_MS);
    const finish = (value) => {
      clearTimeout(timer);
      resolve(value);
    };
    (_a = proc.stdout) == null ? void 0 : _a.on("data", (chunk) => {
      output += chunk.toString();
      const match = output.match(/opencode server listening.*\s(on\s+)?(https?:\/\/[^\s]+)/);
      if (match == null ? void 0 : match[2]) finish({ url: match[2].replace(/\/$/, ""), proc });
    });
    (_b = proc.stderr) == null ? void 0 : _b.on("data", (chunk) => {
      output += chunk.toString();
    });
    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`opencode server \u5DF2\u9000\u51FA: ${code != null ? code : "unknown"}
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
    } catch (e) {
    }
  }
  try {
    proc.kill("SIGTERM");
  } catch (e) {
  }
}
function registerProcessCleanup() {
  if (processCleanupRegistered) return;
  processCleanupRegistered = true;
  const cleanup = () => {
    try {
      autoStartedProc == null ? void 0 : autoStartedProc.kill();
    } catch (e) {
    }
  };
  process.on("exit", cleanup);
  if (process.platform !== "win32") {
    process.on("SIGTERM", cleanup);
    process.on("SIGINT", cleanup);
  }
}
async function ensureOpenCodeServer(cliPath, hostname, port, vaultDir, autoStart) {
  if (ensureServerPromise) return ensureServerPromise;
  const serverUrl = `http://${hostname || "127.0.0.1"}:${port || 16226}`;
  try {
    await httpGetOpenCode(serverUrl, "/global/health", vaultDir);
    return serverUrl;
  } catch (e) {
  }
  if (!autoStart) throw new Error("opencode serve \u672A\u8FD0\u884C\uFF0C\u4E14\u81EA\u52A8\u542F\u52A8\u672A\u5F00\u542F");
  ensureServerPromise = (async () => {
    if (autoStartedProc && autoStartedProc.exitCode === null) {
      stopTempServer(autoStartedProc);
      autoStartedProc = null;
    }
    const effectiveBin = await resolveOpenCodePath(cliPath);
    const temp = await startTempOpenCodeServer(effectiveBin, vaultDir, port, hostname);
    autoStartedProc = temp.proc;
    registerProcessCleanup();
    return temp.url;
  })();
  try {
    return await ensureServerPromise;
  } finally {
    ensureServerPromise = null;
  }
}
function stopOpenCodeServer() {
  if (autoStartedProc) {
    stopTempServer(autoStartedProc);
    autoStartedProc = null;
  }
}
var import_child_process, path2, fs2, OPENCODE_START_TIMEOUT_MS, autoStartedProc, processCleanupRegistered, ensureServerPromise;
var init_opencode_server = __esm({
  "src/opencode-server.ts"() {
    "use strict";
    import_child_process = require("child_process");
    path2 = __toESM(require("path"));
    fs2 = __toESM(require("fs"));
    init_opencode_client();
    OPENCODE_START_TIMEOUT_MS = 15e3;
    autoStartedProc = null;
    processCleanupRegistered = false;
    ensureServerPromise = null;
  }
});

// src/api-client.ts
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
function ensureApiUrl(baseUrl) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : trimmed + "/chat/completions";
}
async function processAPISSEStream(resp, onThinking, onTextUpdate) {
  var _a;
  const reader = (_a = resp.body) == null ? void 0 : _a.getReader();
  if (!reader) throw new Error("\u65E0\u6CD5\u8BFB\u53D6\u54CD\u5E94\u6D41");
  const decoder = new TextDecoder("utf-8");
  let fullContent = "";
  let fullThinking = "";
  const read = async () => {
    var _a2, _b;
    const { done, value } = await reader.read();
    if (done) return fullContent || fullThinking || "\uFF08\u65E0\u54CD\u5E94\uFF09";
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const dataStr = trimmed.slice(5).trim();
      if (dataStr === "[DONE]") continue;
      try {
        const data = JSON.parse(dataStr);
        const delta = (_b = (_a2 = data.choices) == null ? void 0 : _a2[0]) == null ? void 0 : _b.delta;
        if (delta == null ? void 0 : delta.reasoning_content) {
          fullThinking += delta.reasoning_content;
          onThinking == null ? void 0 : onThinking(fullThinking);
        }
        if (delta == null ? void 0 : delta.content) {
          fullContent += delta.content;
          onTextUpdate == null ? void 0 : onTextUpdate(fullContent);
        }
      } catch (e) {
      }
    }
    return read();
  };
  return read();
}
var init_api_client = __esm({
  "src/api-client.ts"() {
    "use strict";
  }
});

// src/opencode-config.ts
function flattenProviders(providers) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
  const result = /* @__PURE__ */ new Map();
  const caps = {};
  for (const p of providers) {
    if (p.configured === false) continue;
    const providerName = p.name || p.id;
    const rawModels = p.models || {};
    const entries = Array.isArray(rawModels) ? Object.values(rawModels).map((m) => ({ id: m.id || m.name || "", name: m.name || m.id || "", enabled: m.enabled, capabilities: m.capabilities })) : Object.values(rawModels).map((m) => ({ id: m.id || m.name || "", name: m.name || m.id || "", enabled: m.enabled, capabilities: m.capabilities }));
    for (const m of entries) {
      if (!m.id) continue;
      if (m.enabled === false) continue;
      const modelId = m.id.includes("/") ? m.id : `${p.id}/${m.id}`;
      const displayName = `${providerName} \xB7 ${m.name || m.id}`;
      if (!result.has(modelId)) {
        result.set(modelId, { id: modelId, displayName });
        const c = m.capabilities || {};
        caps[modelId] = {
          text: (_b = (_a = c.input) == null ? void 0 : _a.text) != null ? _b : true,
          image: (_d = (_c = c.input) == null ? void 0 : _c.image) != null ? _d : false,
          pdf: (_f = (_e = c.input) == null ? void 0 : _e.pdf) != null ? _f : false,
          audio: (_h = (_g = c.input) == null ? void 0 : _g.audio) != null ? _h : false,
          video: (_j = (_i = c.input) == null ? void 0 : _i.video) != null ? _j : false,
          reasoning: (_k = c.reasoning) != null ? _k : false,
          toolcall: (_l = c.toolcall) != null ? _l : false,
          attachment: (_m = c.attachment) != null ? _m : false,
          temperature: (_n = c.temperature) != null ? _n : true
        };
      }
    }
  }
  return {
    models: [...result.values()].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    caps
  };
}
async function fetchModelsViaServer(bin, vaultDir, configuredPort) {
  var _a, _b;
  const serverUrl = `http://127.0.0.1:${configuredPort}`;
  let temp = null;
  try {
    await httpGetOpenCode(serverUrl, "/global/health", vaultDir);
    const response = await httpGetOpenCode(serverUrl, "/config/providers", vaultDir);
    const data = response;
    const providers = Array.isArray(data) ? data : (_a = data == null ? void 0 : data.providers) != null ? _a : [];
    const r = flattenProviders(providers);
    return { models: r.models, caps: r.caps, defaultModel: "" };
  } catch (e) {
  }
  const tempPort = configuredPort === 16226 ? 16227 : configuredPort + 1;
  try {
    temp = await startTempOpenCodeServer(bin, vaultDir, tempPort);
    if (!temp) throw new Error("\u542F\u52A8\u4E34\u65F6\u670D\u52A1\u5668\u5931\u8D25");
    const response = await httpGetOpenCode(temp.url, "/config/providers", vaultDir);
    const data = response;
    const providers = Array.isArray(data) ? data : (_b = data == null ? void 0 : data.providers) != null ? _b : [];
    const r = flattenProviders(providers);
    return { models: r.models, caps: r.caps, defaultModel: "" };
  } finally {
    if (temp) stopTempServer(temp.proc);
  }
}
function findOpenCodeConfigFiles(vaultDir) {
  const candidates = [
    path3.join(vaultDir, ".opencode.json"),
    path3.join(vaultDir, ".opencode", "config.json"),
    path3.join(process.env.APPDATA || "", "opencode", "config.json"),
    path3.join(process.env.USERPROFILE || "", ".opencode.json"),
    path3.join(process.env.USERPROFILE || "", ".opencode", "config.json"),
    path3.join(process.env.USERPROFILE || "", ".config", "opencode", "config.json"),
    path3.join(process.env.LOCALAPPDATA || "", "opencode", "config.json")
  ];
  const seen = /* @__PURE__ */ new Set();
  const results = [];
  for (const p of candidates) {
    if (seen.has(p)) continue;
    seen.add(p);
    try {
      const content = fs3.readFileSync(p, "utf-8");
      results.push(JSON.parse(content));
    } catch (e) {
    }
  }
  return results;
}
function extractModelsFromConfig(parsed) {
  var _a, _b, _c;
  const result = /* @__PURE__ */ new Map();
  const providers = (_b = (_a = parsed == null ? void 0 : parsed.providers) != null ? _a : parsed == null ? void 0 : parsed.profiles) != null ? _b : {};
  for (const [providerId, cfg] of Object.entries(providers)) {
    const pc = cfg;
    const providerName = pc.name || providerId;
    const rawModels = (_c = pc.models) != null ? _c : {};
    const entries = Array.isArray(rawModels) ? rawModels.map((m) => {
      const mm = m;
      return { id: mm.id || mm.name || "", name: mm.name || mm.id || "" };
    }) : Object.values(rawModels).map((m) => {
      const mm = m;
      return { id: mm.id || mm.name || "", name: mm.name || mm.id || "" };
    });
    for (const m of entries) {
      if (!m.id) continue;
      const modelId = m.id.includes("/") ? m.id : `${providerId}/${m.id}`;
      if (!result.has(modelId)) result.set(modelId, { id: modelId, displayName: `${providerName} \xB7 ${m.name || m.id}` });
    }
  }
  if (result.size === 0 && Array.isArray(parsed == null ? void 0 : parsed.models)) {
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
    } catch (e) {
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
  } catch (e) {
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
  } catch (e) {
  }
  return [];
}
function filterAgents(agents) {
  return agents.filter((a) => a.mode === "primary" && !a.hidden).map((a) => ({ name: a.name, description: a.description }));
}
async function checkOpenCodeStatus(opencodePath, vaultDir, port = 16226, hostname = "127.0.0.1") {
  try {
    const effectiveBin = await resolveOpenCodePath(opencodePath);
    const serverUrl = `http://${hostname}:${port}`;
    try {
      await httpGetOpenCode(serverUrl, "/global/health", vaultDir);
      return { ok: true, version: "", bin: effectiveBin };
    } catch (e) {
      const out = await spawnWithTimeout(effectiveBin, ["--version"], vaultDir, 5e3).catch(() => "");
      return { ok: false, version: out.trim(), bin: effectiveBin, error: "opencode serve \u672A\u8FD0\u884C\n\u8BF7\u6267\u884C opencode serve \u542F\u52A8\u670D\u52A1\uFF0C\u6216\u5F00\u542F\u8BBE\u7F6E\u4E2D\u7684\u300C\u81EA\u52A8\u542F\u52A8\u300D" };
    }
  } catch (err) {
    return { ok: false, version: "", bin: opencodePath, error: err instanceof Error ? err.message : String(err) };
  }
}
var fs3, path3;
var init_opencode_config = __esm({
  "src/opencode-config.ts"() {
    "use strict";
    fs3 = __toESM(require("fs"));
    path3 = __toESM(require("path"));
    init_opencode_client();
    init_opencode_server();
  }
});

// src/server.ts
var server_exports = {};
__export(server_exports, {
  getVaultBasePath: () => getVaultBasePath,
  setVaultBasePath: () => setVaultBasePath,
  vaultBasePath: () => vaultBasePath
});
function setVaultBasePath(path5) {
  vaultBasePath = path5;
}
function getVaultBasePath() {
  return vaultBasePath;
}
var vaultBasePath;
var init_server = __esm({
  "src/server.ts"() {
    "use strict";
    vaultBasePath = "";
  }
});

// src/ai.ts
var ai_exports = {};
__export(ai_exports, {
  callAISession: () => callAISession,
  callAIWithHTTPStreaming: () => callAIWithHTTPStreaming,
  checkOpenCodeStatus: () => checkOpenCodeStatus,
  ensureOpenCodeServer: () => ensureOpenCodeServer,
  estimateTokens: () => estimateTokens,
  fetchOpenCodeAgents: () => fetchOpenCodeAgents,
  fetchOpenCodeModelsFromCLI: () => fetchOpenCodeModelsFromCLI,
  getVaultBasePath: () => getVaultBasePath,
  resetMCPSyncDone: () => resetMCPSyncDone,
  stopOpenCodeServer: () => stopOpenCodeServer,
  syncMCPServers: () => syncMCPServers
});
function parseDiffText(text) {
  var _a;
  const result = [];
  const blocks = text.split(/(?=^diff --git )/m);
  for (const block of blocks) {
    if (!block.trim()) continue;
    const file = ((_a = block.match(/^\+\+\+ b\/(.+)$/m)) == null ? void 0 : _a[1]) || "";
    if (!file) continue;
    const lines = block.split("\n");
    const startIdx = lines.findIndex((l) => l.startsWith("@@"));
    const beforeLines = [];
    const afterLines = [];
    for (let i = startIdx + 1; i < lines.length; i++) {
      const l = lines[i];
      if (l.startsWith("-")) beforeLines.push(l.slice(1));
      else if (l.startsWith("+")) afterLines.push(l.slice(1));
      else {
        beforeLines.push(l);
        afterLines.push(l);
      }
    }
    const addCount = lines.filter((l) => l.startsWith("+") && !l.startsWith("+++")).length;
    const delCount = lines.filter((l) => l.startsWith("-") && !l.startsWith("---")).length;
    result.push({ file, before: beforeLines.join("\n"), after: afterLines.join("\n"), additions: addCount, deletions: delCount });
  }
  return result;
}
async function callAIWithHTTPStreaming(prompt, settings, vaultDir, signal, onConnected, onThinking, onTextUpdate, onDiffs, onToolProgress) {
  var _a, _b, _c, _d;
  let conn = readServerConn(vaultDir, settings.opencode.port || 16226);
  if (conn) {
    try {
      await requestOpenCode(conn.url, "/global/health", "GET", void 0, conn.authHeader);
    } catch (e) {
      conn = null;
    }
  }
  if (!conn) {
    const base = await ensureOpenCodeServer(
      settings.opencode.cliPath,
      settings.opencode.hostname,
      settings.opencode.port,
      vaultDir,
      true
    );
    conn = { url: base, authHeader: ((_a = readServerConn(vaultDir, settings.opencode.port || 16226)) == null ? void 0 : _a.authHeader) || "" };
  }
  onConnected == null ? void 0 : onConnected();
  const session = await requestOpenCode(conn.url, "/session", "POST", {}, conn.authHeader);
  const sessionId = session.id;
  if (!sessionId) throw new Error("\u521B\u5EFA\u4F1A\u8BDD\u5931\u8D25");
  try {
    const payload = { parts: [{ type: "text", text: prompt }] };
    if (settings.opencode.agent) payload.agent = settings.opencode.agent;
    if (settings.defaultReasoning) payload.variant = settings.defaultReasoning;
    if (settings.opencode.model) {
      const parts = settings.opencode.model.split("/");
      if (parts.length >= 2) {
        payload.model = { providerID: parts[0], modelID: parts.slice(1).join("/") };
      }
    }
    await requestOpenCode(conn.url, `/session/${sessionId}/prompt_async`, "POST", payload, conn.authHeader);
    let accumulatedText = "";
    let accumulatedThinking = "";
    const sseAbort = new AbortController();
    const combinedSig = combineSignals(signal, sseAbort.signal);
    const partTypes = /* @__PURE__ */ new Map();
    const partTexts = /* @__PURE__ */ new Map();
    let idleResolve = null;
    let idleReject = null;
    const idlePromise = new Promise((resolve, reject) => {
      idleResolve = resolve;
      idleReject = reject;
    });
    let sseFailed = false;
    connectSSE(
      conn.url,
      conn.authHeader,
      sessionId,
      combinedSig,
      (evt) => {
        var _a2, _b2, _c2;
        const props = evt.properties || {};
        if (props.sessionID !== sessionId) return;
        if (evt.type === "message.part.updated") {
          const part = props.part || {};
          const partId = part.id;
          if (partId) {
            partTypes.set(partId, part.type || "");
            if (part.type === "text") {
              accumulatedText = part.text || "";
              partTexts.set(partId, accumulatedText);
              onTextUpdate == null ? void 0 : onTextUpdate(accumulatedText, accumulatedThinking);
            } else if (part.type === "thinking" || part.type === "reasoning") {
              accumulatedThinking = part.text || "";
              partTexts.set(partId, accumulatedThinking);
              onThinking == null ? void 0 : onThinking(accumulatedThinking);
            }
          }
          if (part.type === "tool") {
            const toolName = part.tool || part.name || "";
            const partState = part.state;
            const st = (partState == null ? void 0 : partState.status) || "running";
            if (toolName) onToolProgress == null ? void 0 : onToolProgress(toolName, st);
          } else if (part.type === "diff" || part.type === "patch") {
            const diffText = (_b2 = (_a2 = part.text) != null ? _a2 : part.diff) != null ? _b2 : "";
            if (diffText) {
              const diffs = parseDiffText(diffText);
              if (diffs.length) onDiffs == null ? void 0 : onDiffs(diffs);
            }
          }
        } else if (evt.type === "message.part.delta") {
          const partId = props.partID;
          const pType = partTypes.get(partId);
          if (props.field === "text" && props.delta) {
            const prev = partTexts.get(partId) || "";
            const updated = prev + props.delta;
            partTexts.set(partId, updated);
            if (pType === "text") {
              accumulatedText = updated;
              onTextUpdate == null ? void 0 : onTextUpdate(accumulatedText, accumulatedThinking);
            } else if (pType === "thinking" || pType === "reasoning") {
              accumulatedThinking = updated;
              onThinking == null ? void 0 : onThinking(accumulatedThinking);
            }
          }
        } else if (evt.type === "session.status") {
          if (((_c2 = props.status) == null ? void 0 : _c2.type) === "idle") {
            sseAbort.abort();
            const resolve = idleResolve;
            idleResolve = null;
            idleReject = null;
            resolve == null ? void 0 : resolve();
          }
        }
      },
      () => {
        const resolve = idleResolve;
        idleResolve = null;
        idleReject = null;
        resolve == null ? void 0 : resolve();
      },
      () => {
        sseFailed = true;
        const reject = idleReject;
        idleResolve = null;
        idleReject = null;
        reject == null ? void 0 : reject(new Error("SSE \u8FDE\u63A5\u4E2D\u65AD"));
      }
    );
    const timeoutMs = 12e4;
    const timeoutErr = await Promise.race([
      idlePromise.then(() => null),
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error("\u7B49\u5F85\u56DE\u590D\u8D85\u65F6")), timeoutMs)
      )
    ]);
    if (timeoutErr) throw timeoutErr;
    if (signal == null ? void 0 : signal.aborted) throw new DOMException("\u5DF2\u4E2D\u65AD", "AbortError");
    if (sseFailed) throw new Error("SSE \u8FDE\u63A5\u4E2D\u65AD");
    sseAbort.abort();
    const messages = await requestOpenCode(conn.url, `/session/${sessionId}/message?limit=50`, "GET", void 0, conn.authHeader);
    const lastAssistant = [...messages || []].reverse().find((m) => {
      var _a2;
      return ((_a2 = m.info) == null ? void 0 : _a2.role) === "assistant";
    });
    const result = (_d = (_c = (_b = lastAssistant == null ? void 0 : lastAssistant.parts) == null ? void 0 : _b.find((p) => p.type === "text")) == null ? void 0 : _c.text) != null ? _d : "";
    if (result) {
      onTextUpdate == null ? void 0 : onTextUpdate(result, accumulatedThinking);
      return result;
    }
    throw new Error("\u672A\u627E\u5230 assistant \u56DE\u590D");
  } finally {
    try {
      await requestOpenCode(conn.url, `/session/${sessionId}`, "DELETE", void 0, conn.authHeader);
    } catch (e) {
    }
  }
}
function estimateTokens(text) {
  let tokens = 0;
  for (const ch of text) {
    tokens += ch.charCodeAt(0) > 127 ? 1.5 : 0.25;
  }
  return Math.ceil(tokens);
}
async function callAISession(options) {
  const { prompt, settings, vaultDir, signal, onThinking, onTextUpdate } = options;
  if (settings.execMode === "cli") {
    return callAIWithHTTPStreaming(prompt, settings, vaultDir, signal, void 0, onThinking, onTextUpdate);
  }
  const provider = getActiveProvider(settings);
  if (!provider || !provider.apiKey) throw new Error("API Key \u672A\u914D\u7F6E");
  const resp = await callAIWithAPI(
    ensureApiUrl(provider.baseUrl),
    provider.apiKey,
    provider.model,
    [{ role: "system", content: settings.systemPrompt }, { role: "user", content: prompt }],
    settings.maxTokens,
    settings.temperature,
    true,
    signal,
    settings.apiReasoningEffort
  );
  return processAPISSEStream(resp, onThinking, onTextUpdate);
}
function resetMCPSyncDone() {
  mcpSyncDone = false;
}
async function syncMCPServers(settings, vaultDir) {
  var _a, _b;
  if (mcpSyncDone) return;
  const servers = ((_a = settings.mcpServers) == null ? void 0 : _a.filter((s) => s.enabled)) || [];
  if (servers.length === 0) return;
  let conn = readServerConn(vaultDir, settings.opencode.port || 16226);
  if (conn) {
    try {
      await requestOpenCode(conn.url, "/global/health", "GET", void 0, conn.authHeader);
    } catch (e) {
      conn = null;
    }
  }
  if (!conn) {
    try {
      const base = await ensureOpenCodeServer(
        settings.opencode.cliPath,
        settings.opencode.hostname,
        settings.opencode.port,
        vaultDir,
        true
      );
      conn = { url: base, authHeader: ((_b = readServerConn(vaultDir, settings.opencode.port || 16226)) == null ? void 0 : _b.authHeader) || "" };
    } catch (e) {
      return;
    }
  }
  const activeConn = conn;
  for (const server of servers) {
    try {
      const config = { type: server.type };
      if (server.type === "local") {
        if (server.command) config.command = server.command;
        if (server.args) config.args = server.args.split(/\s+/).filter(Boolean);
      } else {
        if (server.url) config.url = server.url;
        if (server.headers) {
          try {
            config.headers = JSON.parse(server.headers);
          } catch (e) {
            config.headers = {};
          }
        }
      }
      await requestOpenCode(activeConn.url, "/mcp", "POST", { name: server.name, config }, activeConn.authHeader);
    } catch (err) {
      console.warn(`MCP server "${server.name}" sync failed:`, err);
    }
  }
  mcpSyncDone = true;
}
var mcpSyncDone;
var init_ai = __esm({
  "src/ai.ts"() {
    "use strict";
    init_constants();
    init_opencode_client();
    init_opencode_server();
    init_api_client();
    init_opencode_server();
    init_opencode_config();
    init_server();
    mcpSyncDone = false;
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => XiaoyuanAIPlugin
});
module.exports = __toCommonJS(main_exports);
var fs4 = __toESM(require("fs/promises"));
var fsSync = __toESM(require("fs"));
var path4 = __toESM(require("path"));
var import_obsidian10 = require("obsidian");
init_constants();

// src/chat-view.ts
var import_obsidian8 = require("obsidian");
init_constants();
init_ai();
init_opencode_config();

// src/connection-checker.ts
init_opencode_config();
init_opencode_server();
init_constants();
async function checkConnection(settings, vaultDir) {
  if (settings.execMode === "cli") {
    let ok = false;
    const status = await checkOpenCodeStatus(settings.opencode.cliPath, vaultDir, settings.opencode.port, settings.opencode.hostname);
    if (status.ok) {
      ok = true;
    } else if (settings.opencode.autoStart) {
      try {
        await ensureOpenCodeServer(settings.opencode.cliPath, settings.opencode.hostname, settings.opencode.port, vaultDir, true);
        ok = true;
      } catch (e) {
      }
    }
    return ok;
  }
  const provider = getActiveProvider(settings);
  if (!provider || !provider.baseUrl || !provider.apiKey) return false;
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
  } catch (e) {
    return false;
  }
}

// src/session.ts
init_constants();
function getChatHistoryPath(chatHistoryPath) {
  return chatHistoryPath || ".chatHistory";
}
function getSessionFilePath(chatHistoryPath, sessionId) {
  return `${getChatHistoryPath(chatHistoryPath)}/${sessionId}.md`;
}
async function ensureChatHistoryFolder(vault, path5) {
  const folder = vault.getFolderByPath(path5);
  if (folder) return;
  try {
    await vault.createFolder(path5);
  } catch (e) {
    if (vault.getFolderByPath(path5)) return;
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
    const thinkingLines = [];
    let inThinking = false;
    let ts;
    const headerRegex = /^\*\*(你|小元)\*\* \((?:CLI|API) · (\d{4}-\d{2}-\d{2} \d{2}:\d{2})\):$/;
    for (const line of lines) {
      const hMatch = line.match(headerRegex);
      if (hMatch) {
        role = hMatch[1] === "\u4F60" ? "user" : "assistant";
        ts = new Date(hMatch[2]).getTime();
        continue;
      }
      if (line.trim() === "> [!thinking] \u601D\u8003\u8FC7\u7A0B") {
        inThinking = true;
        continue;
      }
      if (inThinking) {
        if (line.startsWith("> ")) {
          thinkingLines.push(line.slice(2));
          continue;
        }
        inThinking = false;
      }
      if (role) msgContent += line + "\n";
    }
    if (role && msgContent.trim()) {
      const msg = {
        id: "msg-" + ++idCounter,
        role,
        content: msgContent.trim()
      };
      if (thinkingLines.length > 0) msg.thinking = thinkingLines.join("\n").trim();
      if (ts) msg.timestamp = ts;
      messages.push(msg);
    }
  }
  return messages;
}
function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function formatTime(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function sessionToMarkdown(session, messages, execMode) {
  const now = Date.now();
  const created = (session == null ? void 0 : session.createdAt) || now;
  let content = `---
title: ${(session == null ? void 0 : session.title) || "\u65B0\u5BF9\u8BDD"}
created: ${formatDate(created)}
updated: ${formatDate(now)}
---

`;
  messages.forEach((msg) => {
    const ts = msg.timestamp ? ` (${execMode.toUpperCase()} \xB7 ${formatTime(msg.timestamp)}):` : ":";
    content += `**${msg.role === "user" ? "\u4F60" : "\u5C0F\u5143"}**${ts}

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
  } catch (e) {
  }
  try {
    const files = vault.getFiles().filter((f) => f.path.startsWith(prefix) && f.extension === "md").map((f) => f.path);
    if (files.length > 0) return files;
  } catch (e) {
  }
  return [];
}
async function scanChatHistoryFolder(vault, chatHistoryPath) {
  var _a, _b;
  try {
    const folderPath = getChatHistoryPath(chatHistoryPath);
    const filePaths = await collectSessionFiles(vault, folderPath);
    const loaded = [];
    for (const filePath of filePaths) {
      const name = filePath.split("/").pop();
      if (!name) continue;
      const sessionId = name.replace(".md", "");
      try {
        const content = await vault.adapter.read(filePath);
        const messages = parseMarkdownToMessages(content);
        const match = content.match(/title:\s*(.+)/);
        const title = match ? match[1].trim() : ((_b = (_a = messages[0]) == null ? void 0 : _a.content) == null ? void 0 : _b.slice(0, 30)) || "\u5386\u53F2\u5BF9\u8BDD";
        const matchCreated = content.match(/created:\s*(.+)/);
        const createdAt = matchCreated ? new Date(matchCreated[1]).getTime() : Date.now();
        const matchUpdated = content.match(/updated:\s*(.+)/);
        const updatedAt = matchUpdated ? new Date(matchUpdated[1]).getTime() : Date.now();
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
  } catch (e) {
  }
  try {
    const file = vault.getFiles().find((f) => f.path === filePath);
    if (file) return vault.read(file);
  } catch (e) {
  }
  return null;
}
async function loadSessionFromFile(vault, chatHistoryPath, sessionId) {
  const filePath = getSessionFilePath(chatHistoryPath, sessionId);
  const content = await readVaultFile(vault, filePath);
  if (!content) return [];
  return parseMarkdownToMessages(content);
}
async function saveSessionToFile(vault, chatHistoryPath, sessionId, session, messages, execMode) {
  await ensureChatHistoryFolder(vault, chatHistoryPath);
  const filePath = getSessionFilePath(chatHistoryPath, sessionId);
  const content = sessionToMarkdown(session, messages, execMode);
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
  if (data == null ? void 0 : data[CHAT_SESSIONS_KEY]) {
    try {
      sessions = JSON.parse(data[CHAT_SESSIONS_KEY]);
    } catch (e) {
    }
  }
  if (data == null ? void 0 : data[CURRENT_SESSION_KEY]) {
    currentSessionId = data[CURRENT_SESSION_KEY];
  }
  return { sessions, currentSessionId };
}
async function saveSessionsMeta(plugin, sessions, currentSessionId) {
  const data = await plugin.loadData() || {};
  data[CHAT_SESSIONS_KEY] = JSON.stringify(sessions.map((s) => {
    const { title, id, createdAt, updatedAt } = s;
    return { title, id, createdAt, updatedAt };
  }));
  data[CURRENT_SESSION_KEY] = currentSessionId;
  await plugin.saveData(data);
}
function migrateOldData(data) {
  if (data == null ? void 0 : data["xiaoyuan-chat-history"]) {
    try {
      return JSON.parse(data["xiaoyuan-chat-history"]);
    } catch (e) {
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
  if (options == null ? void 0 : options.fullWidth) {
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
  if (options == null ? void 0 : options.maxHeight) popup.style.maxHeight = options.maxHeight;
  buildContent(popup);
  if ((options == null ? void 0 : options.direction) === "up") {
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
init_constants();
function buildToolbarContent(container, view) {
  var _a, _b;
  const s = view.plugin.settings;
  const attachBtn = container.createSpan({ cls: "xiaoyuan-attach-btn" });
  attachBtn.textContent = "+";
  (0, import_obsidian.setTooltip)(attachBtn, "\u6DFB\u52A0\u9644\u4EF6");
  attachBtn.addEventListener("click", () => view.pickFiles());
  if (s.showContext) {
    const ctxBtn = container.createSpan({ cls: "xiaoyuan-attach-btn" });
    ctxBtn.textContent = "\u{1F4C4}";
    (0, import_obsidian.setTooltip)(ctxBtn, "\u5C06\u81EA\u52A8\u9644\u52A0\u5F53\u524D\u7B14\u8BB0\u4F5C\u4E3A\u4E0A\u4E0B\u6587");
  }
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
  trigger.textContent = s.execMode === "cli" ? s.opencode.model ? s.opencode.model.split("/").pop() || s.opencode.model : "\u6A21\u578B" : ((_a = getActiveProvider(s)) == null ? void 0 : _a.model) || "\u6A21\u578B";
  (0, import_obsidian.setTooltip)(trigger, s.execMode === "cli" ? s.opencode.model || "\u672A\u9009\u62E9" : ((_b = getActiveProvider(s)) == null ? void 0 : _b.model) || "\u672A\u9009\u62E9");
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    showPopup(trigger, async (popup) => {
      if (s.execMode === "cli") {
        let models = s.opencodeModels || [];
        if (models.length === 0) {
          const loadingItem = popup.createDiv({ cls: "xy-popup-item" });
          loadingItem.createSpan({ cls: "xy-popup-label" }).textContent = "\u6B63\u5728\u540C\u6B65\u6A21\u578B\u5217\u8868...";
          await view.syncCLIModels().catch(() => {
          });
          models = s.opencodeModels || [];
          popup.empty();
        }
        if (models.length === 0) {
          const emptyItem = popup.createDiv({ cls: "xy-popup-item" });
          emptyItem.createSpan({ cls: "xy-popup-label" }).textContent = "\u672A\u83B7\u53D6\u5230\u6A21\u578B\u5217\u8868";
          return;
        }
        const groups = /* @__PURE__ */ new Map();
        for (const m of models) {
          const provider = m.value.includes("/") ? m.value.split("/")[0] : "\u5176\u4ED6";
          const list = groups.get(provider);
          if (list) {
            list.push(m);
          } else {
            groups.set(provider, [m]);
          }
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
        popup.createDiv({ cls: "xy-popup-separator" });
        const syncBtn = popup.createDiv({ cls: "xy-popup-item" });
        syncBtn.createSpan({ cls: "xy-popup-label" }).textContent = "\u27F3 \u540C\u6B65\u6A21\u578B\u5217\u8868";
        syncBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          popup.remove();
          view.syncCLIModels();
        });
      } else {
        const providers = s.apiProviders;
        const activeProvider = getActiveProvider(s);
        let hasItem = false;
        for (const p of providers) {
          if (!p.model) continue;
          hasItem = true;
          const label = p.name ? `${p.name}: ${p.model}` : p.model;
          const isActive = p.id === (activeProvider == null ? void 0 : activeProvider.id);
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
  const sendBtn = container.createSpan({ cls: "xiaoyuan-send-btn" });
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

// src/action-bar.ts
var import_obsidian3 = require("obsidian");

// src/action-buttons.ts
var import_obsidian2 = require("obsidian");
var ACTION_LABELS = {
  copy: "\u590D\u5236",
  speak: "\u6717\u8BFB",
  quote: "\u5F15\u7528",
  edit: "\u5728\u7F16\u8F91\u5668\u4E2D\u6253\u5F00",
  undo: "\u64A4\u9500",
  replace: "\u66FF\u6362\u9009\u4E2D\u6587\u672C",
  rename: "\u91CD\u547D\u540D",
  open: "\u5728\u7F16\u8F91\u5668\u4E2D\u6253\u5F00",
  delete: "\u5220\u9664\u6B64\u5BF9\u8BDD",
  aiTools: "\u5C0F\u5143\u5199\u4F5C"
};
var ICON_MAP = {
  copy: "copy",
  speak: "volume-2",
  quote: "quote",
  edit: "notebook-pen",
  undo: "undo",
  replace: "replace",
  rename: "folder-pen",
  open: "notebook-pen",
  delete: "trash-2",
  aiTools: "sparkles"
};
function createActionBtn(type) {
  const btn = document.createElement("span");
  btn.className = "xiaoyuan-msg-action";
  (0, import_obsidian2.setIcon)(btn, ICON_MAP[type]);
  (0, import_obsidian2.setTooltip)(btn, ACTION_LABELS[type]);
  return btn;
}

// src/action-bar.ts
function formatTime2(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function buildActionBar(msgEl, role, content, timestamp, options) {
  const actionsEl = msgEl.createDiv({ cls: "xiaoyuan-msg-actions" });
  if (role === "user") {
    const copyBtn = createActionBtn("copy");
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(content);
      new import_obsidian3.Notice("\u5DF2\u590D\u5236");
    });
    actionsEl.appendChild(copyBtn);
    const speakBtn = createActionBtn("speak");
    speakBtn.addEventListener("click", () => options.onSpeak(content));
    actionsEl.appendChild(speakBtn);
    const quoteBtn = createActionBtn("quote");
    quoteBtn.addEventListener("click", () => options.quote(content));
    actionsEl.appendChild(quoteBtn);
    const undoBtn = createActionBtn("undo");
    undoBtn.addEventListener("click", () => options.undoMessage(msgEl.id));
    actionsEl.appendChild(undoBtn);
    const aiBtn = createActionBtn("aiTools");
    aiBtn.addEventListener("click", (e) => options.onAITools(content, e));
    actionsEl.appendChild(aiBtn);
  } else {
    const copyBtn = createActionBtn("copy");
    copyBtn.addEventListener("click", () => {
      const sel = window.getSelection();
      const selected = sel == null ? void 0 : sel.toString().trim();
      navigator.clipboard.writeText(selected || content);
      new import_obsidian3.Notice("\u5DF2\u590D\u5236");
    });
    actionsEl.appendChild(copyBtn);
    const speakBtn = createActionBtn("speak");
    speakBtn.addEventListener("click", () => options.onSpeak(content));
    actionsEl.appendChild(speakBtn);
    const quoteBtn = createActionBtn("quote");
    quoteBtn.addEventListener("click", () => options.quote(content));
    actionsEl.appendChild(quoteBtn);
    const editBtn = createActionBtn("edit");
    editBtn.addEventListener("click", () => options.openInEditor(content, timestamp));
    actionsEl.appendChild(editBtn);
    const aiBtn = createActionBtn("aiTools");
    aiBtn.addEventListener("click", (e) => options.onAITools(content, e));
    actionsEl.appendChild(aiBtn);
  }
  if (timestamp) {
    actionsEl.createSpan({ cls: "xiaoyuan-msg-time", text: `${options.execMode.toUpperCase()} \xB7 ${formatTime2(timestamp)}` });
  }
}

// src/selection-popup.ts
var import_obsidian4 = require("obsidian");
function registerSelectionListener(container, config) {
  container.addEventListener("mouseup", () => {
    setTimeout(() => {
      const text = config.getSelectedText();
      if (!text) {
        removeSelectionPopup();
        return;
      }
      const pos = config.getPosition();
      if (!pos) return;
      showSelectionPopup(text, pos.x, pos.y, config);
    }, 10);
  });
  document.addEventListener("mousedown", (e) => {
    var _a, _b;
    if (!((_b = (_a = e.target) == null ? void 0 : _a.closest) == null ? void 0 : _b.call(_a, ".xy-selection-popup"))) {
      removeSelectionPopup();
    }
  });
}
function removeSelectionPopup() {
  document.querySelectorAll(".xy-selection-popup").forEach((el) => el.remove());
}
function showSelectionPopup(text, x, y, config) {
  removeSelectionPopup();
  const popup = document.body.createDiv({ cls: "xy-selection-popup" });
  const copyBtn = createActionBtn("copy");
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(text);
    new import_obsidian4.Notice("\u5DF2\u590D\u5236");
    removeSelectionPopup();
  });
  popup.appendChild(copyBtn);
  const speakBtn = createActionBtn("speak");
  speakBtn.addEventListener("click", () => {
    config.onSpeak(text);
    removeSelectionPopup();
  });
  popup.appendChild(speakBtn);
  const quoteBtn = createActionBtn("quote");
  quoteBtn.addEventListener("click", () => {
    config.onQuote(text);
    removeSelectionPopup();
  });
  popup.appendChild(quoteBtn);
  const aiBtn = createActionBtn("aiTools");
  aiBtn.addEventListener("click", (e) => {
    config.onAITools(text, e);
    removeSelectionPopup();
  });
  popup.appendChild(aiBtn);
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
  document.body.appendChild(popup);
}

// src/quote-bar.ts
function renderQuoteBar(attachPreviewEl, state, onRemoveQuote, onRemoveAttachment) {
  attachPreviewEl.empty();
  if (state.quoteText) {
    attachPreviewEl.style.display = "flex";
    const chip = attachPreviewEl.createDiv({ cls: "xiaoyuan-attach-chip xy-quote-chip" });
    chip.textContent = "\u{1F4CE} \u5F15\u7528: " + (state.quoteText.length > 50 ? state.quoteText.slice(0, 50) + "..." : state.quoteText);
    const removeBtn = chip.createSpan({ text: " \u2715" });
    removeBtn.style.cursor = "pointer";
    removeBtn.addEventListener("click", onRemoveQuote);
  }
  for (let i = 0; i < state.attachments.length; i++) {
    const att = state.attachments[i];
    attachPreviewEl.style.display = "flex";
    if (att.type.startsWith("image/") && att.data) {
      const preview = attachPreviewEl.createDiv({ cls: "xiaoyuan-attach-chip" });
      const img = preview.createEl("img", { attr: { src: att.data } });
      img.style.cssText = "max-height:48px;max-width:48px;border-radius:4px;object-fit:cover;";
      const label = preview.createSpan({ text: " " + att.name });
      label.style.cssText = "font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100px;";
      const removeBtn = preview.createSpan({ text: " \xD7" });
      removeBtn.style.cursor = "pointer";
      removeBtn.addEventListener("click", () => onRemoveAttachment(i));
    } else {
      const chip = attachPreviewEl.createDiv({ cls: "xiaoyuan-attach-chip" });
      chip.textContent = att.name.length > 20 ? att.name.slice(0, 17) + "..." : att.name;
      const removeBtn = chip.createSpan({ text: " \xD7" });
      removeBtn.style.cursor = "pointer";
      removeBtn.addEventListener("click", () => onRemoveAttachment(i));
    }
  }
  if (!state.quoteText && state.attachments.length === 0) {
    attachPreviewEl.style.display = "none";
  }
}

// src/attachment.ts
var import_obsidian5 = require("obsidian");
var ACCEPT_TYPES = "image/*,.pdf,.txt,.md,.csv,.json,.yaml,.yml,.xml";
function pickFiles(onFile, maxAttachmentSize) {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = ACCEPT_TYPES;
  input.addEventListener("change", async () => {
    if (input.files) handleFiles(input.files, maxAttachmentSize, onFile);
  });
  input.click();
}
async function handleFiles(files, maxAttachmentSize, onFile) {
  const maxBytes = maxAttachmentSize * 1024 * 1024;
  for (const file of Array.from(files)) {
    if (file.size > maxBytes) {
      new import_obsidian5.Notice(`\u6587\u4EF6\u8FC7\u5927: ${file.name} (\u6700\u5927 ${maxAttachmentSize}MB)`);
      continue;
    }
    try {
      const data = await readFileAsBase64(file);
      onFile(file.name, file.type || "application/octet-stream", data, file.size);
    } catch (e) {
    }
  }
}
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// src/open-in-editor.ts
var import_obsidian6 = require("obsidian");
function simpleHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return (h >>> 0).toString(36);
}
async function openInEditor(content, vault, workspace, chatHistoryPath, ts, source) {
  try {
    const tempRel = `${chatHistoryPath}/temp`;
    try {
      await vault.createFolder(tempRel);
    } catch (e) {
    }
    const d = ts ? new Date(ts) : /* @__PURE__ */ new Date();
    const dateStr = `${String(d.getFullYear())}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
    const hash = simpleHash(content);
    const fileRel = `${tempRel}/msg-${dateStr}-${hash}.md`;
    const title = (content.split("\n")[0] || "\u6D88\u606F").replace(/^#+\s*/, "").slice(0, 50);
    const dateOnly = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const frontmatter = `---
title: ${title}
created: ${dateOnly}${source ? `
source: ${source}` : ""}
---

`;
    const fullContent = frontmatter + content;
    const existing = vault.getAbstractFileByPath(fileRel);
    let file;
    if (existing instanceof import_obsidian6.TFile) {
      await vault.modify(existing, fullContent);
      file = existing;
    } else {
      file = await vault.create(fileRel, fullContent);
    }
    await workspace.getLeaf("tab").openFile(file);
  } catch (err) {
    new import_obsidian6.Notice(`\u6253\u5F00\u5931\u8D25: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// src/speak-controller.ts
var SpeakController = class {
  constructor() {
    this.utterance = null;
    this.generation = 0;
    this.onChange = null;
  }
  start(text) {
    if (typeof speechSynthesis === "undefined") {
      console.warn("[xiaoyuanAI] speechSynthesis API not available in this environment");
      this.notifyChange(false);
      return;
    }
    this.stop();
    if (!text.trim()) return;
    const gen = ++this.generation;
    try {
      const cleanText = text.replace(/[#*_`\[\]]/g, "");
      this.utterance = new SpeechSynthesisUtterance(cleanText);
      this.utterance.lang = "zh-CN";
      this.utterance.rate = 1;
      this.utterance.onend = () => {
        if (this.generation !== gen) return;
        this.notifyChange(false);
      };
      this.utterance.onerror = (e) => {
        if (this.generation !== gen) return;
        if (e.error !== "canceled" && e.error !== "interrupted") {
          console.warn("[xiaoyuanAI] speechSynthesis error:", e.error);
        }
        this.notifyChange(false);
      };
      speechSynthesis.speak(this.utterance);
      this.notifyChange(true);
    } catch (err) {
      console.warn("[xiaoyuanAI] failed to start speech synthesis:", err);
      this.utterance = null;
      this.notifyChange(false);
    }
  }
  stop() {
    this.generation++;
    if (typeof speechSynthesis !== "undefined") {
      try {
        speechSynthesis.cancel();
      } catch (err) {
        console.warn("[xiaoyuanAI] speechSynthesis.cancel failed:", err);
      }
    }
    this.utterance = null;
    this.notifyChange(false);
  }
  notifyChange(speaking) {
    var _a;
    try {
      (_a = this.onChange) == null ? void 0 : _a.call(this, speaking);
    } catch (err) {
      console.warn("[xiaoyuanAI] onChange callback failed:", err);
    }
  }
};

// src/modals.ts
var import_obsidian7 = require("obsidian");
init_ai();
init_constants();
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
var TextOperationModal = class extends import_obsidian7.Modal {
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
    modalEl.style.height = Math.round(window.innerHeight * 0.75) + "px";
    const headerRow = contentEl.createDiv({ cls: "xiaoyuan-modal-header" });
    this.titleEl = headerRow.createEl("h3", { text: `AI ${OPERATION_LABELS[this.operation]}` });
    this.modeLabel = headerRow.createSpan({ cls: "xiaoyuan-modal-mode-label" });
    this.modeLabel.textContent = this.plugin.settings.execMode === "cli" ? "CLI" : "API";
    headerRow.style.cursor = "move";
    makeDraggable(headerRow, modalEl);
    this.thinkingBarEl = contentEl.createDiv({ cls: "xiaoyuan-thinking-bar" });
    this.contentAreaEl = contentEl.createDiv({ cls: "xiaoyuan-modal-content-area", text: "\u5DF2\u8FDE\u63A5\uFF0C\u7B49\u5F85\u54CD\u5E94..." });
    const btnRow = contentEl.createDiv({ cls: "xiaoyuan-modal-btn-row" });
    const leftGroup = btnRow.createDiv({ cls: "xy-modal-btn-group" });
    const rightGroup = btnRow.createDiv({ cls: "xy-modal-btn-group" });
    const replaceBtn = createActionBtn("replace");
    replaceBtn.addEventListener("click", () => {
      const editor = this.plugin.getActiveEditor();
      if (editor) {
        editor.replaceSelection(this.contentAreaEl.textContent || "");
        new import_obsidian7.Notice("\u5DF2\u66FF\u6362");
      } else new import_obsidian7.Notice("\u672A\u627E\u5230\u6D3B\u52A8\u7F16\u8F91\u5668");
      this.close();
    });
    leftGroup.appendChild(replaceBtn);
    const copyBtn = createActionBtn("copy");
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(this.contentAreaEl.textContent || "");
      new import_obsidian7.Notice("\u5DF2\u590D\u5236");
    });
    leftGroup.appendChild(copyBtn);
    const openBtn = createActionBtn("edit");
    openBtn.addEventListener("click", () => {
      const content = this.contentAreaEl.textContent || "";
      if (!content.trim()) return;
      openInEditor(content, this.app.vault, this.app.workspace, this.plugin.settings.chatHistoryPath, void 0, "modal");
      this.close();
    });
    leftGroup.appendChild(openBtn);
    this.toolsBtn = createActionBtn("aiTools");
    this.toolsBtn.addEventListener("click", (e) => this.showAIToolsMenu(e));
    leftGroup.appendChild(this.toolsBtn);
    const closeBtn = rightGroup.createEl("button", { text: "\u5173\u95ED", cls: "xiaoyuan-btn-secondary" });
    closeBtn.addEventListener("click", () => this.close());
    if (this.inputText) {
      this.processOperation();
    } else {
      this.contentAreaEl.contentEditable = "true";
    }
    registerSelectionListener(this.contentAreaEl, {
      getSelectedText: () => {
        var _a;
        return ((_a = window.getSelection()) == null ? void 0 : _a.toString().trim()) || "";
      },
      getPosition: () => {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount || !this.contentAreaEl.contains(sel.anchorNode)) return null;
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        return { x: rect.left + rect.width / 2 - 60, y: rect.top - 36 };
      },
      onSpeak: (text) => {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text.replace(/[#*_`\[\]]/g, ""));
        u.lang = "zh-CN";
        speechSynthesis.speak(u);
      },
      onQuote: (text) => {
        let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT).first();
        if (!leaf) {
          const leafRight = this.app.workspace.getRightLeaf(false);
          if (leafRight) {
            leafRight.setViewState({ type: VIEW_TYPE_XIAOYUAN_AI_CHAT, active: true });
            leaf = leafRight;
          }
        }
        if (leaf) this.app.workspace.revealLeaf(leaf);
        if (leaf == null ? void 0 : leaf.view) {
          leaf.view.quote(text);
        }
      },
      onAITools: (text, e) => {
        if (!text.trim()) return;
        const menu = new import_obsidian7.Menu();
        OPERATIONS.forEach((op) => {
          menu.addItem((item) => {
            item.setTitle(OPERATION_LABELS[op]);
            item.setIcon(OPERATION_ICONS[op]);
            item.onClick(() => {
              this.titleEl.textContent = `AI ${OPERATION_LABELS[op]}`;
              this.contentAreaEl.textContent = text;
              this.operation = op;
              this.inputText = text;
              this.processOperation();
            });
          });
        });
        menu.showAtMouseEvent(e);
      }
    });
  }
  showAIToolsMenu(e) {
    const menu = new import_obsidian7.Menu();
    OPERATIONS.forEach((op) => {
      menu.addItem((item) => {
        item.setTitle(OPERATION_LABELS[op]);
        item.setIcon(OPERATION_ICONS[op]);
        item.onClick(() => this.reprocessWith(op));
      });
    });
    menu.showAtMouseEvent(e);
  }
  async reprocessWith(operation) {
    const fullText = this.contentAreaEl.textContent || "";
    if (!fullText.trim()) {
      new import_obsidian7.Notice("\u5185\u5BB9\u4E3A\u7A7A\uFF0C\u8BF7\u5148\u8F93\u5165\u5185\u5BB9");
      return;
    }
    const sel = window.getSelection();
    let textToProcess = "";
    if (sel && sel.rangeCount > 0 && this.contentAreaEl.contains(sel.anchorNode)) {
      textToProcess = sel.toString().trim();
    }
    if (!textToProcess) textToProcess = fullText;
    this.titleEl.textContent = `AI ${OPERATION_LABELS[operation]}`;
    this.contentAreaEl.textContent = "\u5DF2\u8FDE\u63A5\uFF0C\u7B49\u5F85\u54CD\u5E94...";
    this.contentAreaEl.contentEditable = "false";
    this.toolsBtn.toggleClass("is-disabled", true);
    this.thinkingBarEl.classList.add("is-active");
    try {
      const s = this.plugin.settings;
      const prompt = OPERATION_PROMPTS[operation] + textToProcess;
      const vaultDir = getVaultBasePath();
      const result = await callAISession({
        prompt,
        settings: s,
        vaultDir,
        onThinking: (text) => {
          this.contentAreaEl.textContent = `\u601D\u8003\u4E2D... ${text}`;
        },
        onTextUpdate: (text) => {
          this.contentAreaEl.textContent = text;
        }
      });
      this.contentAreaEl.textContent = result;
      this.contentAreaEl.contentEditable = "true";
    } catch (err) {
      this.contentAreaEl.textContent = `\u274C \u9519\u8BEF\uFF1A${err instanceof Error ? err.message : String(err)}`;
    } finally {
      this.toolsBtn.toggleClass("is-disabled", false);
      this.thinkingBarEl.classList.remove("is-active");
    }
  }
  async processOperation() {
    this.toolsBtn.toggleClass("is-disabled", true);
    this.thinkingBarEl.classList.add("is-active");
    try {
      const s = this.plugin.settings;
      const prompt = OPERATION_PROMPTS[this.operation] + this.inputText;
      const vaultDir = getVaultBasePath();
      const result = await callAISession({
        prompt,
        settings: s,
        vaultDir,
        onThinking: (text) => {
          this.contentAreaEl.textContent = `\u601D\u8003\u4E2D... ${text}`;
        },
        onTextUpdate: (text) => {
          this.contentAreaEl.textContent = text;
        }
      });
      this.contentAreaEl.textContent = result;
      this.contentAreaEl.contentEditable = "true";
    } catch (err) {
      this.contentAreaEl.textContent = `\u274C \u9519\u8BEF\uFF1A${err instanceof Error ? err.message : String(err)}`;
    } finally {
      this.toolsBtn.toggleClass("is-disabled", false);
      this.thinkingBarEl.classList.remove("is-active");
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/chat-view.ts
var XiaoyuanAIChatView = class extends import_obsidian8.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.messages = [];
    this.lastDateKey = "";
    this.sessions = [];
    this.currentSessionId = "";
    this.msgIdCounter = 0;
    this.abortController = null;
    this.pendingDiffs = null;
    this.connectionStatusEl = null;
    this.attachments = [];
    this.quoteText = "";
    this.speakController = new SpeakController();
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
    this.speakController.onChange = (speaking) => {
      this.speakIndicator.style.display = speaking ? "" : "none";
    };
    this.thinkingBarEl = this.viewContainer.createDiv({ cls: "xiaoyuan-thinking-bar" });
    this.messagesEl = this.viewContainer.createDiv({ cls: "xiaoyuan-chat-messages" });
    this.buildInputArea();
    registerSelectionListener(this.messagesEl, {
      getSelectedText: () => {
        var _a;
        return ((_a = window.getSelection()) == null ? void 0 : _a.toString().trim()) || "";
      },
      getPosition: () => {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount || !this.messagesEl.contains(sel.anchorNode)) return null;
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        return { x: rect.left + rect.width / 2 - 60, y: rect.top - 36 };
      },
      onSpeak: (text) => this.speakController.start(text),
      onQuote: (text) => this.quote(text),
      onAITools: (text, e) => this.showAIToolsForContent(text, e)
    });
    if (this.plugin.settings.execMode === "cli") {
      this.syncCLIModels();
    } else {
      this.checkConnectionStatus();
    }
    await this.loadSessions();
  }
  async onClose() {
    this.speakController.stop();
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.pendingDiffs = null;
    await this.saveCurrentSession();
    this.viewContainer.empty();
  }
  async newChat() {
    await this.saveCurrentSession();
    await this.createNewSession();
  }
  async addMessage(role, content) {
    const id = "msg-" + ++this.msgIdCounter;
    const now = Date.now();
    this.messages.push({ id, role, content, timestamp: now });
    this.addDateHeaderIfNeeded(now);
    this.messagesEl.appendChild(await this.renderMessageEl(id, role, content, false, void 0, now));
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
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
    this.speakIndicator = left.createSpan({ cls: "xy-speak-indicator" });
    (0, import_obsidian8.setTooltip)(this.speakIndicator, "\u505C\u6B62\u6717\u8BFB");
    this.speakIndicator.style.display = "none";
    this.speakIndicator.addEventListener("click", () => this.speakController.stop());
    const newChatBtn = left.createSpan({ cls: "xiaoyuan-new-chat-icon" });
    (0, import_obsidian8.setIcon)(newChatBtn, "message-square-plus");
    (0, import_obsidian8.setTooltip)(newChatBtn, "\u65B0\u5EFA\u5BF9\u8BDD");
    newChatBtn.addEventListener("click", () => this.newChat());
    this.sessionSelector = left.createSpan({ cls: "xiaoyuan-session-selector" });
    (0, import_obsidian8.setTooltip)(this.sessionSelector, "\u70B9\u51FB\u9009\u62E9\u4F1A\u8BDD");
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
    (0, import_obsidian8.setTooltip)(modeText, "\u70B9\u51FB\u5207\u6362\u6267\u884C\u6A21\u5F0F");
    modeText.addEventListener("click", (e) => {
      e.stopPropagation();
      showPopup(modeText, (popup) => {
        addPopupItem(popup, "API", s.execMode === "api", () => {
          s.execMode = "api";
          this.plugin.saveSettings().then(() => {
            this.rebuildHeader();
            this.rebuildToolbar();
            this.addSystemMessage("\u2705 \u5DF2\u5207\u6362\u5230 API \u6A21\u5F0F");
            new import_obsidian8.Notice("\u5DF2\u5207\u6362\u5230 API \u6A21\u5F0F");
          });
        });
        addPopupItem(popup, "CLI", s.execMode === "cli", () => {
          s.execMode = "cli";
          this.plugin.saveSettings().then(() => {
            this.rebuildHeader();
            this.rebuildToolbar();
            this.addSystemMessage("\u2705 \u5DF2\u5207\u6362\u5230 CLI \u6A21\u5F0F");
            new import_obsidian8.Notice("\u5DF2\u5207\u6362\u5230 CLI \u6A21\u5F0F");
          });
        });
      });
    });
    const settingsIcon = right.createSpan({ cls: "xiaoyuan-settings-icon" });
    (0, import_obsidian8.setIcon)(settingsIcon, "settings");
    (0, import_obsidian8.setTooltip)(settingsIcon, "\u8BBE\u7F6E");
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
      if (e.key === "Escape") {
        document.querySelectorAll(".xy-skill-popup").forEach((el) => el.remove());
      }
    });
    this.inputEl.addEventListener("input", () => this.handleSkillInput());
    container.addEventListener("dragenter", (e) => {
      e.preventDefault();
      container.addClass("xy-drag-over");
    });
    container.addEventListener("dragover", (e) => {
      e.preventDefault();
    });
    container.addEventListener("dragleave", () => {
      container.removeClass("xy-drag-over");
    });
    container.addEventListener("drop", (e) => {
      var _a, _b;
      e.preventDefault();
      container.removeClass("xy-drag-over");
      if ((_b = (_a = e.dataTransfer) == null ? void 0 : _a.files) == null ? void 0 : _b.length) handleFiles(e.dataTransfer.files, this.plugin.settings.maxAttachmentSize, (name, type, data, size) => {
        this.attachments.push({ name, type, data, size });
        this.renderQuoteBar();
      });
    });
  }
  handleSkillInput() {
    document.querySelectorAll(".xy-skill-popup").forEach((el) => el.remove());
    const text = this.inputEl.value;
    if (!text.startsWith("/") || text.length < 2) return;
    const query = text.slice(1);
    const matched = this.plugin.settings.skills.filter(
      (s) => s.name.toLowerCase().includes(query.toLowerCase())
    );
    if (matched.length === 0) return;
    const parentEl = this.inputEl.parentElement;
    if (!parentEl) return;
    const popup = parentEl.createDiv({ cls: "xy-skill-popup" });
    for (const skill of matched) {
      const item = popup.createDiv({ cls: "xy-skill-popup-item" });
      item.createSpan({ cls: "xy-skill-popup-name", text: skill.name });
      item.createSpan({ cls: "xy-skill-popup-desc", text: skill.description });
      item.addEventListener("click", () => {
        this.inputEl.value = "/" + skill.name + " ";
        this.inputEl.focus();
        popup.remove();
      });
    }
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
        await ensureOpenCodeServer(s.opencode.cliPath, s.opencode.hostname, s.opencode.port, getVaultBasePath(), true).catch((e) => {
          console.warn("opencode \u81EA\u52A8\u542F\u52A8\u5931\u8D25:", e);
        });
      }
      const result = await fetchOpenCodeModelsFromCLI(s.opencode.cliPath, getVaultBasePath(), s.opencode.port);
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
        new import_obsidian8.Notice("\u672A\u627E\u5230\u6A21\u578B\uFF0C\u8BF7\u68C0\u67E5 opencode \u914D\u7F6E");
      } else {
        new import_obsidian8.Notice(`\u5DF2\u540C\u6B65 ${result.models.length} \u4E2A\u6A21\u578B`);
      }
      this.updateConnectionStatusUI(true);
      syncMCPServers(s, getVaultBasePath()).catch(() => {
      });
    } catch (err) {
      this.updateConnectionStatusUI(false);
      new import_obsidian8.Notice(`\u540C\u6B65\u6A21\u578B\u5931\u8D25\uFF1A${err instanceof Error ? err.message : String(err)}`);
    }
  }
  async checkConnectionStatus() {
    const ok = await checkConnection(this.plugin.settings, getVaultBasePath());
    this.updateConnectionStatusUI(ok);
  }
  updateConnectionStatusUI(ok) {
    if (!this.connectionStatusEl) return;
    const mode = this.plugin.settings.execMode;
    this.connectionStatusEl.style.cssText = `display:inline-block;width:8px;height:8px;border-radius:50%;cursor:pointer;background:${ok ? "var(--color-green)" : "var(--color-red)"};`;
    const tip = mode === "cli" ? ok ? "opencode \u53EF\u7528" : "opencode \u4E0D\u53EF\u7528" : ok ? "API \u8FDE\u63A5\u6B63\u5E38" : "API \u672A\u8FDE\u63A5";
    (0, import_obsidian8.setTooltip)(this.connectionStatusEl, tip);
  }
  // ─── Message rendering ───────────────────────────────────────────
  async renderMessageEl(id, role, content, streaming = false, thinking, timestamp) {
    const msgEl = createDiv({ cls: `xiaoyuan-msg xiaoyuan-msg-${role}` });
    msgEl.id = id;
    const bubbleEl = msgEl.createDiv({ cls: "xiaoyuan-msg-bubble" });
    if (role === "user") {
      const hasImage = /!\[.*?\]\(data:image/.test(content);
      if (hasImage) {
        const mdContainer = bubbleEl.createDiv({ cls: "xy-obsidian-md" });
        await this.renderObsidianMD(mdContainer, content.trim());
      } else {
        bubbleEl.createSpan().textContent = content;
      }
    } else {
      const s = this.plugin.settings;
      if (thinking && s.showThinking) {
        const detailsEl = bubbleEl.createEl("details", { cls: "xiaoyuan-thinking" });
        detailsEl.createEl("summary", { text: "\u{1F914} \u601D\u8003\u8FC7\u7A0B" });
        const tc = detailsEl.createDiv({ cls: "xiaoyuan-thinking-content" });
        tc.textContent = thinking.trim();
      }
      const mdContainer = bubbleEl.createDiv({ cls: "xy-obsidian-md" });
      await this.renderObsidianMD(mdContainer, content.trim());
      this.enhanceCodeBlocks(bubbleEl);
    }
    if (!streaming) {
      buildActionBar(msgEl, role, content, timestamp, {
        execMode: this.plugin.settings.execMode,
        undoMessage: (id2) => this.undoMessage(id2),
        openInEditor: (c, ts) => this.openInEditor(c, ts),
        quote: (text) => this.quote(text),
        onSpeak: (text) => this.speakController.start(text),
        onAITools: (c, e) => this.showAIToolsForContent(c, e)
      });
    }
    return msgEl;
  }
  sanitizeForRender(md) {
    const blocks = [];
    const noCode = md.replace(/```[\s\S]*?```/g, (m) => {
      blocks.push(m);
      return `\0CODERAW${blocks.length - 1}\0`;
    });
    const safe = noCode.replace(/!\[\[/g, "!\u200B[[");
    return safe.replace(/\x00CODERAW(\d+)\x00/g, (_, i) => blocks[+i]);
  }
  enhanceCodeBlocks(container) {
    var _a;
    if (!container.isConnected) return;
    (_a = window.Prism) == null ? void 0 : _a.highlightAllUnder(container);
    container.querySelectorAll("pre").forEach((pre) => {
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
  }
  async renderObsidianMD(container, md) {
    const safe = this.sanitizeForRender(md);
    const sourcePath = `${this.plugin.settings.chatHistoryPath}/session.md`;
    await import_obsidian8.MarkdownRenderer.render(
      this.app,
      safe,
      container,
      sourcePath,
      this
    );
    container.querySelectorAll("table").forEach((table) => {
      var _a;
      const wrapper = document.createElement("div");
      wrapper.style.overflowX = "auto";
      wrapper.style.maxWidth = "100%";
      (_a = table.parentNode) == null ? void 0 : _a.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }
  async openInEditor(content, ts) {
    await openInEditor(content, this.app.vault, this.app.workspace, this.plugin.settings.chatHistoryPath, ts, "bubble");
  }
  quote(text) {
    this.quoteText = text;
    this.renderQuoteBar();
    this.inputEl.focus();
  }
  renderQuoteBar() {
    renderQuoteBar(this.attachPreviewEl, {
      quoteText: this.quoteText,
      attachments: this.attachments
    }, () => {
      this.quoteText = "";
      this.renderQuoteBar();
    }, (i) => {
      this.attachments.splice(i, 1);
      this.renderQuoteBar();
    });
  }
  addWelcomeMessage() {
    const s = this.plugin.settings;
    const modeInfo = s.execMode === "cli" ? "\u5F53\u524D\u6A21\u5F0F\uFF1ACLI\uFF08opencode run\uFF09" : "\u5F53\u524D\u6A21\u5F0F\uFF1AAPI\uFF08\u76F4\u63A5\u8C03\u7528\uFF09";
    const msgEl = this.messagesEl.createDiv({ cls: "xiaoyuan-msg xiaoyuan-msg-assistant xiaoyuan-welcome" });
    const bubble = msgEl.createDiv({ cls: "xiaoyuan-msg-bubble" });
    bubble.createEl("span", { text: "\u{1F44B} \u4F60\u597D\uFF01\u6211\u662F\u5C0F\u5143\u3002" });
    bubble.createEl("br");
    bubble.createEl("br");
    bubble.createEl("span", { text: modeInfo });
    bubble.createEl("br");
    bubble.createEl("br");
    bubble.createEl("span", { text: "\u6211\u53EF\u4EE5\u5E2E\u4F60\uFF1A" });
    bubble.createEl("br");
    bubble.createEl("span", { text: "\u2022 \u{1F4AC} \u804A\u5929\u5BF9\u8BDD" });
    bubble.createEl("br");
    bubble.createEl("span", { text: "\u2022 \u270D\uFE0F \u6DA6\u8272\u3001\u603B\u7ED3\u3001\u8865\u5168\u7B14\u8BB0" });
    bubble.createEl("br");
    bubble.createEl("span", { text: "\u2022 \u{1F50D} \u67E5\u8BE2\u7EF4\u57FA\u77E5\u8BC6" });
    bubble.createEl("br");
    bubble.createEl("br");
    bubble.createEl("span", { text: "\u9009\u4E2D\u6587\u672C\u540E\u53F3\u952E \u2192 \u4F7F\u7528 AI \u64CD\u4F5C\u3002" });
  }
  addSystemMessage(text) {
    const msgEl = this.messagesEl.createDiv({ cls: "xiaoyuan-msg xiaoyuan-msg-system" });
    msgEl.createDiv({ cls: "xiaoyuan-msg-bubble" }).textContent = text;
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return msgEl;
  }
  addDateHeaderIfNeeded(timestamp) {
    const dateKey = getDateKey(timestamp);
    if (dateKey !== this.lastDateKey) {
      this.lastDateKey = dateKey;
      const headerEl = this.messagesEl.createDiv({ cls: "xiaoyuan-msg xiaoyuan-msg-system xiaoyuan-date-header" });
      headerEl.createDiv({ cls: "xiaoyuan-msg-bubble" }).textContent = formatDateWeekday(timestamp);
    }
  }
  async truncateMessagesIfNeeded() {
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
    const msgEls = Array.from(this.messagesEl.querySelectorAll(".xiaoyuan-msg"));
    let removedFromDom = 0;
    for (const el of msgEls) {
      if (removedFromDom >= removed) break;
      if (el.classList.contains("xiaoyuan-welcome") || el.classList.contains("xiaoyuan-msg-system")) continue;
      el.remove();
      removedFromDom++;
    }
    this.messages = this.messages.slice(removed);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    this.addSystemMessage(`\u5DF2\u81EA\u52A8\u622A\u65AD ${removed} \u6761\u5386\u53F2\u6D88\u606F\u4EE5\u63A7\u5236 Token \u7528\u91CF`);
  }
  showAIToolsForContent(content, e) {
    const menu = new import_obsidian8.Menu();
    OPERATIONS.forEach((op) => {
      menu.addItem((item) => {
        item.setTitle(OPERATION_LABELS[op]);
        item.setIcon(OPERATION_ICONS[op]);
        item.onClick(() => new TextOperationModal(this.app, this.plugin, op, content).open());
      });
    });
    menu.showAtMouseEvent(e);
  }
  // ─── Send / AI ───────────────────────────────────────────────────
  async sendMessage() {
    if (this.abortController) return;
    let text = this.inputEl.value.trim();
    if (!text) return;
    if (this.quoteText) {
      text = `> ${this.quoteText}

${text}`;
      this.quoteText = "";
      this.renderQuoteBar();
    }
    const skillMatch = text.match(/^\/(\S+)\s*(.*)/);
    if (skillMatch) {
      const skillName = skillMatch[1];
      const skill = this.plugin.settings.skills.find((s) => s.name === skillName);
      if (skill) {
        text = skillMatch[2] || skill.description;
        text = `[Skill: ${skill.name} - ${skill.description}]

${text}`;
      }
    }
    await this.addMessage("user", text);
    this.updateSessionTitle();
    this.inputEl.value = "";
    this.abortController = new AbortController();
    this.pendingDiffs = null;
    this.setProcessingState(true);
    let statusMsg = null;
    try {
      await this.truncateMessagesIfNeeded();
      if (this.plugin.settings.execMode === "cli") {
        statusMsg = this.addSystemMessage("\u6B63\u5728\u8FDE\u63A5 opencode...");
      }
      const response = await this.callAI(text, this.abortController.signal, statusMsg);
      this.attachments = [];
      this.renderQuoteBar();
      if (statusMsg) statusMsg.remove();
      if (this.plugin.settings.execMode === "cli") {
        const streamId = await this.finalizeStreamingMessage();
        await this.saveCurrentSession();
        const actualDiffs = this.pendingDiffs;
        if (this.plugin.settings.showDiffPreview && streamId && (actualDiffs == null ? void 0 : actualDiffs.length)) {
          const diffs = actualDiffs;
          this.renderDiffs(streamId, diffs);
          await this.saveCurrentSession();
        }
      } else {
        const finalized = await this.finalizeStreamingMessage();
        if (!finalized && response) {
          this.addMessage("assistant", response);
        }
        await this.saveCurrentSession();
      }
    } catch (err) {
      if (statusMsg) statusMsg.remove();
      if (err instanceof DOMException && err.name === "AbortError") {
        for (let i = this.messages.length - 1; i >= 0; i--) {
          if (this.messages[i].role === "user") {
            this.restoreMessage(this.messages[i].id);
            break;
          }
        }
        this.addSystemMessage("\u23F9 \u5DF2\u4E2D\u65AD");
      } else {
        this.addMessage("assistant", `\u274C \u9519\u8BEF\uFF1A${err instanceof Error ? err.message : String(err)}`);
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
    if (s.showContext) {
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile) {
        const fileName = activeFile.path;
        const fileContent = await this.app.vault.read(activeFile).catch(() => "");
        const contextPreview = fileContent.length > 500 ? fileContent.slice(0, 500) + "\n... (\u5185\u5BB9\u5DF2\u622A\u65AD)" : fileContent;
        enrichedMessage = `[\u5F53\u524D\u7B14\u8BB0: ${fileName}]
\`\`\`
${contextPreview}
\`\`\`

---

${enrichedMessage}`;
      }
    }
    if (s.execMode === "cli") {
      const vaultDir2 = getVaultBasePath();
      if (s.opencode.autoStart) {
        try {
          await ensureOpenCodeServer(s.opencode.cliPath, s.opencode.hostname, s.opencode.port, vaultDir2, true);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          new import_obsidian8.Notice(`\u26A0 \u542F\u52A8 opencode \u5931\u8D25: ${msg}`);
          throw new Error(`\u65E0\u6CD5\u542F\u52A8 opencode serve: ${msg}`);
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
      const prompt2 = allMessages.map((m) => `${m.role === "system" ? "[\u7CFB\u7EDF]" : m.role === "user" ? "[\u7528\u6237]" : "[\u52A9\u624B]"}: ${m.content}`).join("\n\n");
      let streamingId2 = "";
      const updateThinking2 = (text) => {
        if (streamingId2) {
          this.updateStreamingThinking(streamingId2, text);
        } else {
          streamingId2 = this.addStreamingMessage("", text);
        }
      };
      return callAIWithHTTPStreaming(
        prompt2,
        s,
        vaultDir2,
        signal,
        () => {
          if (statusMsg) {
            const bubble = statusMsg.querySelector(".xiaoyuan-msg-bubble");
            if (bubble) bubble.textContent = "\u5DF2\u8FDE\u63A5\uFF0C\u7B49\u5F85\u54CD\u5E94...";
          }
        },
        (text) => {
          updateThinking2(text);
        },
        (text) => {
          if (statusMsg) {
            statusMsg.remove();
            statusMsg = null;
          }
          if (!streamingId2) {
            streamingId2 = this.addStreamingMessage(text, "");
          } else {
            this.updateStreamingMessage(streamingId2, text);
          }
        },
        (diffs) => {
          this.pendingDiffs = diffs;
        },
        (tool, status) => {
          if (streamingId2) this.addToolLogEntry(streamingId2, tool, status);
        }
      );
    }
    const provider = getActiveProvider(s);
    if (!provider || !provider.apiKey) throw new Error("API Key \u672A\u914D\u7F6E\u3002\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199\u3002");
    const modeIdentity = "\n\n\u5F53\u524D\u6A21\u5F0F\uFF1AAPI | \u6A21\u578B\uFF1A" + provider.model + " | \u63D0\u4F9B\u5546\uFF1A" + provider.name;
    const messages = [
      { role: "system", content: s.systemPrompt + modeIdentity },
      ...this.messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: enrichedMessage }
    ];
    const prompt = messages.map((m) => `${m.role === "system" ? "[\u7CFB\u7EDF]" : m.role === "user" ? "[\u7528\u6237]" : "[\u52A9\u624B]"}: ${m.content}`).join("\n\n");
    const vaultDir = getVaultBasePath();
    let streamingId = "";
    const updateThinking = (text) => {
      if (streamingId) {
        this.updateStreamingThinking(streamingId, text);
      } else {
        streamingId = this.addStreamingMessage("", text);
      }
    };
    return callAISession({
      prompt,
      settings: s,
      vaultDir,
      signal,
      onThinking: updateThinking,
      onTextUpdate: (text) => {
        if (statusMsg) {
          statusMsg.remove();
          statusMsg = null;
        }
        if (!streamingId) {
          streamingId = this.addStreamingMessage(text, "");
        } else {
          this.updateStreamingMessage(streamingId, text);
        }
      }
    });
  }
  addStreamingMessage(content, thinking) {
    const id = "msg-" + ++this.msgIdCounter;
    const now = Date.now();
    this.messages.push({ id, role: "assistant", content, thinking, timestamp: now });
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
    buildActionBar(msgEl, "assistant", content, now, {
      execMode: this.plugin.settings.execMode,
      undoMessage: (id2) => this.undoMessage(id2),
      openInEditor: (c, ts) => this.openInEditor(c, ts),
      quote: (text) => this.quote(text),
      onSpeak: (text) => this.speakController.start(text),
      onAITools: (c, e) => this.showAIToolsForContent(c, e)
    });
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return id;
  }
  updateStreamingMessage(messageId, content) {
    const msgEl = this.messagesEl.querySelector(`[id="${messageId}"]`);
    if (!msgEl) return;
    const contentEl = msgEl.querySelector(".xy-stream-content");
    if (contentEl) contentEl.textContent = content;
    const idx = this.messages.findIndex((m) => m.id === messageId);
    if (idx !== -1) this.messages[idx].content = content;
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }
  updateStreamingThinking(messageId, thinking) {
    const msgEl = this.messagesEl.querySelector(`[id="${messageId}"]`);
    if (!msgEl || !this.plugin.settings.showThinking) return;
    let tc = msgEl.querySelector(".xiaoyuan-thinking-content");
    const idx = this.messages.findIndex((m) => m.id === messageId);
    if (idx !== -1) this.messages[idx].thinking = thinking;
    if (tc) {
      tc.textContent = thinking;
    } else {
      const bubbleEl = msgEl.querySelector(".xiaoyuan-msg-bubble");
      if (!bubbleEl) return;
      const detailsEl = document.createElement("details");
      detailsEl.className = "xiaoyuan-thinking";
      detailsEl.createEl("summary", { text: "\u{1F914} \u601D\u8003\u8FC7\u7A0B" });
      tc = detailsEl.createDiv({ cls: "xiaoyuan-thinking-content" });
      tc.textContent = thinking;
      bubbleEl.prepend(detailsEl);
    }
  }
  addToolLogEntry(messageId, toolName, status) {
    const msgEl = this.messagesEl.querySelector(`[id="${messageId}"]`);
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
  async finalizeStreamingMessage() {
    const lastMsg = this.messages[this.messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return null;
    const msgEl = this.messagesEl.querySelector(`[id="${lastMsg.id}"]`);
    if (!msgEl) return null;
    const bubbleEl = msgEl.querySelector(".xiaoyuan-msg-bubble");
    if (!bubbleEl) return null;
    const streamContent = bubbleEl.querySelector(".xy-stream-content");
    const existingThinking = bubbleEl.querySelector(".xiaoyuan-thinking");
    if (streamContent) streamContent.remove();
    if (existingThinking) existingThinking.remove();
    const hasContent = lastMsg.content.trim().length > 0;
    const displayContent = hasContent ? lastMsg.content.trim() : (lastMsg.thinking || "").trim();
    if (!displayContent) return lastMsg.id;
    const mdContainer = bubbleEl.createDiv({ cls: "xy-obsidian-md" });
    await this.renderObsidianMD(mdContainer, displayContent);
    if (hasContent && lastMsg.thinking && this.plugin.settings.showThinking) {
      const detailsEl = bubbleEl.createEl("details", { cls: "xiaoyuan-thinking" });
      detailsEl.createEl("summary", { text: "\u{1F914} \u601D\u8003\u8FC7\u7A0B" });
      const tc = detailsEl.createDiv({ cls: "xiaoyuan-thinking-content" });
      tc.textContent = lastMsg.thinking.trim();
      bubbleEl.prepend(detailsEl);
    }
    this.enhanceCodeBlocks(bubbleEl);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return lastMsg.id;
  }
  renderDiffs(messageId, diffs) {
    var _a, _b;
    const msgEl = this.messagesEl.querySelector(`[id="${messageId}"]`);
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
        const b = (_a = beforeLines[i]) != null ? _a : "";
        const a = (_b = afterLines[i]) != null ? _b : "";
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
    var _a, _b;
    try {
      const path5 = getChatHistoryPath(this.plugin.settings.chatHistoryPath);
      await ensureChatHistoryFolder(this.app.vault, path5);
      const meta = await loadSessionsMeta(this.plugin);
      this.sessions = await scanChatHistoryFolder(this.app.vault, path5);
      this.sessions.sort((a, b) => b.updatedAt - a.updatedAt);
      this.currentSessionId = meta.currentSessionId;
      if (this.sessions.length === 0) {
        const oldMessages = migrateOldData(meta);
        if (oldMessages && oldMessages.length > 0) {
          const now = Date.now();
          const newSession = {
            id: "session-" + now,
            title: ((_b = (_a = oldMessages[0]) == null ? void 0 : _a.content) == null ? void 0 : _b.slice(0, 30)) || "\u5386\u53F2\u5BF9\u8BDD",
            createdAt: now,
            updatedAt: now
          };
          this.sessions.push(newSession);
          this.messages = [...oldMessages];
          await saveSessionToFile(this.app.vault, path5, newSession.id, newSession, oldMessages, this.plugin.settings.execMode);
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
    const path5 = getChatHistoryPath(this.plugin.settings.chatHistoryPath);
    this.messages = await loadSessionFromFile(this.app.vault, path5, session.id);
    this.msgIdCounter = this.messages.length;
    this.messagesEl.empty();
    this.lastDateKey = "";
    if (this.messages.length === 0) {
      this.addWelcomeMessage();
      return;
    }
    for (const msg of this.messages) {
      if (msg.timestamp) this.addDateHeaderIfNeeded(msg.timestamp);
      this.messagesEl.appendChild(await this.renderMessageEl(msg.id, msg.role, msg.content, false, msg.thinking, msg.timestamp));
    }
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }
  sessionTitleFromMessages() {
    var _a;
    const firstUser = this.messages.find((m) => m.role === "user");
    const text = (firstUser == null ? void 0 : firstUser.content) || ((_a = this.messages[0]) == null ? void 0 : _a.content) || "\u65B0\u5BF9\u8BDD";
    const cleaned = text.replace(/^#+\s*/, "").replace(/[*_`~]/g, "").trim();
    return cleaned.length > 30 ? cleaned.slice(0, 30) + "\u2026" : cleaned;
  }
  async saveCurrentSession() {
    if (this.messages.length === 0) return;
    const path5 = getChatHistoryPath(this.plugin.settings.chatHistoryPath);
    const session = this.sessions.find((s) => s.id === this.currentSessionId);
    if (session) {
      session.updatedAt = Date.now();
      if (session.title === "\u65B0\u5BF9\u8BDD" || session.title === "") {
        session.title = this.messages.length > 0 ? this.sessionTitleFromMessages() : "\u65B0\u5BF9\u8BDD";
        this.updateSessionSelector();
      }
    }
    await saveSessionToFile(this.app.vault, path5, this.currentSessionId, session, this.messages, this.plugin.settings.execMode);
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
    const now = Date.now();
    const newSession = {
      id: "session-" + now,
      title: "\u65B0\u5BF9\u8BDD",
      createdAt: now,
      updatedAt: now
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
    if (this.abortController) {
      new import_obsidian8.Notice("\u8BF7\u7B49\u5F85\u5F53\u524D AI \u56DE\u590D\u5B8C\u6210");
      return;
    }
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
    if (this.abortController) {
      new import_obsidian8.Notice("\u8BF7\u7B49\u5F85\u5F53\u524D AI \u56DE\u590D\u5B8C\u6210");
      return;
    }
    if (this.sessions.length <= 1) {
      new import_obsidian8.Notice("\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u5BF9\u8BDD");
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
    new import_obsidian8.Notice("\u5DF2\u5220\u9664");
  }
  async showSessionDropdown(_e) {
    if (document.querySelector(".xy-popup")) {
      document.querySelectorAll(".xy-popup").forEach((el) => el.remove());
      return;
    }
    await this.saveCurrentSession();
    const path5 = getChatHistoryPath(this.plugin.settings.chatHistoryPath);
    const diskSessions = await scanChatHistoryFolder(this.app.vault, path5);
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
          input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              finish(true);
            } else if (e.key === "Escape") {
              finish(false);
            }
          });
          input.addEventListener("blur", () => finish(true));
          input.addEventListener("click", (e) => e.stopPropagation());
          titleEl.replaceWith(input);
          input.focus();
          input.select();
        };
        const suffix = item.createSpan({ cls: "xy-popup-suffix" });
        const renameBtn = createActionBtn("rename");
        renameBtn.classList.add("xy-popup-suffix-btn");
        renameBtn.addEventListener("click", startRename);
        suffix.appendChild(renameBtn);
        const openBtn = createActionBtn("open");
        openBtn.classList.add("xy-popup-suffix-btn");
        openBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const p = getChatHistoryPath(this.plugin.settings.chatHistoryPath);
          this.app.workspace.openLinkText(`${p}/${session.id}.md`, "/");
          popup.remove();
        });
        suffix.appendChild(openBtn);
        const deleteBtn = createActionBtn("delete");
        deleteBtn.classList.add("xy-popup-suffix-btn");
        deleteBtn.classList.add("danger");
        deleteBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          this.deleteSession(session.id);
          popup.remove();
        });
        suffix.appendChild(deleteBtn);
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
          const match = !q || ((label == null ? void 0 : label.textContent) || "").toLowerCase().includes(q);
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
  restoreMessage(id) {
    const idx = this.messages.findIndex((m) => m.id === id);
    if (idx === -1) return;
    const content = this.messages[idx].content;
    this.messages = this.messages.slice(0, idx);
    setTimeout(() => {
      const msgEls = Array.from(this.messagesEl.querySelectorAll(".xiaoyuan-msg"));
      for (let i = msgEls.length - 1; i >= idx; i--) msgEls[i].remove();
      this.inputEl.value = content;
      this.inputEl.focus();
    }, 0);
  }
  undoMessage(id) {
    this.restoreMessage(id);
    this.saveCurrentSession();
  }
  // ─── Attachments ───────────────────────────────────────────────
  pickFiles() {
    pickFiles((name, type, data, size) => {
      this.attachments.push({ name, type, data, size });
      this.renderQuoteBar();
    }, this.plugin.settings.maxAttachmentSize);
  }
  // ─── UI helpers ──────────────────────────────────────────────────
  setProcessingState(processing) {
    this.thinkingBarEl.classList.toggle("is-active", processing);
    if (processing) {
      (0, import_obsidian8.setIcon)(this.sendBtn, "circle-stop");
      (0, import_obsidian8.setTooltip)(this.sendBtn, "\u505C\u6B62");
      this.sendBtn.classList.add("is-stop");
    } else {
      (0, import_obsidian8.setIcon)(this.sendBtn, "circle-arrow-right");
      (0, import_obsidian8.setTooltip)(this.sendBtn, "\u53D1\u9001");
      this.sendBtn.classList.remove("is-stop");
    }
  }
};
function formatDateWeekday(ts) {
  const d = new Date(ts);
  const weekdays = ["\u661F\u671F\u65E5", "\u661F\u671F\u4E00", "\u661F\u671F\u4E8C", "\u661F\u671F\u4E09", "\u661F\u671F\u56DB", "\u661F\u671F\u4E94", "\u661F\u671F\u516D"];
  return `${d.getFullYear()}\u5E74${d.getMonth() + 1}\u6708${d.getDate()}\u65E5 ${weekdays[d.getDay()]}`;
}
function getDateKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// src/settings.ts
var import_obsidian9 = require("obsidian");
init_constants();
var XiaoyuanAISettingTab = class extends import_obsidian9.PluginSettingTab {
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
    settingEl == null ? void 0 : settingEl.addClass("xy-setting-with-icon");
    nameEl.addClass("xy-setting-name-with-icon");
    const icon = document.createElement("span");
    icon.addClass("xy-setting-icon");
    (0, import_obsidian9.setIcon)(icon, iconName);
    nameEl.prepend(icon);
    return setting;
  }
  addStatusRow(container, iconName, label, value) {
    const row = container.createDiv({ cls: "xy-settings-status-row" });
    const icon = row.createSpan({ cls: "xy-settings-status-icon" });
    (0, import_obsidian9.setIcon)(icon, iconName);
    row.createSpan({ cls: "xy-settings-status-label", text: label });
    row.createSpan({ cls: "xy-settings-status-value", text: value });
  }
  // ─── ① Mode Selector ─────────────────────────────────────────────
  buildModeSelector(container) {
    const s = this.s();
    this.decorateSetting(new import_obsidian9.Setting(container).setName("\u667A\u80FD\u52A9\u7406\u6A21\u5F0F").setDesc(s.execMode === "cli" ? "\u6240\u6709\u64CD\u4F5C\u901A\u8FC7 opencode run \u6267\u884C\uFF0C\u9002\u5408\u672C\u5730\u5F00\u53D1\u9879\u76EE" : "\u6240\u6709\u64CD\u4F5C\u76F4\u63A5\u8C03\u7528 OpenAI \u517C\u5BB9 API\uFF0C\u9002\u5408\u7EAF\u5BF9\u8BDD\u573A\u666F").addDropdown((dd) => {
      dd.addOption("cli", "CLI \u6A21\u5F0F");
      dd.addOption("api", "API \u6A21\u5F0F");
      dd.setValue(s.execMode);
      dd.onChange(async (val) => {
        s.execMode = val;
        await this.plugin.saveSettings();
        const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT).first();
        if ((leaf == null ? void 0 : leaf.view) instanceof XiaoyuanAIChatView) {
          leaf.view.rebuildToolbar();
        }
        this.display();
      });
    }), "bot");
  }
  // ─── ② Status Card ───────────────────────────────────────────────
  async refreshStatusCard() {
    var _a;
    const card = this.containerEl.querySelector(".xy-settings-status");
    if (!card) return;
    const s = this.s();
    try {
      const vaultDir = (await Promise.resolve().then(() => (init_server(), server_exports))).getVaultBasePath();
      const ok = await checkConnection(s, vaultDir);
      this.updateRow(card, 0, ok ? "\u5DF2\u8FDE\u63A5" : s.execMode === "cli" ? "\u672A\u8FDE\u63A5" : "\u672A\u914D\u7F6E");
      this.updateRow(card, 1, s.execMode === "cli" ? s.opencode.model || "\u672A\u9009\u62E9" : ((_a = getActiveProvider(s)) == null ? void 0 : _a.model) || "\u672A\u9009\u62E9");
      this.updateRow(card, 2, s.proxyEnabled ? s.proxyUrl : "\u5DF2\u5173\u95ED");
    } catch (e) {
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
  buildStatusCard(container) {
    var _a;
    const s = this.s();
    const card = container.createDiv({ cls: "xy-settings-status" });
    this.addStatusRow(card, "activity", "\u8FDE\u63A5\u72B6\u6001", "\u68C0\u6D4B\u4E2D...");
    this.addStatusRow(card, "box", "\u5F53\u524D\u6A21\u578B", s.execMode === "cli" ? s.opencode.model || "\u672A\u9009\u62E9" : ((_a = getActiveProvider(s)) == null ? void 0 : _a.model) || "\u672A\u9009\u62E9");
    this.addStatusRow(card, "waypoints", "\u4EE3\u7406", s.proxyEnabled ? s.proxyUrl : "\u5DF2\u5173\u95ED");
    const actions = card.createDiv({ cls: "xy-settings-status-actions" });
    const refreshBtn = actions.createEl("button", { cls: "xy-status-btn", text: "\u5237\u65B0" });
    refreshBtn.addEventListener("click", async () => {
      await this.refreshStatusCard();
      if (s.execMode === "cli") {
        const { fetchOpenCodeModelsFromCLI: fetchOpenCodeModelsFromCLI2, fetchOpenCodeAgents: fetchOpenCodeAgents2 } = await Promise.resolve().then(() => (init_ai(), ai_exports));
        const { getVaultBasePath: getVaultBasePath2 } = await Promise.resolve().then(() => (init_server(), server_exports));
        const vaultDir = getVaultBasePath2();
        try {
          const result = await fetchOpenCodeModelsFromCLI2(s.opencode.cliPath, vaultDir, s.opencode.port);
          s.opencodeModels = result.models.map((m) => ({ label: m.displayName, value: m.id }));
          s.opencodeModelCaps = result.caps;
          if (result.defaultModel && !s.opencode.model) {
            s.opencode.model = result.defaultModel;
          }
          s.opencodeAgents = await fetchOpenCodeAgents2(s.opencode.cliPath, vaultDir, s.opencode.port);
          await this.plugin.saveSettings();
        } catch (e) {
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
      { id: "api", icon: "key-round", label: "API \u8BBE\u7F6E" },
      { id: "mcp", icon: "blocks", label: "MCP \u5DE5\u5177" },
      { id: "skills", icon: "wand-sparkles", label: "Skills" }
    ];
    const bar = container.createDiv({ cls: "xy-settings-tabs" });
    for (const t of tabs) {
      const btn = bar.createEl("button", {
        cls: `xy-settings-tab ${this.activeTab === t.id ? "is-active" : ""}`,
        attr: { type: "button" }
      });
      const icon = btn.createSpan({ cls: "xy-settings-tab-icon" });
      (0, import_obsidian9.setIcon)(icon, t.icon);
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
      case "mcp":
        this.buildMCPTab(container);
        break;
      case "skills":
        this.buildSkillsTab(container);
        break;
    }
  }
  // ─── CLI 设置 ─────────────────────────────────────────────────────
  buildCLITab(container) {
    var _a, _b;
    const s = this.s();
    const pathSetting = this.decorateSetting(new import_obsidian9.Setting(container).setName("OpenCode \u8DEF\u5F84").setDesc("\u53EF\u6267\u884C\u6587\u4EF6\u8DEF\u5F84\u3002\u5168\u5C40\u5B89\u88C5\u586B opencode\uFF0C\u975E\u5168\u5C40\u5199\u5B8C\u6574\u7EDD\u5BF9\u8DEF\u5F84\u3002").addText(
      (text) => text.setPlaceholder("opencode").setValue(s.opencode.cliPath === "opencode" ? "" : s.opencode.cliPath).onChange(async (val) => {
        s.opencode.cliPath = val;
        await this.plugin.saveSettings();
      })
    ), "terminal-square");
    (async () => {
      try {
        const { resolveOpenCodePath: resolveOpenCodePath2 } = await Promise.resolve().then(() => (init_opencode_server(), opencode_server_exports));
        const detected = await resolveOpenCodePath2(s.opencode.cliPath);
        if (detected && detected !== s.opencode.cliPath) pathSetting.setDesc(`\u5DF2\u68C0\u6D4B\u5230: ${detected}`);
      } catch (e) {
      }
    })();
    this.decorateSetting(new import_obsidian9.Setting(container).setName("\u81EA\u52A8\u542F\u52A8 OpenCode Server").setDesc("\u6253\u5F00 Obsidian \u6216\u68C0\u6D4B\u5230\u670D\u52A1\u672A\u8FD0\u884C\u65F6\u81EA\u52A8\u542F\u52A8 opencode serve").addToggle((t) => {
      t.setValue(s.opencode.autoStart);
      t.onChange(async (val) => {
        s.opencode.autoStart = val;
        await this.plugin.saveSettings();
        if (val && s.execMode === "cli") {
          const { ensureOpenCodeServer: ensureOpenCodeServer2 } = await Promise.resolve().then(() => (init_ai(), ai_exports));
          const { getVaultBasePath: getVaultBasePath2 } = await Promise.resolve().then(() => (init_server(), server_exports));
          ensureOpenCodeServer2(s.opencode.cliPath, s.opencode.hostname, s.opencode.port, getVaultBasePath2(), true).catch(() => {
          });
        }
      });
    }), "play");
    this.decorateSetting(new import_obsidian9.Setting(container).setName("Host").setDesc("opencode \u670D\u52A1\u5668\u4E3B\u673A\u5730\u5740").addText(
      (text) => text.setPlaceholder("127.0.0.1").setValue(s.opencode.hostname === "127.0.0.1" ? "" : s.opencode.hostname).onChange(async (val) => {
        s.opencode.hostname = val;
        await this.plugin.saveSettings();
      })
    ), "globe");
    this.decorateSetting(new import_obsidian9.Setting(container).setName("Port").setDesc("opencode \u670D\u52A1\u5668\u7AEF\u53E3").addText(
      (text) => text.setPlaceholder("16226").setValue(s.opencode.port === 16226 ? "" : String(s.opencode.port)).onChange(async (val) => {
        const n = parseInt(val);
        s.opencode.port = n > 0 ? n : 16226;
        await this.plugin.saveSettings();
      })
    ), "plug");
    const modelSetting = this.decorateSetting(new import_obsidian9.Setting(container).setName("\u6A21\u578B").setDesc("\u70B9\u51FB\u9009\u62E9\u6A21\u578B\uFF0C\u6216\u70B9 \u21BB \u4ECE opencode \u540C\u6B65").addText((text) => {
      text.setPlaceholder("\u70B9\u51FB\u9009\u62E9\u6216\u8F93\u5165 providerID/modelID").setValue(s.opencode.model);
      text.inputEl.addClass("xy-model-picker-trigger");
      text.inputEl.readOnly = false;
      text.onChange(async (val) => {
        s.opencode.model = val;
        await this.plugin.saveSettings();
      });
      text.inputEl.addEventListener("click", (e) => {
        e.preventDefault();
        this.showModelPicker(text.inputEl, s.opencodeModels || [], (val) => {
          s.opencode.model = val;
          this.plugin.saveSettings().then(() => this.display());
        });
      });
    }).addButton((btn) => {
      btn.setButtonText("\u21BB");
      btn.setTooltip("\u4ECE opencode \u540C\u6B65\u6A21\u578B\u5217\u8868");
      btn.onClick(async () => {
        const { fetchOpenCodeModelsFromCLI: fetchOpenCodeModelsFromCLI2 } = await Promise.resolve().then(() => (init_ai(), ai_exports));
        const { getVaultBasePath: getVaultBasePath2 } = await Promise.resolve().then(() => (init_server(), server_exports));
        try {
          const result = await fetchOpenCodeModelsFromCLI2(s.opencode.cliPath, getVaultBasePath2(), s.opencode.port);
          s.opencodeModels = result.models.map((m) => ({ label: m.displayName, value: m.id }));
          s.opencodeModelCaps = result.caps;
          if (result.defaultModel && !s.opencode.model) {
            s.opencode.model = result.defaultModel;
          }
          await this.plugin.saveSettings();
          new import_obsidian9.Notice(result.models.length === 0 ? "\u672A\u627E\u5230\u6A21\u578B" : `\u5DF2\u540C\u6B65 ${result.models.length} \u4E2A\u6A21\u578B`);
          this.display();
          const { fetchOpenCodeAgents: fetchOpenCodeAgents2 } = await Promise.resolve().then(() => (init_ai(), ai_exports));
          s.opencodeAgents = await fetchOpenCodeAgents2(s.opencode.cliPath, getVaultBasePath2(), s.opencode.port).catch(() => s.opencodeAgents);
          await this.plugin.saveSettings();
        } catch (err) {
          new import_obsidian9.Notice(`\u540C\u6B65\u5931\u8D25\uFF1A${err instanceof Error ? err.message : String(err)}`);
        }
      });
    }), "box");
    {
      const caps = (_a = s.opencodeModelCaps) == null ? void 0 : _a[s.opencode.model];
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
      const currentDesc = (_b = allItems.find((a) => a.name === currentAgent)) == null ? void 0 : _b.description;
      this.decorateSetting(new import_obsidian9.Setting(container).setName("Agent").setDesc(currentAgent ? `\u5F53\u524D: ${currentAgent}${currentDesc ? ` (${currentDesc})` : ""}` : "\u9009\u62E9 agent").addDropdown((dd) => {
        var _a2;
        for (const a of allItems) dd.addOption(a.name, a.name);
        dd.setValue(inList ? currentAgent : ((_a2 = allItems[0]) == null ? void 0 : _a2.name) || "build");
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
            const vaultDir = getVaultBasePath2();
            const agents = await fetchOpenCodeAgents2(s.opencode.cliPath, vaultDir, s.opencode.port);
            s.opencodeAgents = agents;
            await this.plugin.saveSettings();
            new import_obsidian9.Notice(`\u5DF2\u540C\u6B65 ${agents.length} \u4E2A agent`);
            this.display();
          } catch (err) {
            new import_obsidian9.Notice(`\u540C\u6B65\u5931\u8D25\uFF1A${err instanceof Error ? err.message : String(err)}`);
          }
        });
      }), "bot");
    }
    this.decorateSetting(new import_obsidian9.Setting(container).setName("\u601D\u8003\u5F3A\u5EA6").setDesc("\u63A7\u5236\u6A21\u578B\u7684\u63A8\u7406\u6DF1\u5EA6").addDropdown((dd) => {
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
    this.decorateSetting(new import_obsidian9.Setting(container).setName("\u6587\u4EF6\u6743\u9650").setDesc('AI \u5BF9\u5DE5\u4F5C\u533A\u6587\u4EF6\u7684\u8BBF\u95EE\u6743\u9650\uFF08\u4EC5"\u5B8C\u5168\u653E\u5F00"\u65F6\u4F20\u9012 --dangerously-skip-permissions\uFF09').addDropdown((dd) => {
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
    var _a;
    const s = this.s();
    const providers = s.apiProviders;
    const activeId = s.activeApiProviderId || ((_a = providers[0]) == null ? void 0 : _a.id) || "";
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
          new import_obsidian9.Notice(ok ? `\u2705 \u5DF2\u5207\u6362\u5230: ${provider.name}` : `\u274C \u8FDE\u63A5\u5931\u8D25: ${provider.name}`);
        });
      }
      const testBtn = headActions.createEl("button", { cls: "xy-status-btn", text: "\u8FDE\u63A5\u6D4B\u8BD5" });
      testBtn.addEventListener("click", async () => {
        const ok = await this.testApiConnection(provider);
        new import_obsidian9.Notice(ok ? `\u2705 ${provider.name} \u8FDE\u63A5\u6210\u529F` : `\u274C ${provider.name} \u8FDE\u63A5\u5931\u8D25`);
      });
      const deleteBtn = headActions.createEl("button", { cls: "xy-status-btn", text: "\u5220\u9664" });
      deleteBtn.addEventListener("click", async () => {
        var _a2;
        if (providers.length <= 1) {
          new import_obsidian9.Notice("\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A API \u63D0\u4F9B\u8005");
          return;
        }
        s.apiProviders = providers.filter((p) => p.id !== provider.id);
        if (s.activeApiProviderId === provider.id) {
          s.activeApiProviderId = ((_a2 = s.apiProviders[0]) == null ? void 0 : _a2.id) || "";
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
    this.decorateSetting(new import_obsidian9.Setting(container).setName("\u601D\u8003\u5F3A\u5EA6").setDesc("\u63A7\u5236\u6A21\u578B\u7684\u63A8\u7406\u6DF1\u5EA6\uFF08none / low / medium / high\uFF09").addDropdown((dd) => {
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
    this.decorateSetting(new import_obsidian9.Setting(container).setName("\u6E29\u5EA6").setDesc("\u6A21\u578B\u8F93\u51FA\u7684\u968F\u673A\u6027\uFF080=\u786E\u5B9A\uFF0C2=\u968F\u673A\uFF09").addSlider(
      (slider) => slider.setLimits(0, 2, 0.1).setValue(s.temperature).onChange(async (val) => {
        s.temperature = val;
        await this.plugin.saveSettings();
      })
    ), "thermometer");
    this.decorateSetting(new import_obsidian9.Setting(container).setName("\u6700\u5927 Token \u6570").addText(
      (text) => text.setPlaceholder("4096").setValue(s.maxTokens === 4096 ? "" : String(s.maxTokens)).onChange(async (val) => {
        const n = parseInt(val);
        s.maxTokens = n > 0 ? n : 4096;
        await this.plugin.saveSettings();
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
  // ─── MCP 设置 ─────────────────────────────────────────────────────
  buildMCPTab(container) {
    const s = this.s();
    const servers = s.mcpServers || [];
    container.createEl("p", { cls: "xy-settings-desc", text: "\u914D\u7F6E MCP \u670D\u52A1\u5668\uFF0C\u4E3A AI \u63D0\u4F9B\u989D\u5916\u7684\u5DE5\u5177\u548C\u4E0A\u4E0B\u6587\u80FD\u529B\u3002" });
    for (let i = 0; i < servers.length; i++) {
      const server = servers[i];
      const card = container.createDiv({ cls: "xy-api-provider-row" });
      const head = card.createDiv({ cls: "xy-api-provider-head" });
      const title = head.createDiv({ cls: "xy-api-provider-title" });
      const nameSpan = title.createSpan({ text: server.name || "\u672A\u547D\u540D" });
      const typeSmall = title.createEl("small", { text: ` \xB7 ${server.type === "local" ? "\u672C\u5730\u8FDB\u7A0B" : "\u8FDC\u7A0B\u670D\u52A1"}` });
      const enabledBadge = title.createEl("small", { text: server.enabled ? " \xB7 \u5DF2\u542F\u7528" : " \xB7 \u5DF2\u7981\u7528", cls: server.enabled ? "" : "xy-mcp-disabled" });
      const updateHeader = () => {
        nameSpan.textContent = server.name || "\u672A\u547D\u540D";
        typeSmall.textContent = ` \xB7 ${server.type === "local" ? "\u672C\u5730\u8FDB\u7A0B" : "\u8FDC\u7A0B\u670D\u52A1"}`;
        enabledBadge.textContent = server.enabled ? " \xB7 \u5DF2\u542F\u7528" : " \xB7 \u5DF2\u7981\u7528";
      };
      const headActions = head.createDiv({ cls: "xy-api-provider-actions" });
      const deleteBtn = headActions.createEl("button", { cls: "xy-status-btn", text: "\u5220\u9664" });
      deleteBtn.addEventListener("click", async () => {
        s.mcpServers.splice(i, 1);
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
      this.addMCPFieldText(content, "\u540D\u79F0", server.name, "my-server", async (val) => {
        server.name = val;
        await this.plugin.saveSettings();
        updateHeader();
      });
      const typeField = content.createDiv({ cls: "xy-api-provider-field" });
      typeField.createSpan({ cls: "xy-api-provider-label", text: "\u7C7B\u578B" });
      const typeSelect = typeField.createEl("select", { cls: "dropdown" });
      typeSelect.createEl("option", { value: "local", text: "\u672C\u5730\u8FDB\u7A0B" });
      typeSelect.createEl("option", { value: "remote", text: "\u8FDC\u7A0B\u670D\u52A1" });
      typeSelect.value = server.type;
      typeSelect.addEventListener("change", async () => {
        server.type = typeSelect.value;
        await this.plugin.saveSettings();
        this.display();
      });
      const commandField = content.createDiv({ cls: "xy-api-provider-field xy-mcp-local" });
      commandField.style.display = server.type === "local" ? "" : "none";
      commandField.createSpan({ cls: "xy-api-provider-label", text: "\u547D\u4EE4" });
      const commandInput = commandField.createEl("input", { cls: "xy-api-provider-input", attr: { placeholder: "npx" } });
      commandInput.value = server.command || "";
      commandInput.addEventListener("change", async () => {
        server.command = commandInput.value.trim();
        await this.plugin.saveSettings();
      });
      const argsField = content.createDiv({ cls: "xy-api-provider-field xy-mcp-local" });
      argsField.style.display = server.type === "local" ? "" : "none";
      argsField.createSpan({ cls: "xy-api-provider-label", text: "\u53C2\u6570" });
      const argsInput = argsField.createEl("input", { cls: "xy-api-provider-input", attr: { placeholder: "-y @modelcontextprotocol/server-filesystem ./" } });
      argsInput.value = server.args || "";
      argsInput.addEventListener("change", async () => {
        server.args = argsInput.value.trim();
        await this.plugin.saveSettings();
      });
      const urlField = content.createDiv({ cls: "xy-api-provider-field xy-mcp-remote" });
      urlField.style.display = server.type === "remote" ? "" : "none";
      urlField.createSpan({ cls: "xy-api-provider-label", text: "URL" });
      const urlInput = urlField.createEl("input", { cls: "xy-api-provider-input", attr: { placeholder: "http://localhost:3000/mcp" } });
      urlInput.value = server.url || "";
      urlInput.addEventListener("change", async () => {
        server.url = urlInput.value.trim();
        await this.plugin.saveSettings();
      });
      const headersField = content.createDiv({ cls: "xy-api-provider-field xy-mcp-remote" });
      headersField.style.display = server.type === "remote" ? "" : "none";
      headersField.createSpan({ cls: "xy-api-provider-label", text: "Headers" });
      const headersInput = headersField.createEl("input", { cls: "xy-api-provider-input", attr: { placeholder: '{"Authorization":"Bearer xxx"}' } });
      headersInput.value = server.headers || "";
      headersInput.addEventListener("change", async () => {
        server.headers = headersInput.value.trim();
        await this.plugin.saveSettings();
      });
      const enabledField = content.createDiv({ cls: "xy-api-provider-field" });
      enabledField.createSpan({ cls: "xy-api-provider-label", text: "\u542F\u7528" });
      const enabledToggle = enabledField.createEl("input", { type: "checkbox" });
      enabledToggle.checked = server.enabled;
      enabledToggle.addEventListener("change", async () => {
        server.enabled = enabledToggle.checked;
        await this.plugin.saveSettings();
        const { resetMCPSyncDone: resetMCPSyncDone2 } = await Promise.resolve().then(() => (init_ai(), ai_exports));
        resetMCPSyncDone2();
        this.display();
      });
    }
    const addBtn = container.createDiv({ cls: "xy-settings-status-actions" });
    const newBtn = addBtn.createEl("button", { cls: "xy-status-btn", text: "+ \u65B0\u589E MCP \u670D\u52A1\u5668" });
    newBtn.addEventListener("click", async () => {
      s.mcpServers.push({ name: "\u65B0\u670D\u52A1\u5668", type: "local", command: "", args: "", enabled: false });
      await this.plugin.saveSettings();
      this.display();
    });
  }
  addMCPFieldText(container, label, value, placeholder, onChange) {
    const field = container.createDiv({ cls: "xy-api-provider-field" });
    field.createSpan({ cls: "xy-api-provider-label", text: label });
    const input = field.createEl("input", { cls: "xy-api-provider-input", attr: { placeholder } });
    input.value = value;
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
    } catch (e) {
      return false;
    }
  }
  // ─── Skills 设置 ──────────────────────────────────────────────────
  buildSkillsTab(container) {
    const s = this.s();
    this.decorateSetting(
      new import_obsidian9.Setting(container).setName("AGENTS.MD").setDesc("\u70B9\u51FB\u4E0B\u65B9\u521B\u5EFA\u6309\u94AE\uFF0CAI \u81EA\u52A8\u751F\u6210\u3002\u8DEF\u5F84\u4E3A /AGENTS.md").addButton((btn) => {
        btn.setButtonText("\u521B\u5EFA");
        btn.onClick(async () => {
          const file = this.app.vault.getAbstractFileByPath("AGENTS.md");
          if (file && file instanceof import_obsidian9.TFile) {
            new import_obsidian9.Notice("AGENTS.md \u5DF2\u5B58\u5728\uFF0C\u8BF7\u4F7F\u7528\u300C\u4FEE\u6539\u300D\u6309\u94AE\u7F16\u8F91");
            return;
          }
          const text = inputEl.value.trim();
          if (!text) {
            new import_obsidian9.Notice("\u8BF7\u5148\u8F93\u5165\u63CF\u8FF0");
            return;
          }
          btn.setDisabled(true);
          btn.setButtonText("\u751F\u6210\u4E2D...");
          try {
            const { callAISession: callAISession2 } = await Promise.resolve().then(() => (init_ai(), ai_exports));
            const { getVaultBasePath: getVaultBasePath2 } = await Promise.resolve().then(() => (init_server(), server_exports));
            const result = await callAISession2({
              prompt: `\u6839\u636E\u4EE5\u4E0B\u8981\u6C42\u521B\u5EFA\u4E00\u4EFD AGENTS.md \u6587\u4EF6\u5185\u5BB9\uFF0C\u5B9A\u4E49\u53EF\u590D\u7528\u7684 AI skill/agent\u3002

\u7528\u6237\u8981\u6C42\uFF1A
${text}

\u8BF7\u76F4\u63A5\u8F93\u51FA AGENTS.md \u7684\u5B8C\u6574\u5185\u5BB9\uFF0C\u4E0D\u8981\u591A\u4F59\u89E3\u91CA\u3002`,
              settings: s,
              vaultDir: getVaultBasePath2()
            });
            await this.app.vault.create("AGENTS.md", result.trim());
            new import_obsidian9.Notice("AGENTS.md \u5DF2\u751F\u6210");
            inputEl.value = "";
            btn.setDisabled(false);
            btn.setButtonText("\u521B\u5EFA");
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes("configure") || msg.includes("connection") || msg.includes("API") || msg.includes("key")) {
              new import_obsidian9.Notice("\u8BF7\u5148\u914D\u7F6E AI \u8FDE\u63A5");
            } else {
              new import_obsidian9.Notice(`\u521B\u5EFA\u5931\u8D25: ${msg}`);
            }
            btn.setDisabled(false);
            btn.setButtonText("\u521B\u5EFA");
          }
        });
      }).addButton((btn) => {
        btn.setButtonText("\u4FEE\u6539");
        btn.onClick(() => {
          const file = this.app.vault.getAbstractFileByPath("AGENTS.md");
          if (!file || !(file instanceof import_obsidian9.TFile)) {
            new import_obsidian9.Notice("AGENTS.md \u4E0D\u5B58\u5728\uFF0C\u8BF7\u5148\u521B\u5EFA");
            return;
          }
          this.app.workspace.openLinkText("AGENTS.md", "/");
        });
      }),
      "wand-sparkles"
    );
    const inputEl = container.createEl("textarea", {
      cls: "xy-skills-generate-input",
      attr: { placeholder: "\u63CF\u8FF0\u4F60\u60F3\u8981\u521B\u5EFA\u7684AGENTS.MD\uFF08\u81EA\u7136\u8BED\u8A00\u3001\u53C2\u8003\u94FE\u63A5\u5747\u53EF\uFF09\uFF0C\u70B9\u51FB\u4E0A\u65B9\u521B\u5EFA\u6309\u94AE\uFF0CAI \u81EA\u52A8\u751F\u6210\u3002\u6BD4\u5982\uFF1A\n\u5E2E\u52A9\u5199\u4F5C\u3001\u7FFB\u8BD1\u7B49" }
    });
    this.decorateSetting(
      new import_obsidian9.Setting(container).setName("Skills\u5217\u8868").setDesc("\u4ECE AGENTS.md \u66F4\u65B0 skill \u5217\u8868").addButton((btn) => {
        btn.setButtonText("\u21BB");
        btn.setTooltip("\u4ECE AGENTS.md \u66F4\u65B0");
        btn.onClick(async () => {
          btn.setDisabled(true);
          try {
            const file = this.app.vault.getAbstractFileByPath("AGENTS.md");
            if (!file || !(file instanceof import_obsidian9.TFile)) {
              new import_obsidian9.Notice("AGENTS.md \u4E0D\u5B58\u5728\uFF0C\u8BF7\u5148\u521B\u5EFA");
              btn.setDisabled(false);
              return;
            }
            const content = await this.app.vault.read(file);
            const { callAISession: callAISession2 } = await Promise.resolve().then(() => (init_ai(), ai_exports));
            const { getVaultBasePath: getVaultBasePath2 } = await Promise.resolve().then(() => (init_server(), server_exports));
            const result = await callAISession2({
              prompt: `\u4ECE\u4EE5\u4E0B\u5185\u5BB9\u4E2D\u63D0\u53D6\u6240\u6709 skill/agent\uFF0C\u6BCF\u4E2A\u5305\u542B\uFF1A
- name\uFF1A\u82F1\u6587\u540D\u79F0\uFF0C\u7167\u642C\u539F\u6587\u4E0D\u8981\u4FEE\u6539
- description\uFF1A\u7B80\u8981\u63CF\u8FF0

\u53EA\u8FD4\u56DE\u7EAF JSON \u6570\u7EC4 [{name, description}]\uFF0C\u4E0D\u8981\u5176\u4ED6\u6587\u5B57\u3002

${content}`,
              settings: s,
              vaultDir: getVaultBasePath2()
            });
            const skills = JSON.parse(result);
            if (!Array.isArray(skills)) throw new Error("AI \u8FD4\u56DE\u683C\u5F0F\u9519\u8BEF");
            s.skills = skills;
            await this.plugin.saveSettings();
            new import_obsidian9.Notice(`\u5DF2\u540C\u6B65 ${skills.length} \u4E2A skill`);
            this.display();
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes("configure") || msg.includes("connection") || msg.includes("API") || msg.includes("key")) {
              new import_obsidian9.Notice("\u8BF7\u5148\u914D\u7F6E AI \u8FDE\u63A5");
            } else {
              new import_obsidian9.Notice(`\u66F4\u65B0\u5931\u8D25: ${msg}`);
            }
            btn.setDisabled(false);
          }
        });
      }),
      "list"
    );
    if (s.skills.length > 0) {
      const table = container.createEl("table", { cls: "xy-skills-table" });
      const thead = table.createEl("thead");
      const headerRow = thead.createEl("tr");
      headerRow.createEl("th", { text: "\u540D\u79F0" });
      headerRow.createEl("th", { text: "\u63CF\u8FF0" });
      headerRow.createEl("th", { text: "\u6267\u884C" });
      const tbody = table.createEl("tbody");
      for (const skill of s.skills) {
        const row = tbody.createEl("tr");
        row.createEl("td", { text: skill.name });
        row.createEl("td", { text: skill.description });
        const actionCell = row.createEl("td");
        const execBtn = actionCell.createEl("button", { text: "\u25B6" });
        execBtn.style.cssText = "padding: 0 6px; font-size: 12px;";
        execBtn.addEventListener("click", () => {
          var _a;
          const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT).first();
          if ((leaf == null ? void 0 : leaf.view) instanceof XiaoyuanAIChatView) {
            const setting = this.app.setting;
            (_a = setting.close) == null ? void 0 : _a.call(setting);
            leaf.view.inputEl.value = "/" + skill.name + " ";
            leaf.view.inputEl.focus();
          }
        });
      }
    }
  }
  // ─── 通用设置 ─────────────────────────────────────────────────────
  buildGeneralTab(container) {
    const s = this.s();
    this.decorateSetting(new import_obsidian9.Setting(container).setName("\u542F\u7528\u672C\u5730\u4EE3\u7406").setDesc("\u53EA\u5F71\u54CD\u63D2\u4EF6\u901A\u8FC7 opencode \u542F\u52A8\u7684\u5B50\u8FDB\u7A0B").addToggle((t) => {
      t.setValue(s.proxyEnabled);
      t.onChange(async (val) => {
        s.proxyEnabled = val;
        await this.plugin.saveSettings();
      });
    }), "waypoints");
    this.decorateSetting(new import_obsidian9.Setting(container).setName("\u4EE3\u7406\u5730\u5740").setDesc("HTTP \u4EE3\u7406\u5730\u5740").addText(
      (text) => text.setPlaceholder("http://127.0.0.1:7890").setValue(s.proxyUrl).onChange(async (val) => {
        s.proxyUrl = val.trim();
        await this.plugin.saveSettings();
      })
    ), "route");
    this.decorateSetting(new import_obsidian9.Setting(container).setName("\u542F\u52A8\u65F6\u81EA\u52A8\u6253\u5F00\u4FA7\u680F").addToggle((t) => {
      t.setValue(s.autoOpen);
      t.onChange(async (val) => {
        s.autoOpen = val;
        await this.plugin.saveSettings();
      });
    }), "panel-right-open");
    container.createEl("hr");
    container.createEl("h3", { text: "\u804A\u5929\u8BBE\u7F6E" });
    this.decorateSetting(new import_obsidian9.Setting(container).setName("\u804A\u5929\u5386\u53F2\u5B58\u50A8\u8DEF\u5F84").setDesc("\u804A\u5929\u5386\u53F2 Markdown \u6587\u4EF6\u7684\u5B58\u50A8\u76EE\u5F55").addText(
      (text) => text.setPlaceholder("_chatHistory").setValue(s.chatHistoryPath === "_chatHistory" ? "" : s.chatHistoryPath).onChange(async (val) => {
        s.chatHistoryPath = val.trim() || "_chatHistory";
        await this.plugin.saveSettings();
      })
    ), "folder");
    this.decorateSetting(new import_obsidian9.Setting(container).setName("\u804A\u5929\u9762\u677F\u4F4D\u7F6E").addDropdown((dd) => {
      dd.addOption("left", "\u5DE6\u4FA7");
      dd.addOption("right", "\u53F3\u4FA7");
      dd.setValue(s.chatViewType);
      dd.onChange(async (val) => {
        s.chatViewType = val;
        await this.plugin.saveSettings();
      });
    }), "layout-dashboard");
    this.decorateSetting(new import_obsidian9.Setting(container).setName("Diff \u9884\u89C8").setDesc("\u5728 AI \u56DE\u590D\u4E2D\u663E\u793A\u6587\u4EF6\u53D8\u66F4\u9884\u89C8").addToggle((t) => {
      t.setValue(s.showDiffPreview);
      t.onChange(async (val) => {
        s.showDiffPreview = val;
        await this.plugin.saveSettings();
      });
    }), "file-diff");
    this.decorateSetting(new import_obsidian9.Setting(container).setName("\u663E\u793A\u601D\u8003\u8FC7\u7A0B").setDesc("\u5728 AI \u56DE\u590D\u4E2D\u4EE5\u6298\u53E0\u5757\u663E\u793A\u6A21\u578B\u7684\u601D\u8003\u8FC7\u7A0B").addToggle((t) => {
      t.setValue(s.showThinking);
      t.onChange(async (val) => {
        s.showThinking = val;
        await this.plugin.saveSettings();
      });
    }), "brain");
    this.decorateSetting(new import_obsidian9.Setting(container).setName("\u9644\u4EF6\u5927\u5C0F\u4E0A\u9650").setDesc("\u5355\u4F4D MB\uFF0C\u8D85\u51FA\u9650\u5236\u7684\u6587\u4EF6\u4F1A\u88AB\u8DF3\u8FC7").addText(
      (text) => text.setPlaceholder("10").setValue(s.maxAttachmentSize === 10 ? "" : String(s.maxAttachmentSize)).onChange(async (val) => {
        const n = parseInt(val);
        s.maxAttachmentSize = n > 0 ? n : 10;
        await this.plugin.saveSettings();
      })
    ), "hard-drive");
    container.createEl("hr");
    container.createEl("h3", { text: "\u7CFB\u7EDF\u63D0\u793A\u8BCD" });
    this.decorateSetting(new import_obsidian9.Setting(container).setName("\u663E\u793A\u6587\u4EF6\u4E0A\u4E0B\u6587").setDesc("\u5728\u804A\u5929\u5DE5\u5177\u680F\u663E\u793A\u5F53\u524D\u7B14\u8BB0\u7684\u4E0A\u4E0B\u6587\u4FE1\u606F").addToggle((t) => {
      t.setValue(s.showContext);
      t.onChange(async (val) => {
        s.showContext = val;
        await this.plugin.saveSettings();
        this.display();
      });
    }), "file-text");
    this.decorateSetting(new import_obsidian9.Setting(container).setName("\u7CFB\u7EDF\u63D0\u793A\u8BCD").addTextArea((text) => {
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
        var _a;
        ev.stopPropagation();
        popup.remove();
        try {
          const { fetchOpenCodeModelsFromCLI: fetchOpenCodeModelsFromCLI2, ensureOpenCodeServer: ensureOpenCodeServer2 } = await Promise.resolve().then(() => (init_ai(), ai_exports));
          const vaultDir = (await Promise.resolve().then(() => (init_server(), server_exports))).getVaultBasePath();
          await ensureOpenCodeServer2(s.opencode.cliPath, s.opencode.hostname, s.opencode.port, vaultDir, true);
          const result = await fetchOpenCodeModelsFromCLI2(s.opencode.cliPath, vaultDir, s.opencode.port);
          s.opencodeModels = result.models.map((m) => ({ label: m.displayName, value: m.id }));
          s.opencodeModelCaps = result.caps;
          if (!s.opencode.model || !result.models.some((m) => m.id === s.opencode.model)) {
            s.opencode.model = result.defaultModel || ((_a = result.models[0]) == null ? void 0 : _a.id) || "";
          }
          await this.plugin.saveSettings();
          new import_obsidian9.Notice(`\u5DF2\u540C\u6B65 ${result.models.length} \u4E2A\u6A21\u578B`);
        } catch (err) {
          new import_obsidian9.Notice(`\u540C\u6B65\u5931\u8D25: ${err instanceof Error ? err.message : String(err)}`);
        }
      });
      const groups = /* @__PURE__ */ new Map();
      for (const m of models) {
        const provider = m.value.includes("/") ? m.value.split("/")[0] : "\u5176\u4ED6";
        const list = groups.get(provider);
        if (list) {
          list.push(m);
        } else {
          groups.set(provider, [m]);
        }
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

// src/main.ts
init_constants();
init_ai();
init_opencode_server();
init_server();
var XiaoyuanAIPlugin = class extends import_obsidian10.Plugin {
  async onload() {
    await this.loadSettings();
    const adapter = this.app.vault.adapter;
    if (adapter.getBasePath) setVaultBasePath(adapter.getBasePath());
    if (this.settings.execMode === "cli") {
      const resolved = await resolveOpenCodePath(this.settings.opencode.cliPath);
      if (!fsSync.existsSync(resolved)) {
        this.settings.execMode = "api";
        await this.saveSettings();
        new import_obsidian10.Notice("\u672A\u68C0\u6D4B\u5230 opencode \u7A0B\u5E8F\uFF0C\u5DF2\u81EA\u52A8\u5207\u6362\u4E3A API \u6A21\u5F0F");
      }
    }
    this.registerView(VIEW_TYPE_XIAOYUAN_AI_CHAT, (leaf) => new XiaoyuanAIChatView(leaf, this));
    this.addRibbonIcon("message-circle", "\u5C0F\u5143AI", () => this.activateChatView());
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        const sel = editor.getSelection();
        menu.addItem((item) => {
          item.setTitle("\u5C0F\u5143\u5199\u4F5C");
          item.setIcon("sparkles");
          const submenu = item.setSubmenu();
          OPERATIONS.forEach((op) => {
            submenu.addItem((subItem) => {
              subItem.setTitle(OPERATION_LABELS[op]);
              subItem.setIcon(OPERATION_ICONS[op]);
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
        if ((leaf == null ? void 0 : leaf.view) instanceof XiaoyuanAIChatView) leaf.view.newChat();
      },
      hotkeys: [{ modifiers: ["Ctrl", "Shift"], key: "N" }]
    });
    OPERATIONS.forEach((op) => {
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
      id: "xiaoyuanAI-chat-with-note",
      name: "\u{1F4C4} \u7528\u5F53\u524D\u7B14\u8BB0\u5F00\u542F AI \u5BF9\u8BDD",
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new import_obsidian10.Notice("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u7B14\u8BB0");
          return;
        }
        const content = await this.app.vault.read(file);
        const leaf = this.activateChatView();
        if ((leaf == null ? void 0 : leaf.view) instanceof XiaoyuanAIChatView) {
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
    this.app.workspace.onLayoutReady(() => this.cleanTempFiles());
    this.registerDomEvent(document, "mouseup", (e) => {
      setTimeout(() => {
        const modalEl = document.querySelector(".xiaoyuan-modal-container");
        if (modalEl == null ? void 0 : modalEl.contains(e.target)) return;
        const chatEl = document.querySelector(".xiaoyuan-chat");
        if (chatEl == null ? void 0 : chatEl.contains(e.target)) return;
        const view = this.app.workspace.getActiveViewOfType(import_obsidian10.MarkdownView);
        if (!view) return;
        const editor = view.editor;
        const text = editor.getSelection();
        if (!text.trim()) return;
        const domSel = window.getSelection();
        if (!domSel || !domSel.rangeCount) return;
        const editorEl = view.contentEl;
        if (!editorEl.contains(domSel.anchorNode)) return;
        const rect = domSel.getRangeAt(0).getBoundingClientRect();
        const x = rect.left + rect.width / 2 - 60;
        const y = rect.top - 36;
        document.querySelectorAll(".xy-selection-popup").forEach((el) => el.remove());
        const popup = document.body.createDiv({ cls: "xy-selection-popup" });
        const copyBtn = createActionBtn("copy");
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(text);
          new import_obsidian10.Notice("\u5DF2\u590D\u5236");
          popup.remove();
        });
        popup.appendChild(copyBtn);
        const speakBtn = createActionBtn("speak");
        speakBtn.addEventListener("click", () => {
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text.replace(/[#*_`\[\]]/g, ""));
          u.lang = "zh-CN";
          speechSynthesis.speak(u);
          popup.remove();
        });
        popup.appendChild(speakBtn);
        const quoteBtn = createActionBtn("quote");
        quoteBtn.addEventListener("click", () => {
          this.activateChatView();
          const chatLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT).first();
          if ((chatLeaf == null ? void 0 : chatLeaf.view) && typeof chatLeaf.view.quote === "function") {
            chatLeaf.view.quote(text);
          }
          popup.remove();
        });
        popup.appendChild(quoteBtn);
        const aiBtn = createActionBtn("aiTools");
        aiBtn.addEventListener("click", (ev) => {
          const menu = new import_obsidian10.Menu();
          OPERATIONS.forEach((op) => {
            menu.addItem((item) => {
              item.setTitle(OPERATION_LABELS[op]);
              item.setIcon(OPERATION_ICONS[op]);
              item.onClick(() => new TextOperationModal(this.app, this, op, text).open());
            });
          });
          menu.showAtMouseEvent(ev);
          popup.remove();
        });
        popup.appendChild(aiBtn);
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        document.body.appendChild(popup);
      }, 10);
    });
  }
  async cleanTempFiles() {
    try {
      const tempDir = path4.join(getVaultBasePath(), this.settings.chatHistoryPath, "temp");
      try {
        await fs4.access(tempDir);
      } catch (e) {
        return;
      }
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1e3;
      const names = await fs4.readdir(tempDir);
      for (const name of names) {
        const fp = path4.join(tempDir, name);
        const stat2 = await fs4.stat(fp);
        if (stat2.isFile() && name.endsWith(".md") && now - stat2.mtimeMs > maxAge) {
          await fs4.unlink(fp);
        }
      }
    } catch (e) {
      console.warn("\u6E05\u7406\u4E34\u65F6\u6587\u4EF6\u5931\u8D25:", e);
    }
  }
  async autoStartServer() {
    try {
      const vaultDir = getVaultBasePath();
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
    var _a, _b;
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT).first();
    if (!leaf) {
      const useRight = this.settings.chatViewType === "right";
      leaf = useRight ? (_a = workspace.getRightLeaf(false)) != null ? _a : void 0 : (_b = workspace.getLeftLeaf(false)) != null ? _b : void 0;
      if (leaf) leaf.setViewState({ type: VIEW_TYPE_XIAOYUAN_AI_CHAT, active: true });
    }
    if (leaf) workspace.revealLeaf(leaf);
    return leaf;
  }
  getActiveEditor() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian10.MarkdownView);
    return (view == null ? void 0 : view.editor) || null;
  }
  async loadSettings() {
    const data = await this.loadData() || {};
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...data,
      opencode: { ...DEFAULT_SETTINGS.opencode, ...data == null ? void 0 : data.opencode }
    };
    if (!this.settings.opencode.agent) this.settings.opencode.agent = "build";
    for (const p of this.settings.apiProviders) {
      if (p.apiKey) {
        try {
          p.apiKey = atob(p.apiKey);
        } catch (e) {
        }
      }
    }
  }
  async saveSettings() {
    const encoded = this.settings.apiProviders.map((p) => ({
      ...p,
      apiKey: p.apiKey ? btoa(p.apiKey) : p.apiKey
    }));
    await this.saveData({ ...this.settings, apiProviders: encoded });
  }
  async onunload() {
    stopOpenCodeServer();
    for (const p of this.settings.apiProviders) {
      p.apiKey = "";
    }
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT);
  }
};
