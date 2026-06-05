export interface QuoteBarState {
  quoteText: string;
  attachments: { name: string; type: string; data?: string; size: number }[];
}

export function renderQuoteBar(
  attachPreviewEl: HTMLElement,
  state: QuoteBarState,
  onRemoveQuote: () => void,
  onRemoveAttachment: (index: number) => void,
) {
  attachPreviewEl.empty();
  if (state.quoteText) {
    attachPreviewEl.style.display = "flex";
    const chip = attachPreviewEl.createDiv({ cls: "xiaoyuan-attach-chip xy-quote-chip" });
    chip.textContent = "📎 引用: " + (state.quoteText.length > 50 ? state.quoteText.slice(0, 50) + "..." : state.quoteText);
    const removeBtn = chip.createSpan({ text: " ✕" });
    removeBtn.style.cursor = "pointer";
    removeBtn.addEventListener("click", onRemoveQuote);
  }
  for (let i = 0; i < state.attachments.length; i++) {
    const att = state.attachments[i];
    attachPreviewEl.style.display = "flex";
    if (att.type.startsWith("image/") && att.data) {
      const preview = attachPreviewEl.createDiv({ cls: "xiaoyuan-attach-chip" });
      const img = preview.createEl("img", { attr: { src: att.data } });
      img.style.cssText = "max-height:48px;max-width:48px;border-radius:4px;object-fit:cover;";
      const label = preview.createSpan({ text: " " + att.name });
      label.style.cssText = "font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100px;";
      const removeBtn = preview.createSpan({ text: " ×" });
      removeBtn.style.cursor = "pointer";
      removeBtn.addEventListener("click", () => onRemoveAttachment(i));
    } else {
      const chip = attachPreviewEl.createDiv({ cls: "xiaoyuan-attach-chip" });
      chip.textContent = att.name.length > 20 ? att.name.slice(0, 17) + "..." : att.name;
      const removeBtn = chip.createSpan({ text: " ×" });
      removeBtn.style.cursor = "pointer";
      removeBtn.addEventListener("click", () => onRemoveAttachment(i));
    }
  }
  if (!state.quoteText && state.attachments.length === 0) {
    attachPreviewEl.style.display = "none";
  }
}