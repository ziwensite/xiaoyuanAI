import { describe, it, expect, vi } from "vitest";
import { processAPISSEStream } from "../src/api-client";

function createMockResponse(chunks: string[]): Response {
  let index = 0;
  const reader = {
    read: vi.fn(async () => {
      if (index >= chunks.length) {
        return { done: true, value: undefined as never };
      }
      const value = new TextEncoder().encode(chunks[index]);
      index++;
      return { done: false, value };
    }),
  };
  return {
    body: { getReader: () => reader },
    ok: true,
  } as unknown as Response;
}

describe("processAPISSEStream", () => {
  it("returns content from SSE stream", async () => {
    const resp = createMockResponse([
      "data: {\"choices\":[{\"delta\":{\"content\":\"Hello\"}}]}\n\n",
      "data: {\"choices\":[{\"delta\":{\"content\":\" World\"}}]}\n\n",
      "data: [DONE]\n\n",
    ]);
    const result = await processAPISSEStream(resp);
    expect(result).toBe("Hello World");
  });

  it("extracts reasoning content", async () => {
    const thinkingCallback = vi.fn();
    const textCallback = vi.fn();
    const resp = createMockResponse([
      "data: {\"choices\":[{\"delta\":{\"reasoning_content\":\"思考中\"}}]}\n\n",
      "data: {\"choices\":[{\"delta\":{\"content\":\"Answer\"}}]}\n\n",
    ]);
    await processAPISSEStream(resp, thinkingCallback, textCallback);
    expect(thinkingCallback).toHaveBeenCalledWith("思考中");
    expect(textCallback).toHaveBeenCalledWith("Answer");
  });

  it("handles incremental text updates", async () => {
    const textCallback = vi.fn();
    const resp = createMockResponse([
      "data: {\"choices\":[{\"delta\":{\"content\":\"A\"}}]}\n\n",
      "data: {\"choices\":[{\"delta\":{\"content\":\"B\"}}]}\n\n",
    ]);
    await processAPISSEStream(resp, undefined, textCallback);
    expect(textCallback).toHaveBeenCalledTimes(2);
    expect(textCallback).toHaveBeenNthCalledWith(1, "A");
    expect(textCallback).toHaveBeenNthCalledWith(2, "AB");
  });

  it("handles empty response with only [DONE]", async () => {
    const resp = createMockResponse(["data: [DONE]\n\n"]);
    const result = await processAPISSEStream(resp);
    expect(result).toBe("（无响应）");
  });

  it("handles no data at all", async () => {
    const resp = createMockResponse([]);
    const result = await processAPISSEStream(resp);
    expect(result).toBe("（无响应）");
  });

  it("skips non-data lines", async () => {
    const resp = createMockResponse([
      ":comment\n\n",
      "data: {\"choices\":[{\"delta\":{\"content\":\"OK\"}}]}\n\n",
    ]);
    const result = await processAPISSEStream(resp);
    expect(result).toBe("OK");
  });
});