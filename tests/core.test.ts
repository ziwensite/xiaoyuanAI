import { describe, it, expect } from "vitest";

// ─── estimateTokens ──────────────────────────────────────────

function estimateTokens(text: string): number {
  let tokens = 0;
  for (const ch of text) {
    tokens += ch.charCodeAt(0) > 127 ? 1.5 : 0.25;
  }
  return Math.ceil(tokens);
}

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
    expect(t).toBe(5); // 5*0.25 + 2*1.5 = 1.25 + 3 = 4.25 → Math.ceil = 5
  });

  it("always rounds up", () => {
    expect(estimateTokens("a")).toBe(1); // 0.25 → 1
    expect(estimateTokens("ab")).toBe(1); // 0.5 → 1
    expect(estimateTokens("abc")).toBe(1); // 0.75 → 1
    expect(estimateTokens("abcd")).toBe(1); // 1.0 → 1
    expect(estimateTokens("abcde")).toBe(2); // 1.25 → 2
  });
});

// ─── parseDiffText ───────────────────────────────────────────

interface FileDiff {
  file: string;
  before: string;
  after: string;
  additions: number;
  deletions: number;
}

function parseDiffText(text: string): FileDiff[] {
  const result: FileDiff[] = [];
  const blocks = text.split(/(?=^diff --git )/m);
  for (const block of blocks) {
    if (!block.trim()) continue;
    const file = block.match(/^\+\+\+ b\/(.+)$/m)?.[1] || "";
    if (!file) continue;
    const lines = block.split("\n");
    const startIdx = lines.findIndex(l => l.startsWith("@@"));
    const beforeLines: string[] = [];
    const afterLines: string[] = [];
    for (let i = startIdx + 1; i < lines.length; i++) {
      const l = lines[i];
      if (l.startsWith("-")) beforeLines.push(l.slice(1));
      else if (l.startsWith("+")) afterLines.push(l.slice(1));
      else { beforeLines.push(l); afterLines.push(l); }
    }
    const addCount = lines.filter(l => l.startsWith("+") && !l.startsWith("+++")).length;
    const delCount = lines.filter(l => l.startsWith("-") && !l.startsWith("---")).length;
    result.push({ file, before: beforeLines.join("\n"), after: afterLines.join("\n"), additions: addCount, deletions: delCount });
  }
  return result;
}

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

// ─── simpleHash ──────────────────────────────────────────────

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return (h >>> 0).toString(36);
}

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

// ─── ensureApiUrl ────────────────────────────────────────────

const BASE_URL = "https://api.openai.com/v1";

function ensureApiUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : trimmed + "/chat/completions";
}

describe("ensureApiUrl", () => {
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

// ─── formatDate / formatTime (from session.ts) ───────────────

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

describe("formatDate", () => {
  it("formats a timestamp correctly", () => {
    const d = new Date(2025, 0, 15); // Jan 15, 2025
    expect(formatDate(d.getTime())).toBe("2025-01-15");
  });
});

describe("formatTime", () => {
  it("includes hours and minutes", () => {
    const d = new Date(2025, 5, 10, 14, 30);
    expect(formatTime(d.getTime())).toContain("14:30");
  });
});
