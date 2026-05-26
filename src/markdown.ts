export function renderMarkdown(text: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const blocks: string[] = [];
  let h = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const idx = blocks.length;
    blocks.push(`<pre><code class="language-${lang}">${esc(code.trim())}</code></pre>`);
    return `\x00CODEBLOCK${idx}\x00`;
  });

  h = esc(h);

  h = h
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/^- (.+)$/gm, "\u2022 $1")
    .replace(/\n/g, "<br>");

  h = h.replace(/\x00CODEBLOCK(\d+)\x00/g, (_m, idx) => blocks[parseInt(idx)]);
  return h;
}
