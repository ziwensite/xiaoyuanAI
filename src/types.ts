export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  timestamp?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface Attachment {
  name: string;
  type: string;
  data: string;
  size: number;
}

export interface FileDiff {
  file: string;
  before: string;
  after: string;
  additions: number;
  deletions: number;
}

export interface ModelCaps {
  text: boolean;
  image: boolean;
  pdf: boolean;
  audio: boolean;
  video: boolean;
  reasoning: boolean;
  toolcall: boolean;
  attachment: boolean;
  temperature: boolean;
}

export interface ModelEntry {
  id: string;
  displayName: string;
}

export interface OpenCodeSettings {
  cliPath: string;
  autoStart: boolean;
  hostname: string;
  port: number;
  model: string;
  agent: string;
  textEnabled: boolean;
  imageEnabled: boolean;
  pdfEnabled: boolean;
}

export interface ApiProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
}

export type ReasoningEffort = "none" | "minimal" | "low" | "medium" | "high" | "xhigh";
export type ReasoningEffortAPI = "none" | "low" | "medium" | "high";
export type PermissionMode = "read-only" | "workspace-write" | "danger-full-access";
export interface XiaoyuanAISettings {
  execMode: "api" | "cli";

  opencode: OpenCodeSettings;

  activeApiProviderId: string;
  apiProviders: ApiProviderConfig[];

  proxyEnabled: boolean;
  proxyUrl: string;
  mcpEnabled: boolean;
  defaultReasoning: ReasoningEffort;
  apiReasoningEffort: ReasoningEffortAPI;
  defaultPermission: PermissionMode;
  autoOpen: boolean;
  showContext: boolean;
  chatViewType: "left" | "right";

  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  chatHistoryPath: string;
  showDiffPreview: boolean;
  showThinking: boolean;

  opencodeModels?: { label: string; value: string }[];
  opencodeModelCaps?: Record<string, ModelCaps>;
  opencodeAgents?: { name: string; description?: string }[];
}

export const DEFAULT_OPENCODE_SETTINGS: OpenCodeSettings = {
  cliPath: "opencode",
  autoStart: false,
  hostname: "127.0.0.1",
  port: 16226,
  model: "",
  agent: "build",
  textEnabled: true,
  imageEnabled: false,
  pdfEnabled: false,
};

export const DEFAULT_SETTINGS: XiaoyuanAISettings = {
  execMode: "cli",

  opencode: { ...DEFAULT_OPENCODE_SETTINGS },

  activeApiProviderId: "",
  apiProviders: [
    { id: "default", name: "默认 API", baseUrl: "https://api.openai.com/v1", model: "gpt-4o", apiKey: "" },
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

  systemPrompt: "你是一个 AI 助手，集成在 Obsidian 笔记软件中。用户正在做笔记或写作。请用中文回答，保持简洁专业。",
  maxTokens: 4096,
  temperature: 0.7,
  chatHistoryPath: ".chatHistory",
  showDiffPreview: true,
  showThinking: true,
};

export function getActiveProvider(s: { apiProviders: ApiProviderConfig[]; activeApiProviderId: string }): ApiProviderConfig | undefined {
  if (s.activeApiProviderId) return s.apiProviders.find(p => p.id === s.activeApiProviderId);
  return s.apiProviders[0];
}

export const CHAT_SESSIONS_KEY = "xiaoyuan-chat-sessions";
export const CURRENT_SESSION_KEY = "xiaoyuan-current-session";
export const VIEW_TYPE_XIAOYUAN_AI_CHAT = "xiaoyuan-chat-view";

export const OPERATION_PROMPTS: Record<string, string> = {
  polish: "你是一个文字润色助手。请润色以下文本，改进表达、语法和流畅度，保持原意不变。只输出润色后的结果，不要添加任何解释：\n\n",
  summarize: "你是一个总结助手。请对以下文本进行简洁的总结，提取关键要点。用中文总结，只输出总结内容：\n\n",
  complete: "你是一个写作助手。请根据上下文，自然地补全以下内容，保持风格一致：\n\n",
  expand: "你是一个写作助手。请扩写以下内容，增加细节、例子和深度，保留原文的核心观点：\n\n",
  translate: "你是一个翻译助手。请将以下文本翻译成中文，保持专业性和流畅度：\n\n",
  continue: "你是一个写作助手。请根据以下内容自然地续写，保持风格一致：\n\n",
};

export const OPERATION_LABELS: Record<string, string> = {
  polish: "润色", summarize: "总结", complete: "补全",
  expand: "扩写", translate: "翻译为中文", continue: "续写",
};

export const WIKI_SYSTEM_PROMPTS: Record<string, string> = {
  query: "你是一个维基知识库的检索助手。根据用户的问题，从知识库角度给出综合性的回答。如果不知道，就诚实说不知道。",
  capture: "你正在将用户提供的内容整理为维基笔记。请提取关键信息，分类（concept/skill/reference/decision），输出带 YAML frontmatter 的 Obsidian Markdown 格式。",
  ingest: "你正在摄入文档。请分析内容，蒸馏出核心概念、实体、技能，用中文输出多个维基页面（带 frontmatter 和 [[维基链接]]）。",
};
