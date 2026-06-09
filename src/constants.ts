import type { OpenCodeSettings, XiaoyuanAISettings, ApiProviderConfig, PromptTemplate } from "./types";

export const DEFAULT_OPENCODE_SETTINGS: OpenCodeSettings = {
  cliPath: "opencode",
  autoStart: false,
  hostname: "127.0.0.1",
  port: 16226,
  model: "",
  agent: "build",
};

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplate[] = [
  { id: "polish", name: "润色", description: "改进表达、语法和流畅度", prompt: "你是一个文字润色助手。请润色以下文本，改进表达、语法和流畅度，保持原意不变。只输出润色后的结果，不要添加任何解释：\n\n", icon: "pencil" },
  { id: "summarize", name: "总结", description: "提取关键要点", prompt: "你是一个总结助手。请对以下文本进行简洁的总结，提取关键要点。用中文总结，只输出总结内容：\n\n", icon: "file-text" },
  { id: "complete", name: "补全", description: "根据上下文自然补全内容", prompt: "你是一个写作助手。请根据上下文，自然地补全以下内容，保持风格一致：\n\n", icon: "check" },
  { id: "expand", name: "扩写", description: "增加细节和深度", prompt: "你是一个写作助手。请扩写以下内容，增加细节、例子和深度，保留原文的核心观点：\n\n", icon: "maximize" },
  { id: "continue", name: "续写", description: "自然地续写内容", prompt: "你是一个写作助手。请根据以下内容自然地续写，保持风格一致：\n\n", icon: "arrow-right" },
  { id: "translate", name: "翻译为中文", description: "将文本翻译成中文", prompt: "你是一个翻译助手。请将以下文本翻译成中文，保持专业性和流畅度：\n\n", icon: "languages" },
];

export const DEFAULT_SETTINGS: XiaoyuanAISettings = {
  execMode: "cli",

  opencode: { ...DEFAULT_OPENCODE_SETTINGS },

  activeApiProviderId: "",
  apiProviders: [
    { id: "default", name: "默认 API", baseUrl: "https://api.openai.com/v1", model: "gpt-4o", apiKey: "" },
  ],

  proxyEnabled: false,
  proxyUrl: "",
  defaultReasoning: "low",
  apiReasoningEffort: "none",
  defaultPermission: "read-only",
  autoOpen: true,
  showContext: false,
  chatViewType: "right",

  systemPrompt: "你是一个 AI 助手，集成在 Obsidian 笔记软件中。用户正在做笔记或写作。请用中文回答，保持简洁专业。",
  maxTokens: 4096,
  temperature: 0.7,
  chatHistoryPath: "_chatHistory",
  showDiffPreview: true,
  showThinking: true,
  maxAttachmentSize: 10,
  captureCommandId: "",
  promptTemplates: [...DEFAULT_PROMPT_TEMPLATES],
  skills: [],
};

export function getActiveProvider(s: { apiProviders: ApiProviderConfig[]; activeApiProviderId: string }): ApiProviderConfig | undefined {
  if (s.activeApiProviderId) return s.apiProviders.find(p => p.id === s.activeApiProviderId);
  return s.apiProviders[0];
}

export const CHAT_SESSIONS_KEY = "xiaoyuan-chat-sessions";
export const CURRENT_SESSION_KEY = "xiaoyuan-current-session";
export const VIEW_TYPE_XIAOYUAN_AI_CHAT = "xiaoyuan-chat-view";
