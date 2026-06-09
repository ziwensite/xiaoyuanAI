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

export interface SkillEntry {
  name: string;
  description: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: string;
}

export interface SSEPartState {
  status?: string;
}

export interface SSEEventPart {
  id?: string;
  type?: string;
  text?: string;
  tool?: string;
  name?: string;
  state?: SSEPartState;
  diff?: string;
}

export interface XiaoyuanAISettings {
  execMode: "api" | "cli";

  opencode: OpenCodeSettings;

  activeApiProviderId: string;
  apiProviders: ApiProviderConfig[];

  proxyEnabled: boolean;
  proxyUrl: string;
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
  maxAttachmentSize: number;
  captureCommandId: string;

  opencodeModels?: { label: string; value: string }[];
  opencodeModelCaps?: Record<string, ModelCaps>;
  opencodeAgents?: { name: string; description?: string }[];
  skills: SkillEntry[];
  promptTemplates: PromptTemplate[];
}