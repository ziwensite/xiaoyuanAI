import { setIcon, setTooltip } from "obsidian";
import { t } from "./i18n";

const LABEL_KEYS: Record<string, string> = {
  copy: "btn.copy",
  speak: "btn.speak",
  quote: "btn.quote",
  edit: "btn.edit",
  undo: "btn.undo",
  replace: "btn.replace",
  rename: "btn.rename",
  open: "btn.open",
  delete: "btn.delete",
  aiTools: "btn.aiTools",
  capture: "btn.capture",
};

export type ActionType = keyof typeof LABEL_KEYS;

const ICON_MAP: Record<ActionType, string> = {
  copy: "copy",
  speak: "volume-2",
  quote: "quote",
  edit: "notebook-pen",
  undo: "undo",
  replace: "replace",
  rename: "folder-pen",
  open: "notebook-pen",
  delete: "trash-2",
  aiTools: "sparkles",
  capture: "camera",
};

export function createActionBtn(type: ActionType): HTMLSpanElement {
  const btn = document.createElement("span");
  btn.className = "xiaoyuan-msg-action";
  setIcon(btn, ICON_MAP[type]);
  setTooltip(btn, t(LABEL_KEYS[type]));
  return btn;
}