import { setIcon, setTooltip, Notice } from "obsidian";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export interface ActionBarOptions {
  execMode: string;
  undoMessage: (id: string) => void;
  openInEditor: (content: string, timestamp?: number) => void;
  followUp: (text: string) => void;
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
    const followUpBtn = actionsEl.createSpan({ cls: "xiaoyuan-msg-action" });
    setIcon(followUpBtn, "corner-up-right");
    setTooltip(followUpBtn, "追问");
    followUpBtn.addEventListener("click", () => options.followUp(content));

    const copyBtn = actionsEl.createSpan({ cls: "xiaoyuan-msg-action" });
    setIcon(copyBtn, "copy");
    setTooltip(copyBtn, "复制");
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(content);
      new Notice("已复制");
    });

    const undoBtn = actionsEl.createSpan({ cls: "xiaoyuan-msg-action" });
    setIcon(undoBtn, "undo");
    setTooltip(undoBtn, "撤销此消息");
    undoBtn.addEventListener("click", () => {
      options.undoMessage(msgEl.id);
    });
  } else {
    const copyBtn = actionsEl.createSpan({ cls: "xiaoyuan-msg-action" });
    setIcon(copyBtn, "copy");
    setTooltip(copyBtn, "复制");
    copyBtn.addEventListener("click", () => {
      const sel = window.getSelection();
      const selected = sel?.toString().trim();
      navigator.clipboard.writeText(selected || content);
      new Notice("已复制");
    });

    const speakBtn = actionsEl.createSpan({ cls: "xiaoyuan-msg-action" });
    let isSpeaking = false;
    setIcon(speakBtn, "volume-2");
    setTooltip(speakBtn, "朗读");
    speakBtn.addEventListener("click", () => {
      if (isSpeaking) {
        speechSynthesis.cancel();
        isSpeaking = false;
        setIcon(speakBtn, "volume-2");
        setTooltip(speakBtn, "朗读");
      } else {
        speechSynthesis.cancel();
        speakText(content);
        isSpeaking = true;
        setIcon(speakBtn, "square");
        setTooltip(speakBtn, "停止");
      }
    });

    const followUpBtn = actionsEl.createSpan({ cls: "xiaoyuan-msg-action" });
    setIcon(followUpBtn, "corner-up-right");
    setTooltip(followUpBtn, "追问");
    followUpBtn.addEventListener("click", () => options.followUp(content));

    const editBtn = actionsEl.createSpan({ cls: "xiaoyuan-msg-action" });
    setIcon(editBtn, "pencil");
    setTooltip(editBtn, "在编辑器中编辑");
    editBtn.addEventListener("click", () => options.openInEditor(content, timestamp));
  }

  if (timestamp) {
    actionsEl.createSpan({ cls: "xiaoyuan-msg-time", text: `${options.execMode.toUpperCase()} · ${formatTime(timestamp)}` });
  }
}

export function speakText(text: string) {
  const utterance = new SpeechSynthesisUtterance(text.replace(/[#*_`\[\]]/g, ""));
  utterance.lang = "zh-CN";
  utterance.rate = 1.0;
  speechSynthesis.speak(utterance);
}