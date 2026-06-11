import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import { Plugin, WorkspaceLeaf, Notice, MarkdownView, Menu, setIcon } from "obsidian";
import type { XiaoyuanAISettings, SkillEntry } from "./types";
import { XiaoyuanAIChatView } from "./chat-view";
import { XiaoyuanAISettingTab } from "./settings";
import { TextOperationModal } from "./modals";
import { DEFAULT_SETTINGS, VIEW_TYPE_XIAOYUAN_AI_CHAT, DEFAULT_PROMPT_TEMPLATES } from "./constants";
import { ensureOpenCodeServer, stopOpenCodeServer } from "./ai";
import { resolveOpenCodePath } from "./opencode-server";
import { getVaultBasePath, setVaultBasePath } from "./server";
import { showSelectionPopup } from "./selection-popup";
import { SpeakController } from "./speak-controller";

export default class XiaoyuanAIPlugin extends Plugin {
  settings!: XiaoyuanAISettings;
  speakController = new SpeakController();
  private lastSkillRun = new Map<string, number>();

  async onload() {
    await this.loadSettings();
    const adapter = this.app.vault.adapter as { getBasePath?: () => string };
    if (adapter.getBasePath) setVaultBasePath(adapter.getBasePath());

    if (this.settings.execMode !== "api") {
      const resolved = await resolveOpenCodePath(this.settings.opencode.cliPath);
      if (!fsSync.existsSync(resolved)) {
        new Notice("未检测到 opencode 程序，CLI 功能不可用");
      }
    }

    this.registerView(VIEW_TYPE_XIAOYUAN_AI_CHAT, (leaf) => new XiaoyuanAIChatView(leaf, this));
    const statusBarIndicator = this.addStatusBarItem();
    statusBarIndicator.addClass("xy-speak-indicator");
    statusBarIndicator.style.display = "none";
    setIcon(statusBarIndicator, "volume-2");
    statusBarIndicator.addEventListener("click", () => this.speakController.stop());
    this.speakController.onChange = (speaking) => {
      statusBarIndicator.style.display = speaking ? "" : "none";
    };
    this.addRibbonIcon("message-circle", "小元AI", () => this.activateChatView());

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        const sel = editor.getSelection();
        menu.addItem((item) => {
          item.setTitle("小元AI工具");
          item.setIcon("sparkles");
          const submenu = item.setSubmenu();
          for (const tpl of this.settings.promptTemplates) {
            submenu.addItem((subItem) => {
              subItem.setTitle(`${tpl.name} — ${tpl.description}`);
              subItem.setIcon(tpl.icon);
              subItem.onClick(() => new TextOperationModal(this.app, this, tpl.id, sel).open());
            });
          }
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

    // 动态注册 wiki skill 命令
    for (const skill of this.settings.skills) {
      this.addCommand({
        id: `xiaoyuanAI-skill-${skill.name}`,
        name: `📖 ${skill.name} — ${skill.description}`,
        callback: () => {
          const leaf = this.activateChatView();
          if (leaf?.view instanceof XiaoyuanAIChatView) {
            leaf.view.inputEl.value = `/${skill.name} `;
            leaf.view.inputEl.focus();
          }
        },
      });
    }

    // 定时 skill 任务
    this.registerInterval(window.setInterval(() => {
      const now = Date.now();
      for (const skill of this.settings.skills) {
        if (!skill.autoRunInterval) continue;
        const lastRun = this.lastSkillRun.get(skill.name) || 0;
        if (now - lastRun >= skill.autoRunInterval * 60 * 1000) {
          this.lastSkillRun.set(skill.name, now);
          this.executeScheduledSkill(skill).catch(() => {});
        }
      }
    }, 60000));

    if (this.settings.opencode.autoStart) {
      this.autoStartServer();
    }

    if (this.settings.autoOpen) {
      this.app.workspace.onLayoutReady(() => this.activateChatView());
    }

    this.app.workspace.onLayoutReady(() => {
      this.cleanTempFiles();
    });

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

        showSelectionPopup(text, x, y, {
          getSelectedText: () => text,
          getPosition: () => ({ x, y }),
          onSpeak: (t) => this.speakController.start(t),
          onQuote: (t) => {
            this.activateChatView();
            const chatLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT).first();
            if (chatLeaf?.view instanceof XiaoyuanAIChatView) {
              chatLeaf.view.quote(t);
            }
          },
          onCapture: (t) => {
            navigator.clipboard.writeText(t);
            const cmdId = this.settings.captureCommandId;
            if (cmdId) this.app.commands.executeCommandById(cmdId);
          },
          onAITools: (t, ev) => {
            const menu = new Menu();
            for (const tpl of this.settings.promptTemplates) {
              menu.addItem((item) => {
                item.setTitle(`${tpl.name} — ${tpl.description}`);
                item.setIcon(tpl.icon);
                item.onClick(() => new TextOperationModal(this.app, this, tpl.id, t).open());
              });
            }
            menu.showAtMouseEvent(ev);
          },
        });
      }, 10);
    });
  }

  private async cleanTempFiles() {
    try {
      const tempDir = path.join(getVaultBasePath(), this.settings.chatHistoryPath, "temp");
      try { await fs.access(tempDir); } catch { return; }
      const names = await fs.readdir(tempDir);
      const mdFiles = names.filter(n => n.endsWith(".md")).sort();
      const maxFiles = 50;
      while (mdFiles.length > maxFiles) {
        const f = mdFiles.shift();
        if (f) await fs.unlink(path.join(tempDir, f));
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
    // 补全缺失的内置模板
    for (const def of DEFAULT_PROMPT_TEMPLATES) {
      if (!this.settings.promptTemplates.some(t => t.id === def.id)) {
        this.settings.promptTemplates.push({ ...def });
      }
    }
    // 补全旧条目缺失的 icon 字段
    for (const tpl of this.settings.promptTemplates) {
      const def = DEFAULT_PROMPT_TEMPLATES.find(d => d.id === tpl.id);
      if (def && !tpl.icon) tpl.icon = def.icon;
    }
    // 按默认顺序排序
    const orderMap = new Map(DEFAULT_PROMPT_TEMPLATES.map((t, i) => [t.id, i]));
    this.settings.promptTemplates.sort((a, b) => {
      const ai = orderMap.get(a.id) ?? 999;
      const bi = orderMap.get(b.id) ?? 999;
      return ai - bi;
    });
  }
  async saveSettings() {
    const encoded = this.settings.apiProviders.map(p => ({
      ...p, apiKey: p.apiKey ? btoa(p.apiKey) : p.apiKey,
    }));
    await this.saveData({ ...this.settings, apiProviders: encoded });
  }

  private async executeScheduledSkill(skill: SkillEntry) {
    const now = new Date();
    const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const logLine = `- ${d} | 🔄 自动: ${skill.name} — ${skill.description}\n`;

    try {
      const logPath = path.join(getVaultBasePath(), "_autoTaskLog.md");
      await fs.appendFile(logPath, logLine);
    } catch {}

    const leaf = this.activateChatView();
    if (leaf?.view instanceof XiaoyuanAIChatView) {
      leaf.view.addSystemMessage(`🔄 自动执行: ${skill.name}`);
      leaf.view.inputEl.value = `/${skill.name} 执行定时任务`;
      leaf.view.sendMessage();
    }
  }

  async onunload() {
    this.speakController.stop();
    stopOpenCodeServer();
    for (const p of this.settings.apiProviders) {
      p.apiKey = "";
    }
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT);
  }
}
