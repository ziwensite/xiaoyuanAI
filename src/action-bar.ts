import { Notice } from "obsidian";
import { createActionBtn } from "./action-buttons";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export interface ActionBarOptions {
  execMode: string;
  undoMessage: (id: string) => void;
  openInEditor: (content: string, timestamp?: number) => void;
  quote: (text: string) => void;
  onSpeak: (text: string) => void;
  onAITools: (content: string, e: MouseEvent) => void;
}

export function buildActionBar(
  msgEl: HTMLElement,
  role: string,
  content: string,
  timestamp: number | undefined,
  options: ActionBarOptions,
) {
  const actionsEl = msgEl.createDiv({ cls: "xiaoyuan-msg-actions" });

  if (role === "user") {
    const copyBtn = createActionBtn("copy");
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(content);
      new Notice("已复制");
    });
    actionsEl.appendChild(copyBtn);

    const speakBtn = createActionBtn("speak");
    speakBtn.addEventListener("click", () => options.onSpeak(content));
    actionsEl.appendChild(speakBtn);

    const quoteBtn = createActionBtn("quote");
    quoteBtn.addEventListener("click", () => options.quote(content));
    actionsEl.appendChild(quoteBtn);

    const undoBtn = createActionBtn("undo");
    undoBtn.addEventListener("click", () => options.undoMessage(msgEl.id));
    actionsEl.appendChild(undoBtn);

    const aiBtn = createActionBtn("aiTools");
    aiBtn.addEventListener("click", (e) => options.onAITools(content, e));
    actionsEl.appendChild(aiBtn);
  } else {
    const copyBtn = createActionBtn("copy");
    copyBtn.addEventListener("click", () => {
      const sel = window.getSelection();
      const selected = sel?.toString().trim();
      navigator.clipboard.writeText(selected || content);
      new Notice("已复制");
    });
    actionsEl.appendChild(copyBtn);

    const speakBtn = createActionBtn("speak");
    speakBtn.addEventListener("click", () => options.onSpeak(content));
    actionsEl.appendChild(speakBtn);

    const quoteBtn = createActionBtn("quote");
    quoteBtn.addEventListener("click", () => options.quote(content));
    actionsEl.appendChild(quoteBtn);

    const editBtn = createActionBtn("edit");
    editBtn.addEventListener("click", () => options.openInEditor(content, timestamp));
    actionsEl.appendChild(editBtn);

    const aiBtn = createActionBtn("aiTools");
    aiBtn.addEventListener("click", (e) => options.onAITools(content, e));
    actionsEl.appendChild(aiBtn);
  }

  if (timestamp) {
    actionsEl.createSpan({ cls: "xiaoyuan-msg-time", text: `${options.execMode.toUpperCase()} · ${formatTime(timestamp)}` });
  }
}
