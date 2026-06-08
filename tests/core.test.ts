import { describe, it, expect } from "vitest";
import { estimateTokens, parseDiffText, simpleHash, ensureApiUrl, parseMcpHeaders } from "../src/utils";
import { getActiveProvider } from "../src/constants";

describe("estimateTokens", () => {
  it("counts ASCII chars as 0.25 tokens each", () => {
    expect(estimateTokens("hello")).toBe(2);
  });

  it("counts CJK chars as 1.5 tokens each", () => {
    expect(estimateTokens("你好")).toBe(3);
  });

  it("returns 0 for empty string", () => {
    expect(estimateTokens("")).toBe(0);
  });

  it("handles mixed content", () => {
    const t = estimateTokens("hello你好");
    expect(t).toBe(5);
  });

  it("always rounds up", () => {
    expect(estimateTokens("a")).toBe(1);
    expect(estimateTokens("ab")).toBe(1);
    expect(estimateTokens("abc")).toBe(1);
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("abcde")).toBe(2);
  });
});

describe("parseDiffText", () => {
  it("parses a simple unified diff", () => {
    const diff = `diff --git a/foo.md b/foo.md
--- a/foo.md
+++ b/foo.md
@@ -1 +1 @@
-old line
+new line`;
    const result = parseDiffText(diff);
    expect(result).toHaveLength(1);
    expect(result[0].file).toBe("foo.md");
    expect(result[0].additions).toBe(1);
    expect(result[0].deletions).toBe(1);
  });

  it("returns empty array for empty input", () => {
    expect(parseDiffText("")).toEqual([]);
  });

  it("parses multi-file diff", () => {
    const diff = `diff --git a/a.ts b/a.ts
--- a/a.ts
+++ b/a.ts
@@ -1 +1 @@
-old
+new
diff --git a/b.ts b/b.ts
--- a/b.ts
+++ b/b.ts
@@ -1 +1 @@
-removed
+added`;
    const result = parseDiffText(diff);
    expect(result).toHaveLength(2);
    expect(result[0].file).toBe("a.ts");
    expect(result[1].file).toBe("b.ts");
  });

  it("handles context lines correctly", () => {
    const diff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,3 +1,3 @@
 context
-old
+new
 context`;
    const result = parseDiffText(diff);
    expect(result[0].before.split("\n")).toEqual([" context", "old", " context"]);
    expect(result[0].after.split("\n")).toEqual([" context", "new", " context"]);
  });
});

describe("simpleHash", () => {
  it("returns consistent results for same input", () => {
    expect(simpleHash("hello")).toBe(simpleHash("hello"));
  });

  it("returns different results for different inputs", () => {
    expect(simpleHash("hello")).not.toBe(simpleHash("world"));
  });

  it("returns a base36 string", () => {
    const hash = simpleHash("test content");
    expect(hash).toMatch(/^[0-9a-z]+$/);
  });

  it("handles empty string", () => {
    expect(simpleHash("")).toBe("0");
  });
});

describe("ensureApiUrl", () => {
  const BASE_URL = "https://api.openai.com/v1";

  it("appends /chat/completions when missing", () => {
    expect(ensureApiUrl(BASE_URL)).toBe(`${BASE_URL}/chat/completions`);
  });

  it("does not duplicate /chat/completions", () => {
    expect(ensureApiUrl(`${BASE_URL}/chat/completions`)).toBe(`${BASE_URL}/chat/completions`);
  });

  it("strips trailing slashes", () => {
    expect(ensureApiUrl(`${BASE_URL}/`)).toBe(`${BASE_URL}/chat/completions`);
    expect(ensureApiUrl(`${BASE_URL}//`)).toBe(`${BASE_URL}/chat/completions`);
  });
});

describe("getActiveProvider", () => {
  const providers = [
    { id: "p1", name: "Provider 1", baseUrl: "https://api1.com/v1", model: "gpt-4", apiKey: "key1" },
    { id: "p2", name: "Provider 2", baseUrl: "https://api2.com/v1", model: "claude-3", apiKey: "key2" },
  ];

  it("returns the active provider by id", () => {
    const result = getActiveProvider({ apiProviders: providers, activeApiProviderId: "p2" });
    expect(result?.id).toBe("p2");
  });

  it("returns the first provider when no activeApiProviderId", () => {
    const result = getActiveProvider({ apiProviders: providers, activeApiProviderId: "" });
    expect(result?.id).toBe("p1");
  });

  it("returns undefined when activeApiProviderId does not match", () => {
    const result = getActiveProvider({ apiProviders: providers, activeApiProviderId: "nonexistent" });
    expect(result).toBeUndefined();
  });

  it("returns the first provider when activeApiProviderId is undefined-like", () => {
    const result = getActiveProvider({ apiProviders: providers, activeApiProviderId: "" });
    expect(result?.name).toBe("Provider 1");
  });
});

describe("parseMcpHeaders", () => {
  it("returns empty object for empty string", () => {
    expect(parseMcpHeaders("")).toEqual({});
  });

  it("parses valid JSON headers", () => {
    const result = parseMcpHeaders('{"Authorization":"Bearer xxx"}');
    expect(result).toEqual({ Authorization: "Bearer xxx" });
  });

  it("returns empty object for invalid JSON", () => {
    expect(parseMcpHeaders("{invalid}")).toEqual({});
  });

  it("returns empty object for JSON array", () => {
    expect(parseMcpHeaders('["a","b"]')).toEqual({});
  });

  it("returns empty object for JSON primitive", () => {
    expect(parseMcpHeaders('"string"')).toEqual({});
  });
});