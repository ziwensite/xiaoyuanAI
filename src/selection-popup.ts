import { Notice } from "obsidian";
import { createActionBtn } from "./action-buttons";

export interface SelectionPopupConfig {
  getSelectedText: () => string;
  getPosition: () => { x: number; y: number } | null;
  onQuote: (text: string) => void;
  onSpeak: (text: string) => void;
  onAITools: (text: string, e: MouseEvent) => void;
  onCapture: (text: string) => void;
}

export function registerSelectionListener(
  container: HTMLElement,
  config: SelectionPopupConfig,
): void {
  container.addEventListener("mouseup", () => {
    setTimeout(() => {
      const text = config.getSelectedText();
      if (!text) { removeSelectionPopup(); return; }
      const pos = config.getPosition();
      if (!pos) return;
      showSelectionPopup(text, pos.x, pos.y, config);
    }, 10);
  });
  document.addEventListener("mousedown", (e) => {
    if (!(e.target instanceof HTMLElement) || !e.target.closest(".xy-selection-popup")) {
      removeSelectionPopup();
    }
  });
}

function removeSelectionPopup() {
  document.querySelectorAll(".xy-selection-popup").forEach((el) => el.remove());
}

export function showSelectionPopup(text: string, x: number, y: number, config: SelectionPopupConfig) {
  removeSelectionPopup();
  const popup = document.body.createDiv({ cls: "xy-selection-popup" });

  const copyBtn = createActionBtn("copy");
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(text);
    new Notice("已复制");
    removeSelectionPopup();
  });
  popup.appendChild(copyBtn);

  const speakBtn = createActionBtn("speak");
  speakBtn.addEventListener("click", () => {
    config.onSpeak(text);
    removeSelectionPopup();
  });
  popup.appendChild(speakBtn);

  const quoteBtn = createActionBtn("quote");
  quoteBtn.addEventListener("click", () => {
    config.onQuote(text);
    removeSelectionPopup();
  });
  popup.appendChild(quoteBtn);

  const captureBtn = createActionBtn("capture");
  captureBtn.addEventListener("click", () => {
    config.onCapture(text);
    removeSelectionPopup();
  });
  popup.appendChild(captureBtn);

  const aiBtn = createActionBtn("aiTools");
  aiBtn.addEventListener("click", (e) => {
    config.onAITools(text, e);
    removeSelectionPopup();
  });
  popup.appendChild(aiBtn);

  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
  document.body.appendChild(popup);
}