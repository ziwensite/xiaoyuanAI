import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import { Plugin, WorkspaceLeaf, Notice, MarkdownView, Menu } from "obsidian";
import type { XiaoyuanAISettings } from "./types";
import { DEFAULT_SETTINGS, VIEW_TYPE_XIAOYUAN_AI_CHAT } from "./constants";
import { XiaoyuanAIChatView } from "./chat-view";
import { XiaoyuanAISettingTab } from "./settings";
import { TextOperationModal } from "./modals";
import { OPERATION_LABELS, OPERATIONS, OPERATION_ICONS } from "./constants";
import { ensureOpenCodeServer, stopOpenCodeServer } from "./ai";
import { resolveOpenCodePath } from "./opencode-server";
import { getVaultBasePath, setVaultBasePath } from "./server";
import { createActionBtn } from "./action-buttons";

export default class XiaoyuanAIPlugin extends Plugin {
  settings!: XiaoyuanAISettings;

  async onload() {
    await this.loadSettings();
    const adapter = this.app.vault.adapter as { getBasePath?: () => string };
    if (adapter.getBasePath) setVaultBasePath(adapter.getBasePath());

    if (this.settings.execMode === "cli") {
      const resolved = await resolveOpenCodePath(this.settings.opencode.cliPath);
      if (!fsSync.existsSync(resolved)) {
        this.settings.execMode = "api";
        await this.saveSettings();
        new Notice("未检测到 opencode 程序，已自动切换为 API 模式");
      }
    }

    this.registerView(VIEW_TYPE_XIAOYUAN_AI_CHAT, (leaf) => new XiaoyuanAIChatView(leaf, this));
    this.addRibbonIcon("message-circle", "小元AI", () => this.activateChatView());

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        const sel = editor.getSelection();
        menu.addItem((item) => {
          item.setTitle("小元写作");
          item.setIcon("sparkles");
          const submenu = item.setSubmenu();
          OPERATIONS.forEach((op) => {
            submenu.addItem((subItem) => {
              subItem.setTitle(OPERATION_LABELS[op]);
              subItem.setIcon(OPERATION_ICONS[op]);
              subItem.onClick(() => new TextOperationModal(this.app, this, op, sel).open());
            });
          });
        });
      }),
    );

    this.addCommand({
      id: "xiaoyuanAI-toggle-chat",
      name: "切换小元AI聊天面板",
      callback: () => this.activateChatView(),
      hotkeys: [{ modifiers: ["Ctrl", "Shift"], key: "C" }],
    });

    this.addCommand({
      id: "xiaoyuanAI-new-chat",
      name: "\u{1F4AC} 新建 AI 对话",
      callback: () => {
        const leaf = this.activateChatView();
        if (leaf?.view instanceof XiaoyuanAIChatView) leaf.view.newChat();
      },
      hotkeys: [{ modifiers: ["Ctrl", "Shift"], key: "N" }],
    });

    OPERATIONS.forEach((op) => {
      this.addCommand({
        id: `xiaoyuanAI-${op}`,
        name: `AI ${OPERATION_LABELS[op]}选中文本`,
        editorCallback: (editor) => {
          const text = editor.getSelection();
          if (text) new TextOperationModal(this.app, this, op, text).open();
        },
      });
    });

    this.addCommand({
      id: "xiaoyuanAI-chat-with-note", name: "\u{1F4C4} 用当前笔记开启 AI 对话",
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) { new Notice("请先打开一个笔记"); return; }
        const content = await this.app.vault.read(file);
        const leaf = this.activateChatView();
        if (leaf?.view instanceof XiaoyuanAIChatView) {
          leaf.view.addMessage("user", `我有一段笔记内容，帮我分析：\n\n${content.slice(0, 3000)}`);
        }
      },
    });

    this.addSettingTab(new XiaoyuanAISettingTab(this.app, this));

    if (this.settings.execMode === "cli" && this.settings.opencode.autoStart) {
      this.autoStartServer();
    }

    if (this.settings.autoOpen) {
      this.app.workspace.onLayoutReady(() => this.activateChatView());
    }

    this.app.workspace.onLayoutReady(() => this.cleanTempFiles());

    this.registerDomEvent(document, "mouseup", (e: MouseEvent) => {
      setTimeout(() => {
        const modalEl = document.querySelector(".xiaoyuan-modal-container");
        if (modalEl?.contains(e.target as Node)) return;

        const chatEl = document.querySelector(".xiaoyuan-chat");
        if (chatEl?.contains(e.target as Node)) return;

        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return;
        const editor = view.editor;
        const text = editor.getSelection();
        if (!text.trim()) return;

        const domSel = window.getSelection();
        if (!domSel || !domSel.rangeCount) return;
        const editorEl = view.contentEl;
        if (!editorEl.contains(domSel.anchorNode)) return;
        const rect = domSel.getRangeAt(0).getBoundingClientRect();
        const x = rect.left + rect.width / 2 - 60;
        const y = rect.top - 36;

        document.querySelectorAll(".xy-selection-popup").forEach((el) => el.remove());

        const popup = document.body.createDiv({ cls: "xy-selection-popup" });

        const copyBtn = createActionBtn("copy");
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(text);
          new Notice("已复制");
          popup.remove();
        });
        popup.appendChild(copyBtn);

        const speakBtn = createActionBtn("speak");
        speakBtn.addEventListener("click", () => {
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text.replace(/[#*_`\[\]]/g, ""));
          u.lang = "zh-CN"; speechSynthesis.speak(u);
          popup.remove();
        });
        popup.appendChild(speakBtn);

        const quoteBtn = createActionBtn("quote");
        quoteBtn.addEventListener("click", () => {
          this.activateChatView();
          const chatLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT).first();
          if (chatLeaf?.view instanceof XiaoyuanAIChatView) {
            chatLeaf.view.quote(text);
          }
          popup.remove();
        });
        popup.appendChild(quoteBtn);

        const aiBtn = createActionBtn("aiTools");
        aiBtn.addEventListener("click", (ev: MouseEvent) => {
          const menu = new Menu();
          OPERATIONS.forEach((op) => {
            menu.addItem((item) => {
              item.setTitle(OPERATION_LABELS[op]);
              item.setIcon(OPERATION_ICONS[op]);
              item.onClick(() => new TextOperationModal(this.app, this, op, text).open());
            });
          });
          menu.showAtMouseEvent(ev);
          popup.remove();
        });
        popup.appendChild(aiBtn);

        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        document.body.appendChild(popup);
      }, 10);
    });
  }

  private async cleanTempFiles() {
    try {
      const tempDir = path.join(getVaultBasePath(), this.settings.chatHistoryPath, "temp");
      try { await fs.access(tempDir); } catch { return; }
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000;
      const names = await fs.readdir(tempDir);
      for (const name of names) {
        const fp = path.join(tempDir, name);
        const stat = await fs.stat(fp);
        if (stat.isFile() && name.endsWith(".md") && now - stat.mtimeMs > maxAge) {
          await fs.unlink(fp);
        }
      }
    } catch (err: unknown) { console.warn("清理临时文件失败:", err); }
  }

  private async autoStartServer(): Promise<void> {
    try {
      const vaultDir = getVaultBasePath();
      await ensureOpenCodeServer(
        this.settings.opencode.cliPath,
        this.settings.opencode.hostname,
        this.settings.opencode.port,
        vaultDir,
        true,
      );
    } catch (err: unknown) {
      console.warn("自动启动 opencode serve 失败:", err);
    }
  }

  activateChatView(): WorkspaceLeaf | undefined {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT).first();
    if (!leaf) {
      const useRight = this.settings.chatViewType === "right";
      leaf = useRight ? (workspace.getRightLeaf(false) ?? undefined) : (workspace.getLeftLeaf(false) ?? undefined);
      if (leaf) leaf.setViewState({ type: VIEW_TYPE_XIAOYUAN_AI_CHAT, active: true });
    }
    if (leaf) workspace.revealLeaf(leaf);
    return leaf;
  }

  getActiveEditor() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    return view?.editor || null;
  }

  async loadSettings() {
    const data = await this.loadData() || {};
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...data,
      opencode: { ...DEFAULT_SETTINGS.opencode, ...data?.opencode },
    };
    if (!this.settings.opencode.agent) this.settings.opencode.agent = "build";
    for (const p of this.settings.apiProviders) {
      if (p.apiKey) {
        try { p.apiKey = atob(p.apiKey); } catch { /* 明文 Key，无需解码 */ }
      }
    }
  }
  async saveSettings() {
    const encoded = this.settings.apiProviders.map(p => ({
      ...p, apiKey: p.apiKey ? btoa(p.apiKey) : p.apiKey,
    }));
    await this.saveData({ ...this.settings, apiProviders: encoded });
  }

  async onunload() {
    stopOpenCodeServer();
    for (const p of this.settings.apiProviders) {
      p.apiKey = "";
    }
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT);
  }
}
