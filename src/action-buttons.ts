import { setIcon, setTooltip } from "obsidian";

export const ACTION_LABELS = {
  copy: "复制",
  speak: "朗读",
  quote: "引用",
  edit: "在编辑器中打开",
  undo: "撤销",
  replace: "替换选中文本",
  rename: "重命名",
  open: "在编辑器中打开",
  delete: "删除此对话",
  aiTools: "小元写作",
  capture: "捕获",
  template: "选用模板",
} as const;

export type ActionType = keyof typeof ACTION_LABELS;

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
  template: "file-pen",
};

export function createActionBtn(type: ActionType): HTMLSpanElement {
  const btn = document.createElement("span");
  btn.className = "xiaoyuan-msg-action";
  setIcon(btn, ICON_MAP[type]);
  setTooltip(btn, ACTION_LABELS[type]);
  return btn;
}
