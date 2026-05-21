import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import type XiaoyuanAIPlugin from "./main";
import type { XiaoyuanAISettings } from "./types";
import { ensureServer, getVaultBasePath } from "./server";

export class XiaoyuanAISettingTab extends PluginSettingTab {
  plugin: XiaoyuanAIPlugin;
  constructor(app: App, plugin: XiaoyuanAIPlugin) { super(app, plugin); this.plugin = plugin; }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "小元 设置" });

    const s = this.plugin.settings;

    new Setting(containerEl)
      .setName("执行模式")
      .setDesc("选择如何调用 AI 能力")
      .addDropdown((dd) => {
        dd.addOption("hybrid", "\u{1F310} 混合模式（操作\u2192CLI, 聊天\u2192API）");
        dd.addOption("cli", "\u{1F4BB} CLI 模式（全部通过 opencode serve）");
        dd.addOption("api", "\u2601\uFE0F API 模式（直接调用 API）");
        dd.setValue(s.execMode);
        dd.onChange(async (val) => {
          s.execMode = val as XiaoyuanAISettings["execMode"];
          await this.plugin.saveSettings();
          this.display();
        });
      });

    if (s.execMode === "cli" || s.execMode === "hybrid") {
      containerEl.createEl("h3", { text: "CLI 配置" });
      new Setting(containerEl)
        .setName("opencode 路径")
        .setDesc("opencode 可执行文件路径。全局安装填 opencode 即可。")
        .addText((text) =>
          text.setPlaceholder("opencode").setValue(s.opencodePath)
            .onChange(async (val) => { s.opencodePath = val; await this.plugin.saveSettings(); }),
        );

      new Setting(containerEl)
        .setName("服务器端口")
        .setDesc("opencode serve 的监听端口")
        .addText((text) =>
          text.setPlaceholder("16226").setValue(String(s.serverPort))
            .onChange(async (val) => { const n = parseInt(val); if (n > 0 && n < 65536) { s.serverPort = n; await this.plugin.saveSettings(); } }),
        );

      new Setting(containerEl)
        .setName("默认构建模式")
        .setDesc("plan = 规划优先，build = 直接执行")
        .addDropdown((dd) => {
          dd.addOption("plan", "plan").addOption("build", "build");
          dd.setValue(s.buildMode);
          dd.onChange(async (val) => { s.buildMode = val as "plan" | "build"; await this.plugin.saveSettings(); });
        });

      new Setting(containerEl)
        .setName("默认级别")
        .setDesc("opencode 的执行级别（low / medium / high / max）")
        .addDropdown((dd) => {
          dd.addOption("low", "low").addOption("medium", "medium").addOption("high", "high").addOption("max", "max");
          dd.setValue(s.level);
          dd.onChange(async (val) => { s.level = val as "low" | "medium" | "high" | "max"; await this.plugin.saveSettings(); });
        });

      new Setting(containerEl)
        .setName("测试 CLI 连接")
        .setDesc("启动/测试 opencode serve 是否正常")
        .addButton((btn) => {
          btn.setButtonText("测试连接");
          btn.onClick(async () => {
            btn.disabled = true;
            btn.setButtonText("检测中...");
            try {
              await ensureServer(s, getVaultBasePath(this.app.vault));
              new Notice("✅ opencode serve 连接正常");
            } catch (e: any) {
              new Notice("❌ 无法启动 opencode serve：" + e.message);
            } finally {
              btn.disabled = false;
              btn.setButtonText("测试连接");
            }
          });
        });
    }

    if (s.execMode === "api" || s.execMode === "hybrid") {
      containerEl.createEl("h3", { text: "API 配置" });
      new Setting(containerEl)
        .setName("API 端点")
        .setDesc("OpenAI 兼容的 API 地址")
        .addText((text) =>
          text.setPlaceholder("https://api.openai.com/v1/chat/completions").setValue(s.apiEndpoint)
            .onChange(async (val) => { s.apiEndpoint = val; await this.plugin.saveSettings(); }),
        );

      new Setting(containerEl)
        .setName("API Key")
        .setDesc("你的 API 密钥")
        .addText((text) => {
          text.setPlaceholder("sk-...").setValue(s.apiKey);
          text.inputEl.type = "password";
          text.onChange(async (val) => { s.apiKey = val; await this.plugin.saveSettings(); });
        });

      new Setting(containerEl)
        .setName("模型")
        .addText((text) =>
          text.setPlaceholder("gpt-4o").setValue(s.model)
            .onChange(async (val) => { s.model = val; await this.plugin.saveSettings(); }),
        );

      new Setting(containerEl)
        .setName("系统提示词")
        .addTextArea((text) => {
          text.setValue(s.systemPrompt);
          text.inputEl.rows = 4;
          text.onChange(async (val) => { s.systemPrompt = val; await this.plugin.saveSettings(); });
        });

      new Setting(containerEl)
        .setName("最大 Token 数")
        .addText((text) =>
          text.setPlaceholder("4096").setValue(String(s.maxTokens))
            .onChange(async (val) => { const n = parseInt(val); if (n > 0) { s.maxTokens = n; await this.plugin.saveSettings(); } }),
        );

      new Setting(containerEl)
        .setName("温度")
        .addSlider((slider) =>
          slider.setLimits(0, 2, 0.1).setValue(s.temperature)
            .onChange(async (val) => { s.temperature = val; await this.plugin.saveSettings(); }),
        );
    }

    containerEl.createEl("hr");
    containerEl.createEl("h3", { text: "存储配置" });
    new Setting(containerEl)
      .setName("聊天历史存储路径")
      .setDesc("聊天历史 Markdown 文件的存储目录，默认 .chatHistory（隐藏文件夹）")
      .addText((text) =>
        text.setPlaceholder(".chatHistory").setValue(s.chatHistoryPath)
          .onChange(async (val) => { if (val.trim()) { s.chatHistoryPath = val.trim(); await this.plugin.saveSettings(); } }),
      );

    containerEl.createEl("hr");
    containerEl.createEl("h3", { text: "帮助" });
    const help = containerEl.createDiv({ cls: "xiaoyuan-help-text" });
    help.innerHTML = `
      <p><strong>执行模式说明：</strong></p>
      <p>\u2022 <strong>混合模式（默认）</strong>：文本操作和 Wiki 命令走 opencode serve，聊天走 API。最佳体验。</p>
      <p>\u2022 <strong>CLI 模式</strong>：所有操作通过 opencode serve 执行。</p>
      <p>\u2022 <strong>API 模式</strong>：所有操作直接调用 API。</p>
      <p><strong>文本操作：</strong>在编辑器中选中文本 \u2192 右键 \u2192 "使用 AI" 子菜单</p>
      <p><strong>聊天：</strong>点击左侧 Ribbon 栏的 \u{1F4AC} 图标打开聊天面板</p>
      <p><strong>Wiki 命令：</strong>通过命令面板搜索 "小元" 找到维基命令</p>
    `;
  }
}
