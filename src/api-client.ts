export async function callAIWithAPI(
  apiEndpoint: string, apiKey: string, model: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  maxTokens: number, temperature: number, stream = false, signal?: AbortSignal,
  reasoningEffort?: string,
): Promise<Response> {
  const body: Record<string, any> = { model, messages, max_tokens: maxTokens, temperature, stream };
  if (reasoningEffort && reasoningEffort !== "none") {
    body.reasoning_effort = reasoningEffort;
  }
  const resp = await fetch(apiEndpoint, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body), signal,
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`API ${resp.status}: ${errText.slice(0, 200)}`);
  }
  return resp;
}

export async function callAIWithAPIJson(
  apiEndpoint: string, apiKey: string, model: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  maxTokens: number, temperature: number,
  reasoningEffort?: string,
): Promise<string> {
  const resp = await callAIWithAPI(apiEndpoint, apiKey, model, messages, maxTokens, temperature, false, undefined, reasoningEffort);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "（无响应）";
}

function ensureApiUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : trimmed + "/chat/completions";
}

export async function processAPISSEStream(
  resp: Response,
  onThinking?: (text: string) => void,
  onTextUpdate?: (text: string) => void,
): Promise<string> {
  const reader = resp.body?.getReader();
  if (!reader) throw new Error("无法读取响应流");
  const decoder = new TextDecoder("utf-8");
  let fullContent = "";
  let fullThinking = "";

  const read = async (): Promise<string> => {
    const { done, value } = await reader.read();
    if (done) return fullContent || fullThinking || "（无响应）";
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const dataStr = trimmed.slice(5).trim();
      if (dataStr === "[DONE]") continue;
      try {
        const data = JSON.parse(dataStr);
        const delta = data.choices?.[0]?.delta;
        if (delta?.reasoning_content) {
          fullThinking += delta.reasoning_content;
          onThinking?.(fullThinking);
        }
        if (delta?.content) {
          fullContent += delta.content;
          onTextUpdate?.(fullContent);
        }
      } catch {}
    }
    return read();
  };
  return read();
}

export { ensureApiUrl };