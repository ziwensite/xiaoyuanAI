import { App, PluginSettingTab, Setting, Notice, setIcon } from "obsidian";
import type XiaoyuanAIPlugin from "./main";
import { XiaoyuanAIChatView } from "./chat-view";
import { VIEW_TYPE_XIAOYUAN_AI_CHAT, type XiaoyuanAISettings, type ApiProviderConfig, type ReasoningEffort, type ReasoningEffortAPI, type PermissionMode } from "./types";
import { showPopup, addPopupItem } from "./popup";

type TabId = "cli" | "api" | "general" | "mcp";

export class XiaoyuanAISettingTab extends PluginSettingTab {
  plugin: XiaoyuanAIPlugin;
  private activeTab: TabId = "general";

  constructor(app: App, plugin: XiaoyuanAIPlugin) { super(app, plugin); this.plugin = plugin; }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    this.buildModeSelector(containerEl);
    this.buildStatusCard(containerEl);
    this.buildTabBar(containerEl);
    this.buildTabContents(containerEl);
  }

  // ─── helpers ─────────────────────────────────────────────────────

  private s(): XiaoyuanAISettings { return this.plugin.settings; }

  private decorateSetting(setting: Setting, iconName: string): Setting {
    const nameEl = setting.nameEl as HTMLElement | undefined;
    if (!nameEl) return setting;
    const settingEl = setting.settingEl as HTMLElement | undefined;
    settingEl?.addClass("xy-setting-with-icon");
    nameEl.addClass("xy-setting-name-with-icon");
    const icon = document.createElement("span");
    icon.addClass("xy-setting-icon");
    setIcon(icon, iconName);
    nameEl.prepend(icon);
    return setting;
  }

  private addStatusRow(container: HTMLElement, iconName: string, label: string, value: string): void {
    const row = container.createDiv({ cls: "xy-settings-status-row" });
    const icon = row.createSpan({ cls: "xy-settings-status-icon" });
    setIcon(icon, iconName);
    row.createSpan({ cls: "xy-settings-status-label", text: label });
    row.createSpan({ cls: "xy-settings-status-value", text: value });
  }

  // ─── ① Mode Selector ─────────────────────────────────────────────

  private buildModeSelector(container: HTMLElement) {
    const s = this.s();
    this.decorateSetting(new Setting(container)
      .setName("智能助理模式")
      .setDesc(s.execMode === "cli"
        ? "所有操作通过 opencode run 执行，适合本地开发项目"
        : "所有操作直接调用 OpenAI 兼容 API，适合纯对话场景")
      .addDropdown((dd) => {
        dd.addOption("cli", "CLI 模式");
        dd.addOption("api", "API 模式");
        dd.setValue(s.execMode);
        dd.onChange(async (val) => {
          s.execMode = val as "api" | "cli";
          await this.plugin.saveSettings();
          const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT).first();
          if (leaf?.view instanceof XiaoyuanAIChatView) {
            leaf.view.rebuildToolbar();
          }
          this.display();
        });
      }), "bot");
  }

  // ─── ② Status Card ───────────────────────────────────────────────

  private async refreshStatusCard() {
    const card = this.containerEl.querySelector(".xy-settings-status") as HTMLDivElement | null;
    if (!card) return;
    const s = this.s();

    try {
      const { checkOpenCodeStatus, ensureOpenCodeServer } = await import("./ai");
      const vaultDir = (await import("./server")).getVaultBasePath(this.app.vault);

      if (s.execMode === "cli") {
        let ok = false;
        const status = await checkOpenCodeStatus(s.opencode.cliPath, vaultDir, s.opencode.port, s.opencode.hostname);
        if (status.ok) {
          ok = true;
        } else if (s.opencode.autoStart) {
          try {
            await ensureOpenCodeServer(s.opencode.cliPath, s.opencode.hostname, s.opencode.port, vaultDir, true);
            ok = true;
} catch (e) { console.warn("opencode 自动启动失败:", e); }
        }
        this.updateRow(card, 0, ok ? "已连接" : "未连接");
      } else {
        const active = this.activeProvider();
        if (active && active.baseUrl && active.apiKey) {
          this.updateRow(card, 0, "已连接");
        } else {
          this.updateRow(card, 0, "未配置");
        }
      }

      this.updateRow(card, 1, s.execMode === "cli" ? (s.opencode.model || "未选择") : (this.activeProvider()?.model || "未选择"));
      this.updateRow(card, 2, s.proxyEnabled ? s.proxyUrl : "已关闭");
    } catch {
      this.updateRow(card, 0, "检测失败");
    }
  }

  private updateRow(card: HTMLElement, index: number, value: string) {
    const rows = card.querySelectorAll(".xy-settings-status-row");
    if (rows[index]) {
      const valEl = rows[index].querySelector(".xy-settings-status-value") as HTMLSpanElement;
      if (valEl) valEl.textContent = value;
    }
  }

  private activeProvider(): ApiProviderConfig | undefined {
    const s = this.s();
    if (s.activeApiProviderId) return s.apiProviders.find(p => p.id === s.activeApiProviderId);
    return s.apiProviders[0];
  }

  private buildStatusCard(container: HTMLElement) {
    const s = this.s();
    const card = container.createDiv({ cls: "xy-settings-status" });

    this.addStatusRow(card, "activity", "连接状态", "检测中...");
    this.addStatusRow(card, "box", "当前模型", s.execMode === "cli" ? (s.opencode.model || "未选择") : (this.activeProvider()?.model || "未选择"));
    this.addStatusRow(card, "waypoints", "代理", s.proxyEnabled ? s.proxyUrl : "已关闭");

    const actions = card.createDiv({ cls: "xy-settings-status-actions" });
    const refreshBtn = actions.createEl("button", { cls: "xy-status-btn", text: "刷新" });
    refreshBtn.addEventListener("click", async () => {
      await this.refreshStatusCard();
      if (s.execMode === "cli") {
        const { fetchOpenCodeModelsFromCLI, fetchOpenCodeAgents } = await import("./ai");
        const { getVaultBasePath } = await import("./server");
        const vaultDir = getVaultBasePath(this.app.vault);
        try {
          const result = await fetchOpenCodeModelsFromCLI(s.opencode.cliPath, vaultDir, s.opencode.port);
          s.opencodeModels = result.models.map((m) => ({ label: m.displayName, value: m.id }));
          s.opencodeModelCaps = result.caps;
          if (result.defaultModel && !s.opencode.model) {
            s.opencode.model = result.defaultModel;
          }
          s.opencodeAgents = await fetchOpenCodeAgents(s.opencode.cliPath, vaultDir, s.opencode.port);
          await this.plugin.saveSettings();
        } catch {}
      }
      this.display();
    });

    void this.refreshStatusCard();
  }

  // ─── ③ Tab Bar ───────────────────────────────────────────────────

  private buildTabBar(container: HTMLElement) {
    const tabs: { id: TabId; icon: string; label: string }[] = [
      { id: "general", icon: "settings", label: "通用" },
      { id: "cli", icon: "terminal-square", label: "CLI 设置" },
      { id: "api", icon: "key-round", label: "API 设置" },
      { id: "mcp", icon: "blocks", label: "MCP 工具" },
    ];
    const bar = container.createDiv({ cls: "xy-settings-tabs" });
    for (const t of tabs) {
      const btn = bar.createEl("button", {
        cls: `xy-settings-tab ${this.activeTab === t.id ? "is-active" : ""}`,
        attr: { type: "button" },
      });
      const icon = btn.createSpan({ cls: "xy-settings-tab-icon" });
      setIcon(icon, t.icon);
      btn.createSpan({ text: t.label });
      btn.onclick = () => {
        this.activeTab = t.id;
        this.display();
      };
    }
  }

  // ─── ④ Tab Contents ──────────────────────────────────────────────

  private buildTabContents(container: HTMLElement) {
    switch (this.activeTab) {
      case "cli": this.buildCLITab(container); break;
      case "api": this.buildAPITab(container); break;
      case "general": this.buildGeneralTab(container); break;
      case "mcp": this.buildMCPTab(container); break;
    }
  }

  // ─── CLI 设置 ─────────────────────────────────────────────────────

  private buildCLITab(container: HTMLElement) {
    const s = this.s();

    const pathSetting = this.decorateSetting(new Setting(container)
      .setName("OpenCode 路径")
      .setDesc("可执行文件路径。全局安装填 opencode，非全局写完整绝对路径。")
      .addText((text) =>
        text.setPlaceholder("opencode").setValue(s.opencode.cliPath === "opencode" ? "" : s.opencode.cliPath)
          .onChange(async (val) => { s.opencode.cliPath = val; await this.plugin.saveSettings(); }),
      ), "terminal-square");
    (async () => {
      try {
        const { resolveOpenCodePath } = await import("./ai");
        const detected = await resolveOpenCodePath(s.opencode.cliPath);
        if (detected && detected !== s.opencode.cliPath) pathSetting.setDesc(`已检测到: ${detected}`);
      } catch {}
    })();

    this.decorateSetting(new Setting(container)
      .setName("自动启动 OpenCode Server")
      .setDesc("打开 Obsidian 或检测到服务未运行时自动启动 opencode serve")
      .addToggle((t) => {
        t.setValue(s.opencode.autoStart);
        t.onChange(async (val) => {
          s.opencode.autoStart = val;
          await this.plugin.saveSettings();
          if (val && s.execMode === "cli") {
            const { ensureOpenCodeServer } = await import("./ai");
            const { getVaultBasePath } = await import("./server");
            ensureOpenCodeServer(s.opencode.cliPath, s.opencode.hostname, s.opencode.port, getVaultBasePath(this.app.vault), true).catch(() => {});
          }
        });
      }), "play");

    this.decorateSetting(new Setting(container)
      .setName("Host")
      .setDesc("opencode 服务器主机地址")
      .addText((text) =>
        text.setPlaceholder("127.0.0.1").setValue(s.opencode.hostname === "127.0.0.1" ? "" : s.opencode.hostname)
          .onChange(async (val) => { s.opencode.hostname = val; await this.plugin.saveSettings(); }),
      ), "globe");

    this.decorateSetting(new Setting(container)
      .setName("Port")
      .setDesc("opencode 服务器端口")
      .addText((text) =>
        text.setPlaceholder("16226").setValue(s.opencode.port === 16226 ? "" : String(s.opencode.port))
          .onChange(async (val) => { const n = parseInt(val); s.opencode.port = n > 0 ? n : 16226; await this.plugin.saveSettings(); }),
      ), "plug");

    const modelSetting = this.decorateSetting(new Setting(container)
      .setName("模型")
      .setDesc("点击选择模型，或点 ↻ 从 opencode 同步")
      .addText((text) => {
        text.setPlaceholder("点击选择或输入 providerID/modelID").setValue(s.opencode.model);
        text.inputEl.addClass("xy-model-picker-trigger");
        text.inputEl.readOnly = false;
        text.onChange(async (val) => {
          s.opencode.model = val;
          await this.plugin.saveSettings();
        });
        text.inputEl.addEventListener("click", (e) => {
          e.preventDefault();
          this.showModelPicker(text.inputEl, s.opencodeModels || [], (val) => {
            s.opencode.model = val;
            this.plugin.saveSettings().then(() => this.display());
          });
        });
      })
      .addButton((btn) => {
        btn.setButtonText("↻");
        btn.setTooltip("从 opencode 同步模型列表");
        btn.onClick(async () => {
          const { fetchOpenCodeModelsFromCLI } = await import("./ai");
          const { getVaultBasePath } = await import("./server");
          try {
            const result = await fetchOpenCodeModelsFromCLI(s.opencode.cliPath, getVaultBasePath(this.app.vault), s.opencode.port);
            s.opencodeModels = result.models.map((m) => ({ label: m.displayName, value: m.id }));
            s.opencodeModelCaps = result.caps;
            if (result.defaultModel && !s.opencode.model) {
              s.opencode.model = result.defaultModel;
            }
            await this.plugin.saveSettings();
            new Notice(result.models.length === 0 ? "未找到模型" : `已同步 ${result.models.length} 个模型`);
            this.display();
            const { fetchOpenCodeAgents } = await import("./ai");
            s.opencodeAgents = await fetchOpenCodeAgents(s.opencode.cliPath, getVaultBasePath(this.app.vault), s.opencode.port).catch(() => s.opencodeAgents);
            await this.plugin.saveSettings();
          } catch (err: unknown) { new Notice(`同步失败：${err instanceof Error ? err.message : String(err)}`); }
        });
      }), "box");

    {
      const caps = s.opencodeModelCaps?.[s.opencode.model];
      if (caps) {
        const inputFlags: string[] = [];
        for (const [k, v] of Object.entries({ 文本: caps.text, 图像: caps.image, PDF: caps.pdf, 音频: caps.audio, 视频: caps.video })) {
          inputFlags.push(v ? `${k}✓` : `${k}×`);
        }
        modelSetting.descEl.createDiv({ text: `输入: ${inputFlags.join(" ")}` });
        const featFlags: string[] = [];
        for (const [k, v] of Object.entries({ 推理: caps.reasoning, 工具: caps.toolcall, 附件: caps.attachment, 温度: caps.temperature })) {
          featFlags.push(v ? `${k}✓` : `${k}×`);
        }
        modelSetting.descEl.createDiv({ text: `功能: ${featFlags.join(" ")}` });
      }
    }

    {
      const agentItems = s.opencodeAgents || [];
      const fallbackItems: { name: string; description?: string }[] = !agentItems.length ? [{ name: "build" }, { name: "plan" }] : [];
      const allItems = agentItems.length ? agentItems : fallbackItems;
      const currentAgent = s.opencode.agent;
      const inList = allItems.some((a) => a.name === currentAgent);
      this.decorateSetting(new Setting(container)
        .setName("Agent")
        .setDesc(currentAgent
          ? `当前: ${currentAgent}${allItems.find((a) => a.name === currentAgent)?.description ? ` (${allItems.find((a) => a.name === currentAgent)!.description})` : ""}`
          : "选择 agent")
        .addDropdown((dd) => {
          for (const a of allItems) dd.addOption(a.name, a.name);
          dd.setValue(inList ? currentAgent : allItems[0]?.name || "build");
          dd.onChange(async (val) => {
            s.opencode.agent = val;
            await this.plugin.saveSettings();
            this.display();
          });
        })
        .addButton((btn) => {
          btn.setButtonText("↻");
          btn.setTooltip("从 opencode 同步 agent 列表");
          btn.onClick(async () => {
            try {
              const { fetchOpenCodeAgents } = await import("./ai");
              const { getVaultBasePath } = await import("./server");
              const vaultDir = getVaultBasePath(this.app.vault);
              const agents = await fetchOpenCodeAgents(s.opencode.cliPath, vaultDir, s.opencode.port);
              s.opencodeAgents = agents;
              await this.plugin.saveSettings();
              new Notice(`已同步 ${agents.length} 个 agent`);
              this.display();
            } catch (err: any) { new Notice(`同步失败：${err.message}`); }
          });
        }), "bot");
    }

    this.decorateSetting(new Setting(container)
      .setName("思考强度")
      .setDesc("控制模型的推理深度")
      .addDropdown((dd) => {
        dd.addOption("none", "none");
        dd.addOption("minimal", "minimal");
        dd.addOption("low", "low");
        dd.addOption("medium", "medium");
        dd.addOption("high", "high");
        dd.addOption("xhigh", "xhigh");
        dd.setValue(s.defaultReasoning);
        dd.onChange(async (val) => { s.defaultReasoning = val as ReasoningEffort; await this.plugin.saveSettings(); });
      }), "brain");

    this.decorateSetting(new Setting(container)
      .setName("文件权限")
      .setDesc('AI 对工作区文件的访问权限（仅"完全放开"时传递 --dangerously-skip-permissions）')
      .addDropdown((dd) => {
        dd.addOption("read-only", "只读");
        dd.addOption("workspace-write", "工作区可写");
        dd.addOption("danger-full-access", "完全放开");
        dd.setValue(s.defaultPermission);
        dd.onChange(async (val) => { s.defaultPermission = val as PermissionMode; await this.plugin.saveSettings(); });
      }), "shield-check");

  }

  // ─── API 设置 ─────────────────────────────────────────────────────

  private buildAPITab(container: HTMLElement) {
    const s = this.s();

    const providers = s.apiProviders;
    const activeId = s.activeApiProviderId || providers[0]?.id || "";

    for (const provider of providers) {
      const isActive = provider.id === activeId;
      const card = container.createDiv({ cls: `xy-api-provider-row${isActive ? " is-active" : ""}` });

      const head = card.createDiv({ cls: "xy-api-provider-head" });
      const title = head.createDiv({ cls: "xy-api-provider-title" });
      const nameSpan = title.createSpan({ text: provider.name || "未命名" });
      const modelSmall = title.createEl("small", { text: ` · ${provider.model || "未选择模型"}` });
      const updateHeader = () => {
        nameSpan.textContent = provider.name || "未命名";
        modelSmall.textContent = ` · ${provider.model || "未选择模型"}`;
      };

      const headActions = head.createDiv({ cls: "xy-api-provider-actions" });

      if (!isActive) {
        const activateBtn = headActions.createEl("button", { cls: "xy-status-btn", text: "启用" });
        activateBtn.addEventListener("click", async () => {
          s.activeApiProviderId = provider.id;
          await this.plugin.saveSettings();
          this.display();
          const ok = await this.testApiConnection(provider);
          new Notice(ok ? `✅ 已切换到: ${provider.name}` : `❌ 连接失败: ${provider.name}`);
        });
      }

      const testBtn = headActions.createEl("button", { cls: "xy-status-btn", text: "连接测试" });
      testBtn.addEventListener("click", async () => {
        const ok = await this.testApiConnection(provider);
        new Notice(ok ? `✅ ${provider.name} 连接成功` : `❌ ${provider.name} 连接失败`);
      });

      const deleteBtn = headActions.createEl("button", { cls: "xy-status-btn", text: "删除" });
      deleteBtn.addEventListener("click", async () => {
        if (providers.length <= 1) { new Notice("至少保留一个 API 提供者"); return; }
        s.apiProviders = providers.filter(p => p.id !== provider.id);
        if (s.activeApiProviderId === provider.id) {
          s.activeApiProviderId = s.apiProviders[0]?.id || "";
        }
        await this.plugin.saveSettings();
        this.display();
      });

      let collapsed = true;
      const content = card.createDiv({ cls: "xy-api-provider-content" });
      content.style.display = "none";
      head.style.cursor = "pointer";
      head.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        collapsed = !collapsed;
        content.style.display = collapsed ? "none" : "";
      });

      this.addProviderText(content, "名称", provider.name, "例如 OpenAI API", async (val) => {
        provider.name = val;
        await this.plugin.saveSettings();
        updateHeader();
      });

      this.addProviderText(content, "Base URL", provider.baseUrl, "https://api.openai.com/v1", async (val) => {
        provider.baseUrl = val;
        await this.plugin.saveSettings();
      });

      this.addProviderText(content, "模型", provider.model, "gpt-4o", async (val) => {
        provider.model = val;
        await this.plugin.saveSettings();
        updateHeader();
      });

      this.addProviderText(content, "API Key", provider.apiKey, "sk-...", async (val) => {
        provider.apiKey = val;
        await this.plugin.saveSettings();
      }, true);
    }

    const addBtn = container.createDiv({ cls: "xy-settings-status-actions" });
    const newBtn = addBtn.createEl("button", { cls: "xy-status-btn", text: "+ 新增 API 提供者" });
    newBtn.addEventListener("click", async () => {
      const newId = `provider_${Date.now()}`;
      s.apiProviders.push({ id: newId, name: "新 API", baseUrl: "", model: "", apiKey: "" });
      await this.plugin.saveSettings();
      this.display();
    });

    container.createEl("hr");
    container.createEl("h3", { text: "API 参数" });

    this.decorateSetting(new Setting(container)
      .setName("思考强度")
      .setDesc("控制模型的推理深度（none / low / medium / high）")
      .addDropdown((dd) => {
        dd.addOption("none", "none");
        dd.addOption("low", "low");
        dd.addOption("medium", "medium");
        dd.addOption("high", "high");
        dd.setValue(s.apiReasoningEffort);
        dd.onChange(async (val) => { s.apiReasoningEffort = val as ReasoningEffortAPI; await this.plugin.saveSettings(); });
      }), "brain");

    this.decorateSetting(new Setting(container)
      .setName("温度")
      .setDesc("模型输出的随机性（0=确定，2=随机）")
      .addSlider((slider) =>
        slider.setLimits(0, 2, 0.1).setValue(s.temperature)
          .onChange(async (val) => { s.temperature = val; await this.plugin.saveSettings(); }),
      ), "thermometer");

    this.decorateSetting(new Setting(container)
      .setName("最大 Token 数")
      .addText((text) =>
        text.setPlaceholder("4096").setValue(s.maxTokens === 4096 ? "" : String(s.maxTokens))
          .onChange(async (val) => { const n = parseInt(val); s.maxTokens = n > 0 ? n : 4096; await this.plugin.saveSettings(); }),
      ), "subtitles");
  }

  private addProviderText(
    container: HTMLElement, label: string, value: string,
    placeholder: string, onChange: (val: string) => Promise<void>,
    password = false,
  ) {
    const field = container.createDiv({ cls: "xy-api-provider-field" });
    field.createSpan({ cls: "xy-api-provider-label", text: label });
    const input = field.createEl("input", { cls: "xy-api-provider-input", attr: { placeholder } });
    input.value = value;
    if (password) input.type = "password";
    input.addEventListener("change", () => { void onChange(input.value); });
  }

  // ─── MCP 设置 ─────────────────────────────────────────────────────

  private buildMCPTab(container: HTMLElement) {
    const s = this.s();
    const servers = s.mcpServers || [];

    container.createEl("p", { cls: "xy-settings-desc", text: "配置 MCP 服务器，为 AI 提供额外的工具和上下文能力。" });

    for (let i = 0; i < servers.length; i++) {
      const server = servers[i];
      const card = container.createDiv({ cls: "xy-api-provider-row" });

      const head = card.createDiv({ cls: "xy-api-provider-head" });
      const title = head.createDiv({ cls: "xy-api-provider-title" });
      const nameSpan = title.createSpan({ text: server.name || "未命名" });
      const typeSmall = title.createEl("small", { text: ` · ${server.type === "local" ? "本地进程" : "远程服务"}` });
      const enabledBadge = title.createEl("small", { text: server.enabled ? " · 已启用" : " · 已禁用", cls: server.enabled ? "" : "xy-mcp-disabled" });

      const updateHeader = () => {
        nameSpan.textContent = server.name || "未命名";
        typeSmall.textContent = ` · ${server.type === "local" ? "本地进程" : "远程服务"}`;
        enabledBadge.textContent = server.enabled ? " · 已启用" : " · 已禁用";
      };

      const headActions = head.createDiv({ cls: "xy-api-provider-actions" });
      const deleteBtn = headActions.createEl("button", { cls: "xy-status-btn", text: "删除" });
      deleteBtn.addEventListener("click", async () => {
        s.mcpServers.splice(i, 1);
        await this.plugin.saveSettings();
        this.display();
      });

      let collapsed = true;
      const content = card.createDiv({ cls: "xy-api-provider-content" });
      content.style.display = "none";
      head.style.cursor = "pointer";
      head.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        collapsed = !collapsed;
        content.style.display = collapsed ? "none" : "";
      });

      this.addMCPFieldText(content, "名称", server.name, "my-server", async (val) => {
        server.name = val;
        await this.plugin.saveSettings();
        updateHeader();
      });

      const typeField = content.createDiv({ cls: "xy-api-provider-field" });
      typeField.createSpan({ cls: "xy-api-provider-label", text: "类型" });
      const typeSelect = typeField.createEl("select", { cls: "dropdown" });
      typeSelect.createEl("option", { value: "local", text: "本地进程" });
      typeSelect.createEl("option", { value: "remote", text: "远程服务" });
      typeSelect.value = server.type;
      typeSelect.addEventListener("change", async () => {
        server.type = typeSelect.value as "local" | "remote";
        await this.plugin.saveSettings();
        this.display();
      });

      const commandField = content.createDiv({ cls: "xy-api-provider-field xy-mcp-local" });
      commandField.style.display = server.type === "local" ? "" : "none";
      commandField.createSpan({ cls: "xy-api-provider-label", text: "命令" });
      const commandInput = commandField.createEl("input", { cls: "xy-api-provider-input", attr: { placeholder: "npx" } });
      commandInput.value = server.command || "";
      commandInput.addEventListener("change", async () => {
        server.command = commandInput.value.trim();
        await this.plugin.saveSettings();
      });

      const argsField = content.createDiv({ cls: "xy-api-provider-field xy-mcp-local" });
      argsField.style.display = server.type === "local" ? "" : "none";
      argsField.createSpan({ cls: "xy-api-provider-label", text: "参数" });
      const argsInput = argsField.createEl("input", { cls: "xy-api-provider-input", attr: { placeholder: "-y @modelcontextprotocol/server-filesystem ./" } });
      argsInput.value = server.args || "";
      argsInput.addEventListener("change", async () => {
        server.args = argsInput.value.trim();
        await this.plugin.saveSettings();
      });

      const urlField = content.createDiv({ cls: "xy-api-provider-field xy-mcp-remote" });
      urlField.style.display = server.type === "remote" ? "" : "none";
      urlField.createSpan({ cls: "xy-api-provider-label", text: "URL" });
      const urlInput = urlField.createEl("input", { cls: "xy-api-provider-input", attr: { placeholder: "http://localhost:3000/mcp" } });
      urlInput.value = server.url || "";
      urlInput.addEventListener("change", async () => {
        server.url = urlInput.value.trim();
        await this.plugin.saveSettings();
      });

      const headersField = content.createDiv({ cls: "xy-api-provider-field xy-mcp-remote" });
      headersField.style.display = server.type === "remote" ? "" : "none";
      headersField.createSpan({ cls: "xy-api-provider-label", text: "Headers" });
      const headersInput = headersField.createEl("input", { cls: "xy-api-provider-input", attr: { placeholder: '{"Authorization":"Bearer xxx"}' } });
      headersInput.value = server.headers || "";
      headersInput.addEventListener("change", async () => {
        server.headers = headersInput.value.trim();
        await this.plugin.saveSettings();
      });

      const enabledField = content.createDiv({ cls: "xy-api-provider-field" });
      enabledField.createSpan({ cls: "xy-api-provider-label", text: "启用" });
      const enabledToggle = enabledField.createEl("input", { type: "checkbox" });
      enabledToggle.checked = server.enabled;
      enabledToggle.addEventListener("change", async () => {
        server.enabled = enabledToggle.checked;
        await this.plugin.saveSettings();
        const { resetMCPSyncDone } = await import("./ai");
        resetMCPSyncDone();
        this.display();
      });
    }

    const addBtn = container.createDiv({ cls: "xy-settings-status-actions" });
    const newBtn = addBtn.createEl("button", { cls: "xy-status-btn", text: "+ 新增 MCP 服务器" });
    newBtn.addEventListener("click", async () => {
      s.mcpServers.push({ name: "新服务器", type: "local", command: "", args: "", enabled: false });
      await this.plugin.saveSettings();
      this.display();
    });
  }

  private addMCPFieldText(
    container: HTMLElement, label: string, value: string,
    placeholder: string, onChange: (val: string) => Promise<void>,
  ) {
    const field = container.createDiv({ cls: "xy-api-provider-field" });
    field.createSpan({ cls: "xy-api-provider-label", text: label });
    const input = field.createEl("input", { cls: "xy-api-provider-input", attr: { placeholder } });
    input.value = value;
    input.addEventListener("change", () => { void onChange(input.value); });
  }

  private async testApiConnection(provider: ApiProviderConfig): Promise<boolean> {
    if (!provider.baseUrl || !provider.apiKey) return false;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const modelsUrl = provider.baseUrl.replace(/\/+$/, "") + "/models";
      const resp = await fetch(modelsUrl, {
        headers: { Authorization: `Bearer ${provider.apiKey}` },
        signal: controller.signal,
      });
      clearTimeout(timer);
      return resp.ok;
    } catch {
      return false;
    }
  }

  // ─── 通用设置 ─────────────────────────────────────────────────────

  private buildGeneralTab(container: HTMLElement) {
    const s = this.s();

    this.decorateSetting(new Setting(container)
      .setName("启用本地代理")
      .setDesc("只影响插件通过 opencode 启动的子进程")
      .addToggle((t) => {
        t.setValue(s.proxyEnabled);
        t.onChange(async (val) => { s.proxyEnabled = val; await this.plugin.saveSettings(); });
      }), "waypoints");

    this.decorateSetting(new Setting(container)
      .setName("代理地址")
      .setDesc("HTTP 代理地址")
      .addText((text) =>
        text.setPlaceholder("http://127.0.0.1:7890").setValue(s.proxyUrl)
          .onChange(async (val) => { s.proxyUrl = val.trim(); await this.plugin.saveSettings(); }),
      ), "route");

    this.decorateSetting(new Setting(container)
      .setName("启动时自动打开侧栏")
      .addToggle((t) => {
        t.setValue(s.autoOpen);
        t.onChange(async (val) => { s.autoOpen = val; await this.plugin.saveSettings(); });
      }), "panel-right-open");

    container.createEl("hr");
    container.createEl("h3", { text: "聊天设置" });

    this.decorateSetting(new Setting(container)
      .setName("聊天历史存储路径")
      .setDesc("聊天历史 Markdown 文件的存储目录")
      .addText((text) =>
        text.setPlaceholder("_chatHistory").setValue(s.chatHistoryPath === "_chatHistory" ? "" : s.chatHistoryPath)
          .onChange(async (val) => { s.chatHistoryPath = val.trim() || "_chatHistory"; await this.plugin.saveSettings(); }),
      ), "folder");

    this.decorateSetting(new Setting(container)
      .setName("聊天面板位置")
      .addDropdown((dd) => {
        dd.addOption("left", "左侧");
        dd.addOption("right", "右侧");
        dd.setValue(s.chatViewType);
        dd.onChange(async (val) => { s.chatViewType = val as "left" | "right"; await this.plugin.saveSettings(); });
      }), "layout-dashboard");

    this.decorateSetting(new Setting(container)
      .setName("Diff 预览")
      .setDesc("在 AI 回复中显示文件变更预览")
      .addToggle((t) => {
        t.setValue(s.showDiffPreview);
        t.onChange(async (val) => { s.showDiffPreview = val; await this.plugin.saveSettings(); });
      }), "file-diff");

    this.decorateSetting(new Setting(container)
      .setName("显示思考过程")
      .setDesc("在 AI 回复中以折叠块显示模型的思考过程")
      .addToggle((t) => {
        t.setValue(s.showThinking);
        t.onChange(async (val) => { s.showThinking = val; await this.plugin.saveSettings(); });
      }), "brain");

    this.decorateSetting(new Setting(container)
      .setName("附件大小上限")
      .setDesc("单位 MB，超出限制的文件会被跳过")
      .addText((text) =>
        text.setPlaceholder("10").setValue(s.maxAttachmentSize === 10 ? "" : String(s.maxAttachmentSize))
          .onChange(async (val) => {
            const n = parseInt(val);
            s.maxAttachmentSize = n > 0 ? n : 10;
            await this.plugin.saveSettings();
          }),
      ), "hard-drive");

    container.createEl("hr");
    container.createEl("h3", { text: "系统提示词" });

    this.decorateSetting(new Setting(container)
      .setName("显示文件上下文")
      .setDesc("在聊天工具栏显示当前笔记的上下文信息")
      .addToggle((t) => {
        t.setValue(s.showContext);
        t.onChange(async (val) => { s.showContext = val; await this.plugin.saveSettings(); this.display(); });
      }), "file-text");

    this.decorateSetting(new Setting(container)
      .setName("系统提示词")
      .addTextArea((text) => {
        text.setValue(s.systemPrompt);
        text.inputEl.rows = 4;
        text.onChange(async (val) => { s.systemPrompt = val; await this.plugin.saveSettings(); });
      }), "message-square");

  }

  private showModelPicker(
    trigger: HTMLElement,
    models: { label: string; value: string }[],
    onSelect: (value: string) => void,
  ) {
    showPopup(trigger, (popup) => {
      const s = this.plugin.settings;
      const currentModel = s.opencode.model;

      const syncItem = popup.createDiv({ cls: "xy-popup-item" });
      syncItem.createSpan({ cls: "xy-popup-label" }).textContent = "⟳ 同步模型列表";
      syncItem.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        popup.remove();
        try {
          const { fetchOpenCodeModelsFromCLI, ensureOpenCodeServer } = await import("./ai");
          const vaultDir = (await import("./server")).getVaultBasePath(this.app.vault);
          await ensureOpenCodeServer(s.opencode.cliPath, s.opencode.hostname, s.opencode.port, vaultDir, true);
          const result = await fetchOpenCodeModelsFromCLI(s.opencode.cliPath, vaultDir, s.opencode.port);
          s.opencodeModels = result.models.map((m) => ({ label: m.displayName, value: m.id }));
          s.opencodeModelCaps = result.caps;
          if (!s.opencode.model || !result.models.some((m) => m.id === s.opencode.model)) {
            s.opencode.model = result.defaultModel || result.models[0]?.id || "";
          }
          await this.plugin.saveSettings();
          new Notice(`已同步 ${result.models.length} 个模型`);
        } catch (err: unknown) {
          new Notice(`同步失败: ${err instanceof Error ? err.message : String(err)}`);
        }
      });

      const groups = new Map<string, { label: string; value: string }[]>();
      for (const m of models) {
        const provider = m.value.includes("/") ? m.value.split("/")[0] : "其他";
        if (!groups.has(provider)) groups.set(provider, []);
        groups.get(provider)!.push(m);
      }

      for (const [providerName, items] of groups) {
        popup.createDiv({ cls: "xy-popup-separator" });
        const groupTitle = popup.createDiv({ cls: "xy-popup-group-title" });
        const arrow = groupTitle.createSpan({ cls: "xy-popup-arrow" });
        arrow.textContent = "▶";
        groupTitle.createSpan({ cls: "xy-popup-label" }).textContent = providerName;
        const children = popup.createDiv({ cls: "xy-popup-group-children" });
        children.classList.add("is-collapsed");
        for (const m of items) {
          addPopupItem(children, m.label, m.value === currentModel, () => {
            onSelect(m.value);
          });
        }
        groupTitle.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const open = arrow.textContent === "▼";
          arrow.textContent = open ? "▶" : "▼";
          children.classList.toggle("is-collapsed", open);
        });
      }
    }, { direction: "down", maxHeight: "50vh" });
  }
}
