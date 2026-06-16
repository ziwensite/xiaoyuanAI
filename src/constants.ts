import type { OpenCodeSettings, XiaoyuanAISettings, ApiProviderConfig, PromptTemplate, AssistantConfig } from "./types";

export const DEFAULT_ASSISTANT_A: AssistantConfig = {
  name: "小A",
  systemPrompt: "你是助手小A，负责与用户直接对话。你可以分析问题、写作、翻译、润色文本。你的搭档小C擅长文件操作和命令执行，遇到相关任务可用 @小C 委托给ta。小C 的结果会自动出现在你的上下文里。",
  avatar: "sparkles",
};

export const DEFAULT_ASSISTANT_C: AssistantConfig = {
  name: "小C",
  systemPrompt: "你是助手小C，擅长文件操作和命令执行。你与搭档小A 一起工作，小A 负责与用户直接对话。你被 @小C 时直接回应用户，未被 @时安静待命。小A 可能委托你完成任务，完成后结果会自动出现在小A 的上下文里。",
  avatar: "server",
};

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
  { id: "translate-en", name: "翻译为英文", description: "将文本翻译成英文", prompt: "你是一个翻译助手。请将以下文本翻译成英文，保持专业性和流畅度：\n\n", icon: "languages" },
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

  systemPrompt: "",
  maxTokens: 4096,
  temperature: 0.7,
  chatHistoryPath: "_xiaoyuanAI/chatHistory",
  showDiffPreview: true,
  showThinking: true,
  maxAttachmentSize: 10,
  captureCommandId: "",
  promptTemplates: [...DEFAULT_PROMPT_TEMPLATES],
  skills: [],
  assistantA: { ...DEFAULT_ASSISTANT_A },
  assistantC: { ...DEFAULT_ASSISTANT_C },
};

export function getActiveProvider(s: { apiProviders: ApiProviderConfig[]; activeApiProviderId: string }): ApiProviderConfig | undefined {
  if (s.activeApiProviderId) return s.apiProviders.find(p => p.id === s.activeApiProviderId);
  return s.apiProviders[0];
}

export const CHAT_SESSIONS_KEY = "xiaoyuan-chat-sessions";
export const CURRENT_SESSION_KEY = "xiaoyuan-current-session";
export const VIEW_TYPE_XIAOYUAN_AI_CHAT = "xiaoyuan-chat-view";
