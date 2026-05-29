import { Plugin, WorkspaceLeaf, Notice } from "obsidian";
import { XiaoyuanAISettings, DEFAULT_SETTINGS, VIEW_TYPE_XIAOYUAN_AI_CHAT } from "./types";
import { XiaoyuanAIChatView } from "./chat-view";
import { XiaoyuanAISettingTab } from "./settings";
import { TextOperationModal, WikiCommandModal } from "./modals";
import { OPERATION_LABELS } from "./types";
import { ensureOpenCodeServer, stopOpenCodeServer } from "./ai";
import { getVaultBasePath } from "./server";

export default class XiaoyuanAIPlugin extends Plugin {
  settings!: XiaoyuanAISettings;

  async onload() {
    await this.loadSettings();

    this.registerView(VIEW_TYPE_XIAOYUAN_AI_CHAT, (leaf) => new XiaoyuanAIChatView(leaf, this));
    this.addRibbonIcon("message-circle", "小元AI", () => this.activateChatView());

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        const sel = editor.getSelection();
        if (!sel) return;
        ["polish", "summarize", "complete", "expand", "translate", "continue"].forEach((op) => {
          menu.addItem((item) => {
            item.setTitle(`AI ${OPERATION_LABELS[op]}`);
            item.setIcon(op === "polish" ? "pencil" : op === "summarize" ? "align-justify" : "plus");
            item.onClick(() => new TextOperationModal(this.app, this, op, sel).open());
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

    ["polish", "summarize", "complete", "expand", "translate", "continue"].forEach((op) => {
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
      id: "xiaoyuanAI-wiki-query", name: "\u{1F50D} Wiki 查询",
      callback: () => new WikiCommandModal(this.app, this, "query").open(),
    });
    this.addCommand({
      id: "xiaoyuanAI-wiki-capture", name: "\u{1F4E5} Wiki 捕捉",
      callback: () => new WikiCommandModal(this.app, this, "capture").open(),
    });
    this.addCommand({
      id: "xiaoyuanAI-wiki-ingest", name: "\u{1F4E5} Wiki 摄入",
      callback: () => new WikiCommandModal(this.app, this, "ingest").open(),
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
  }

  private async autoStartServer(): Promise<void> {
    try {
      const vaultDir = getVaultBasePath(this.app.vault);
      await ensureOpenCodeServer(
        this.settings.opencode.cliPath,
        this.settings.opencode.hostname,
        this.settings.opencode.port,
        vaultDir,
        true,
      );
    } catch (err) {
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
    return (this.app.workspace as any).activeEditor?.editor || null;
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (!this.settings.opencode.agent) this.settings.opencode.agent = "build";
  }
  async saveSettings() { await this.saveData(this.settings); }

  async onunload() {
    stopOpenCodeServer();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT);
  }
}
