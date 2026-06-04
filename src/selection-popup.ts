import { setIcon, setTooltip, Notice } from "obsidian";

export function registerSelectionListener(
  messagesEl: HTMLElement,
  onQuote: (text: string) => void,
  onSpeak: (text: string) => void,
) {
  messagesEl.addEventListener("mouseup", () => {
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || !sel.toString().trim()) { removeSelectionPopup(); return; }
      const range = sel.getRangeAt(0);
      if (!messagesEl.contains(range.commonAncestorContainer)) return;
      const rect = range.getBoundingClientRect();
      showSelectionPopup(sel.toString().trim(), rect.left + rect.width / 2 - 60, rect.top - 36, onQuote, onSpeak);
    }, 10);
  });
  document.addEventListener("mousedown", (e) => {
    if (!(e.target as HTMLElement)?.closest?.(".xy-selection-popup")) {
      removeSelectionPopup();
    }
  });
}

function removeSelectionPopup() {
  document.querySelectorAll(".xy-selection-popup").forEach((el) => el.remove());
}

function showSelectionPopup(text: string, x: number, y: number, onQuote: (text: string) => void, onSpeak: (text: string) => void) {
  removeSelectionPopup();
  const popup = document.body.createDiv({ cls: "xy-selection-popup" });

  const copyBtn = popup.createSpan({ cls: "xiaoyuan-msg-action" });
  setIcon(copyBtn, "copy");
  setTooltip(copyBtn, "复制选中");
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(text);
    new Notice("已复制");
    removeSelectionPopup();
  });

  const speakBtn = popup.createSpan({ cls: "xiaoyuan-msg-action" });
  setIcon(speakBtn, "volume-2");
  setTooltip(speakBtn, "朗读选中");
  speakBtn.addEventListener("click", () => {
    onSpeak(text);
    removeSelectionPopup();
  });

  const quoteBtn = popup.createSpan({ cls: "xiaoyuan-msg-action" });
  setIcon(quoteBtn, "quote");
  setTooltip(quoteBtn, "引用选中");
  quoteBtn.addEventListener("click", () => {
    onQuote(text);
    removeSelectionPopup();
  });

  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
  document.body.appendChild(popup);
}