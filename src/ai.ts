import { requestUrl } from "obsidian";
import { ensureServer, getVaultBasePath } from "./server";
import type { XiaoyuanAISettings, Attachment, MessageResponse } from "./types";

async function callOpenCodeAPI(
  prompt: string,
  port: number,
  password: string,
  attachments?: Attachment[],
  agent?: string,
  level?: string,
): Promise<string> {
  const baseUrl = `http://localhost:${port}`;
  const auth = btoa(`opencode:${password}`);
  const headers = {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  };

  const parts: unknown[] = [{ type: "text", text: prompt }];
  if (attachments) {
    for (const att of attachments) {
      if (att.type.startsWith("image/")) {
        parts.push({ type: "image", image: att.data });
      } else {
        parts.push({ type: "file", file: att.data, name: att.name });
      }
    }
  }

  const body: Record<string, unknown> = { parts };
  if (agent) body.agent = agent;
  if (level) body.level = level;

  const sessionResp = await requestUrl({
    url: `${baseUrl}/session`,
    method: "POST",
    headers,
    body: JSON.stringify({ title: "xiaoyuan-plugin" }),
    throw: false,
  });

  if (sessionResp.status < 200 || sessionResp.status >= 300) {
    const txt = sessionResp.text?.slice(0, 200) || "";
    throw new Error(`创建会话失败（${sessionResp.status}）：${txt}`);
  }

  const sessionData = sessionResp.json;
  const sessionId: string = sessionData.id;

  try {
    const msgResp = await requestUrl({
      url: `${baseUrl}/session/${sessionId}/message`,
      method: "POST",
      headers,
      body: JSON.stringify(body),
      throw: false,
    });

    if (msgResp.status < 200 || msgResp.status >= 300) {
      const txt = msgResp.text?.slice(0, 200) || "";
      throw new Error(`发送消息失败（${msgResp.status}）：${txt}`);
    }

    const msgData: MessageResponse = msgResp.json;

    const textParts = msgData.parts
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text!)
      .join("\n");
    if (textParts) return textParts;

    const anyText = msgData.parts
      .filter((p) => p.text)
      .map((p) => p.text!)
      .join("\n");
    return anyText || "(无响应内容)";
  } finally {
    try {
      await requestUrl({
        url: `${baseUrl}/session/${sessionId}`,
        method: "DELETE",
        headers,
        throw: false,
      });
    } catch {}
  }
}

export async function callAIWithCLI(
  prompt: string,
  settings: XiaoyuanAISettings,
  vaultDir: string,
  attachments?: Attachment[],
): Promise<string> {
  await ensureServer(settings, vaultDir);
  return callOpenCodeAPI(
    prompt,
    settings.serverPort,
    settings.serverPassword,
    attachments,
    settings.buildMode,
    settings.level,
  );
}

export async function callAIWithAPI(
  apiEndpoint: string,
  apiKey: string,
  model: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  maxTokens: number,
  temperature: number,
  stream = false,
): Promise<Response> {
  const resp = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`API ${resp.status}: ${errText.slice(0, 200)}`);
  }

  return resp;
}

export async function callAIWithAPIJson(
  apiEndpoint: string,
  apiKey: string,
  model: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  maxTokens: number,
  temperature: number,
): Promise<string> {
  const resp = await callAIWithAPI(apiEndpoint, apiKey, model, messages, maxTokens, temperature, false);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "（无响应）";
}

export { getVaultBasePath };
