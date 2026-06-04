export interface QuoteBarState {
  quoteText: string;
  attachments: { name: string; size: number }[];
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
    const chip = attachPreviewEl.createDiv({ cls: "xiaoyuan-attach-chip" });
    chip.textContent = att.name.length > 20 ? att.name.slice(0, 17) + "..." : att.name;
    const removeBtn = chip.createSpan({ text: " ×" });
    removeBtn.style.cursor = "pointer";
    removeBtn.addEventListener("click", () => onRemoveAttachment(i));
  }
  if (!state.quoteText && state.attachments.length === 0) {
    attachPreviewEl.style.display = "none";
  }
}