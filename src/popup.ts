export function showPopup(
  trigger: HTMLElement,
  buildContent: (popup: HTMLDivElement) => void,
  options?: { maxHeight?: string; direction?: "down" | "up" },
): HTMLDivElement | null {
  if (document.querySelector(".xy-popup")) {
    document.querySelectorAll(".xy-popup").forEach((el) => el.remove());
    return null;
  }
  const popup = document.body.createDiv({ cls: "xy-popup" });
  const rect = trigger.getBoundingClientRect();
  popup.style.cssText = `position:fixed;left:${rect.left}px;`;
  if (options?.maxHeight) popup.style.maxHeight = options.maxHeight;
  buildContent(popup);
  if (options?.direction === "up") {
    document.body.appendChild(popup);
    popup.style.bottom = `${window.innerHeight - rect.top + 2}px`;
  } else {
    popup.style.top = `${rect.bottom}px`;
    document.body.appendChild(popup);
  }
  setTimeout(() => {
    const handler = (ev: MouseEvent) => {
      if (!popup.contains(ev.target as Node)) {
        popup.remove();
        document.removeEventListener("click", handler);
      }
    };
    document.addEventListener("click", handler);
  }, 0);
  return popup;
}

export function addPopupItem(
  parent: HTMLElement,
  label: string,
  checked: boolean,
  onClick: () => void,
): HTMLDivElement {
  const item = parent.createDiv({ cls: "xy-popup-item" });
  const check = item.createSpan({ cls: "xy-popup-check" });
  check.textContent = checked ? "✓" : "";
  const labelEl = item.createSpan({ cls: "xy-popup-label" });
  labelEl.textContent = label;
  item.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
    const popup = item.closest(".xy-popup") as HTMLDivElement;
    if (popup) popup.remove();
  });
  return item;
}
