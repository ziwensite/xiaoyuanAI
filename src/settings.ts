import { App, PluginSettingTab, Setting, Notice, setIcon, TFile } from "obsidian";
import type XiaoyuanAIPlugin from "./main";
import { XiaoyuanAIChatView } from "./chat-view";
import { VIEW_TYPE_XIAOYUAN_AI_CHAT, getActiveProvider, DEFAULT_PROMPT_TEMPLATES } from "./constants";
import type { XiaoyuanAISettings, ApiProviderConfig, ReasoningEffort, ReasoningEffortAPI, PermissionMode } from "./types";
import { showPopup, addPopupItem } from "./popup";
import { checkConnection } from "./connection-checker";
import { getVaultBasePath } from "./server";
import { t } from "./i18n";
import manifest from "../manifest.json";

type TabId = "cli" | "api" | "general" | "skills" | "prompts" | "about";

export class XiaoyuanAISettingTab extends PluginSettingTab {
  plugin: XiaoyuanAIPlugin;
  private activeTab: TabId = "general";

  constructor(app: App, plugin: XiaoyuanAIPlugin) { super(app, plugin); this.plugin = plugin; }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    this.buildStatusCard(containerEl);
    this.buildTabBar(containerEl);
    this.buildTabContents(containerEl);
  }

  // ─── helpers ─────────────────────────────────────────────────────

  private s(): XiaoyuanAISettings { return this.plugin.settings; }

  private decorateSetting(setting: Setting, iconName: string): Setting {
    const nameEl = setting.nameEl;
    if (!nameEl) return setting;
    const settingEl = setting.settingEl;
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

  // ─── ① Status Card ───────────────────────────────────────────────

private async refreshStatusCard() {
    const card = this.containerEl.querySelector(".xy-settings-status") as HTMLDivElement | null;
    if (!card) return;
    const s = this.s();

    const vaultDir = (await import("./server")).getVaultBasePath();

    const [cliOk, apiOk] = await Promise.all([
      checkConnection(s, vaultDir, "cli").catch(() => false),
      checkConnection(s, vaultDir, "api").catch(() => false),
    ]);
    this.updateRow(card, 0, cliOk ? t("status.connected") : t("status.disconnected"));
    this.updateRow(card, 1, apiOk ? t("status.connected") : t("status.notConfigured"));
    this.updateRow(card, 2, s.opencode.model || t("status.notSelected"));
    this.updateRow(card, 3, getActiveProvider(s)?.model || t("status.notSelected"));
    this.updateRow(card, 4, s.proxyEnabled ? s.proxyUrl : t("status.closed"));
  }

  private updateRow(card: HTMLElement, index: number, value: string) {
    const rows = card.querySelectorAll(".xy-settings-status-row");
    if (rows[index]) {
      const valEl = rows[index].querySelector(".xy-settings-status-value") as HTMLSpanElement;
      if (valEl) valEl.textContent = value;
    }
  }

  private buildStatusCard(container: HTMLElement) {
    const s = this.s();
    const card = container.createDiv({ cls: "xy-settings-status" });

    this.addStatusRow(card, "terminal-square", t("status.cli"), t("status.checking"));
    this.addStatusRow(card, "key-round", t("status.api"), t("status.checking"));
    this.addStatusRow(card, "box", t("status.cli.model"), s.opencode.model || t("status.notSelected"));
    this.addStatusRow(card, "box", t("status.api.model"), getActiveProvider(s)?.model || t("status.notSelected"));
    this.addStatusRow(card, "waypoints", t("status.proxy"), s.proxyEnabled ? s.proxyUrl : t("status.closed"));

    const actions = card.createDiv({ cls: "xy-settings-status-actions" });
    const refreshBtn = actions.createEl("button", { cls: "xy-status-btn", text: t("status.refresh") });
    refreshBtn.addEventListener("click", async () => {
      await this.refreshStatusCard();
      const { fetchOpenCodeModelsFromCLI, fetchOpenCodeAgents } = await import("./ai");
      const { getVaultBasePath } = await import("./server");
      const vaultDir = getVaultBasePath();
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
      this.display();
    });

    void this.refreshStatusCard();
  }

  // ─── ③ Tab Bar ───────────────────────────────────────────────────

  private buildTabBar(container: HTMLElement) {
    const tabs: { id: TabId; icon: string; label: string }[] = [
      { id: "general", icon: "settings", label: t("tab.general") },
      { id: "cli", icon: "terminal-square", label: t("tab.cli") },
      { id: "api", icon: "key-round", label: t("tab.api") },
      { id: "skills", icon: "wand-sparkles", label: t("tab.skills") },
      { id: "prompts", icon: "file-pen", label: t("tab.prompts") },
      { id: "about", icon: "info", label: t("tab.about") },
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
      case "skills": this.buildSkillsTab(container); break;
      case "prompts": this.buildPromptsTab(container); break;
      case "about": this.buildAboutTab(container); break;
    }
  }

  // ─── CLI 设置 ─────────────────────────────────────────────────────

  private buildCLITab(container: HTMLElement) {
    const s = this.s();

    const pathSetting = this.decorateSetting(new Setting(container)
      .setName(t("setting.cli.path"))
      .setDesc(t("setting.cli.path.desc"))
      .addText((text) =>
        text.setPlaceholder("opencode").setValue(s.opencode.cliPath === "opencode" ? "" : s.opencode.cliPath)
          .onChange(async (val) => { s.opencode.cliPath = val; await this.plugin.saveSettings(); }),
      ), "terminal-square");
    (async () => {
      try {
        const { resolveOpenCodePath } = await import("./opencode-server");
        const detected = await resolveOpenCodePath(s.opencode.cliPath);
        if (detected && detected !== s.opencode.cliPath) pathSetting.setDesc(t("setting.cli.path.detected", detected));
      } catch {}
    })();

    this.decorateSetting(new Setting(container)
      .setName(t("setting.cli.autoStart"))
      .setDesc(t("setting.cli.autoStart.desc"))
      .addToggle((t) => {
        t.setValue(s.opencode.autoStart);
        t.onChange(async (val) => {
          s.opencode.autoStart = val;
          await this.plugin.saveSettings();
          if (val && s.execMode === "cli") {
            const { ensureOpenCodeServer } = await import("./ai");
            const { getVaultBasePath } = await import("./server");
            ensureOpenCodeServer(s.opencode.cliPath, s.opencode.hostname, s.opencode.port, getVaultBasePath(), true).catch(() => {});
          }
        });
      }), "play");

    this.decorateSetting(new Setting(container)
      .setName("Host")
      .setDesc(t("setting.cli.host.desc"))
      .addText((text) =>
        text.setPlaceholder("127.0.0.1").setValue(s.opencode.hostname === "127.0.0.1" ? "" : s.opencode.hostname)
          .onChange(async (val) => { s.opencode.hostname = val; await this.plugin.saveSettings(); const { stopOpenCodeServer } = await import("./opencode-server"); stopOpenCodeServer(); }),
      ), "globe");

    this.decorateSetting(new Setting(container)
      .setName("Port")
      .setDesc(t("setting.cli.port.desc"))
      .addText((text) =>
        text.setPlaceholder("16226").setValue(s.opencode.port === 16226 ? "" : String(s.opencode.port))
          .onChange(async (val) => { const n = parseInt(val); const oldPort = s.opencode.port; s.opencode.port = n > 0 ? n : 16226; await this.plugin.saveSettings(); if (oldPort !== s.opencode.port) { const { stopOpenCodeServer } = await import("./opencode-server"); stopOpenCodeServer(); } }),
      ), "plug");

    const modelSetting = this.decorateSetting(new Setting(container)
      .setName(t("setting.cli.model"))
      .setDesc(t("setting.cli.model.desc"))
      .addText((text) => {
        text.setPlaceholder(t("setting.cli.model.placeholder")).setValue(s.opencode.model);
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
        btn.setTooltip(t("setting.cli.model.syncTooltip"));
        btn.onClick(async () => {
          const { fetchOpenCodeModelsFromCLI, fetchOpenCodeAgents } = await import("./ai");
          const { getVaultBasePath } = await import("./server");
          try {
            const result = await fetchOpenCodeModelsFromCLI(s.opencode.cliPath, getVaultBasePath(), s.opencode.port);
            s.opencodeModels = result.models.map((m) => ({ label: m.displayName, value: m.id }));
            s.opencodeModelCaps = result.caps;
            if (result.defaultModel && !s.opencode.model) {
              s.opencode.model = result.defaultModel;
            }
            await this.plugin.saveSettings();
            new Notice(result.models.length === 0 ? t("notice.noModels") : t("notice.syncModels", String(result.models.length)));
            this.display();
            s.opencodeAgents = await fetchOpenCodeAgents(s.opencode.cliPath, getVaultBasePath(), s.opencode.port).catch(() => s.opencodeAgents);
            await this.plugin.saveSettings();
          } catch (err: unknown) { new Notice(t("notice.syncFailed", err instanceof Error ? err.message : String(err))); }
        });
      }), "box");

    {
      const caps = s.opencodeModelCaps?.[s.opencode.model];
      if (caps) {
        const inputFlags: string[] = [];
        const inputLabels: [string, boolean][] = [
          [t("cap.text"), caps.text],
          [t("cap.image"), caps.image],
          ["PDF", caps.pdf],
          [t("cap.audio"), caps.audio],
          [t("cap.video"), caps.video],
        ];
        for (const [k, v] of inputLabels) {
          inputFlags.push(v ? `${k}✓` : `${k}×`);
        }
        modelSetting.descEl.createDiv({ text: t("cap.input") + ": " + inputFlags.join(" ") });
        const featFlags: string[] = [];
        const featLabels: [string, boolean][] = [
          [t("cap.reasoning"), caps.reasoning],
          [t("cap.toolcall"), caps.toolcall],
          [t("cap.attachment"), caps.attachment],
          [t("cap.temperature"), caps.temperature],
        ];
        for (const [k, v] of featLabels) {
          featFlags.push(v ? `${k}✓` : `${k}×`);
        }
        modelSetting.descEl.createDiv({ text: t("cap.features") + ": " + featFlags.join(" ") });
      }
    }

    {
      const agentItems = s.opencodeAgents || [];
      const fallbackItems: { name: string; description?: string }[] = !agentItems.length ? [{ name: "build" }, { name: "plan" }] : [];
      const allItems = agentItems.length ? agentItems : fallbackItems;
      const currentAgent = s.opencode.agent;
      const inList = allItems.some((a) => a.name === currentAgent);
      const currentDesc = allItems.find((a) => a.name === currentAgent)?.description;
      this.decorateSetting(new Setting(container)
        .setName(t("setting.cli.agent"))
        .setDesc(currentAgent
          ? t("setting.cli.agent.current") + ": " + currentAgent + (currentDesc ? ` (${currentDesc})` : "")
          : t("setting.cli.agent.desc"))
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
          btn.setTooltip(t("setting.cli.agent.syncTooltip"));
          btn.onClick(async () => {
            try {
              const { fetchOpenCodeAgents } = await import("./ai");
              const { getVaultBasePath } = await import("./server");
              const vaultDir = getVaultBasePath();
              const agents = await fetchOpenCodeAgents(s.opencode.cliPath, vaultDir, s.opencode.port);
              s.opencodeAgents = agents;
              await this.plugin.saveSettings();
              new Notice(t("notice.syncAgents", String(agents.length)));
              this.display();
            } catch (err: unknown) { new Notice(t("notice.syncFailed", err instanceof Error ? err.message : String(err))); }
          });
        }), "bot");
    }

    this.decorateSetting(new Setting(container)
      .setName(t("setting.cli.reasoning"))
      .setDesc(t("setting.cli.reasoning.desc"))
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
      .setName(t("setting.cli.permission"))
      .setDesc(t("setting.cli.permission.desc.full"))
      .addDropdown((dd) => {
        dd.addOption("read-only", t("setting.cli.permission.ro"));
        dd.addOption("workspace-write", t("setting.cli.permission.ww"));
        dd.addOption("danger-full-access", t("setting.cli.permission.dfa"));
        dd.setValue(s.defaultPermission);
        dd.onChange(async (val) => { s.defaultPermission = val as PermissionMode; await this.plugin.saveSettings(); });
      }), "shield-check");

    container.createEl("hr");
    container.createEl("h3", { text: t("setting.assistant.title") + t("assistant.suffixC") });

    this.decorateSetting(new Setting(container)
      .setName(t("setting.assistant.name"))
      .setDesc(t("setting.assistant.name.desc"))
      .addText((text) => text.setPlaceholder(t("assistant.defaultNameC")).setValue(s.assistantC.name === t("assistant.defaultNameC") ? "" : s.assistantC.name)
        .onChange(async (val) => { s.assistantC.name = val || t("assistant.defaultNameC"); await this.plugin.saveSettings(); }),
      ), "bot");

    this.decorateSetting(new Setting(container)
      .setName(t("setting.assistant.avatar"))
      .addDropdown((dd) => {
        dd.addOption("server", "server");
        dd.addOption("bot", "bot");
        dd.addOption("terminal-square", "terminal-square");
        dd.addOption("cpu", "cpu");
        dd.addOption("wrench", "wrench");
        dd.setValue(s.assistantC.avatar || "server");
        dd.onChange(async (val) => { s.assistantC.avatar = val; await this.plugin.saveSettings(); });
      }), "image");

    this.decorateSetting(new Setting(container)
      .setName(t("setting.assistant.prompt"))
      .addTextArea((text) => {
        text.setValue(s.assistantC.systemPrompt);
        text.inputEl.rows = 4;
        text.onChange(async (val) => { s.assistantC.systemPrompt = val; await this.plugin.saveSettings(); });
      }), "message-square");

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
      const nameSpan = title.createSpan({ text: provider.name || t("api.provider.unnamed") });
      const modelSmall = title.createEl("small", { text: " · " + (provider.model || t("api.provider.noModel")) });
      const updateHeader = () => {
        nameSpan.textContent = provider.name || t("api.provider.unnamed");
        modelSmall.textContent = " · " + (provider.model || t("api.provider.noModel"));
      };

      const headActions = head.createDiv({ cls: "xy-api-provider-actions" });

      if (!isActive) {
        const activateBtn = headActions.createEl("button", { cls: "xy-status-btn", text: t("setting.api.provider.activate") });
        activateBtn.addEventListener("click", async () => {
          s.activeApiProviderId = provider.id;
          await this.plugin.saveSettings();
          this.display();
          const ok = await this.testApiConnection(provider);
          new Notice(ok ? t("notice.switchedTo", provider.name) : t("notice.connFailed", provider.name));
        });
      }

      const testBtn = headActions.createEl("button", { cls: "xy-status-btn", text: t("setting.api.provider.test") });
      testBtn.addEventListener("click", async () => {
        const ok = await this.testApiConnection(provider);
        new Notice(ok ? t("notice.connSuccess", provider.name) : t("notice.connFailGeneric", provider.name));
      });

      const deleteBtn = headActions.createEl("button", { cls: "xy-status-btn", text: t("setting.api.provider.delete") });
      deleteBtn.addEventListener("click", async () => {
        if (providers.length <= 1) { new Notice(t("setting.api.provider.leastOne")); return; }
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
        const target = e.target instanceof HTMLElement ? e.target : null;
        if (target?.closest("button")) return;
        collapsed = !collapsed;
        content.style.display = collapsed ? "none" : "";
      });

      this.addProviderText(content, t("setting.api.provider.name"), provider.name, t("api.provider.namePlaceholder"), async (val) => {
        provider.name = val;
        await this.plugin.saveSettings();
        updateHeader();
      });

      this.addProviderText(content, "Base URL", provider.baseUrl, "https://api.openai.com/v1", async (val) => {
        provider.baseUrl = val;
        await this.plugin.saveSettings();
      });

      this.addProviderText(content, t("setting.api.provider.model"), provider.model, "gpt-4o", async (val) => {
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
    const newBtn = addBtn.createEl("button", { cls: "xy-status-btn", text: t("setting.api.provider.new") });
    newBtn.addEventListener("click", async () => {
      const newId = `provider_${Date.now()}`;
      s.apiProviders.push({ id: newId, name: t("api.provider.newName"), baseUrl: "", model: "", apiKey: "" });
      await this.plugin.saveSettings();
      this.display();
    });

    container.createEl("hr");
    container.createEl("h3", { text: t("setting.api.params") });

    this.decorateSetting(new Setting(container)
      .setName(t("setting.api.reasoning"))
      .setDesc(t("setting.api.reasoning.desc"))
      .addDropdown((dd) => {
        dd.addOption("none", "none");
        dd.addOption("low", "low");
        dd.addOption("medium", "medium");
        dd.addOption("high", "high");
        dd.setValue(s.apiReasoningEffort);
        dd.onChange(async (val) => { s.apiReasoningEffort = val as ReasoningEffortAPI; await this.plugin.saveSettings(); });
      }), "brain");

    this.decorateSetting(new Setting(container)
      .setName(t("setting.api.temperature"))
      .setDesc(t("setting.api.temperature.desc"))
      .addSlider((slider) =>
        slider.setLimits(0, 2, 0.1).setValue(s.temperature)
          .onChange(async (val) => { s.temperature = val; await this.plugin.saveSettings(); }),
      ), "thermometer");

    this.decorateSetting(new Setting(container)
      .setName(t("setting.api.maxTokens"))
      .addText((text) =>
        text.setPlaceholder("4096").setValue(s.maxTokens === 4096 ? "" : String(s.maxTokens))
          .onChange(async (val) => { const n = parseInt(val); s.maxTokens = n > 0 ? n : 4096; await this.plugin.saveSettings(); }),
      ), "subtitles");

    container.createEl("hr");
    container.createEl("h3", { text: t("setting.assistant.title") + t("assistant.suffixA") });

    this.decorateSetting(new Setting(container)
      .setName(t("setting.assistant.name"))
      .setDesc(t("setting.assistant.name.desc"))
      .addText((text) => text.setPlaceholder(t("assistant.defaultNameA")).setValue(s.assistantA.name === t("assistant.defaultNameA") ? "" : s.assistantA.name)
        .onChange(async (val) => { s.assistantA.name = val || t("assistant.defaultNameA"); await this.plugin.saveSettings(); }),
      ), "bot");

    this.decorateSetting(new Setting(container)
      .setName(t("setting.assistant.avatar"))
      .addDropdown((dd) => {
        dd.addOption("sparkles", "sparkles");
        dd.addOption("bot", "bot");
        dd.addOption("message-circle", "message-circle");
        dd.addOption("smile", "smile");
        dd.addOption("feather", "feather");
        dd.setValue(s.assistantA.avatar || "sparkles");
        dd.onChange(async (val) => { s.assistantA.avatar = val; await this.plugin.saveSettings(); });
      }), "image");

    this.decorateSetting(new Setting(container)
      .setName(t("setting.assistant.prompt"))
      .addTextArea((text) => {
        text.setValue(s.assistantA.systemPrompt);
        text.inputEl.rows = 4;
        text.onChange(async (val) => { s.assistantA.systemPrompt = val; await this.plugin.saveSettings(); });
      }), "message-square");
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

  // ─── Skills 设置 ──────────────────────────────────────────────────

  private buildSkillsTab(container: HTMLElement) {
    const s = this.s();

// ── Setting 1: AGENTS.MD ────────────────────────────────────

    this.decorateSetting(new Setting(container)
      .setName(t("setting.skills.agents"))
      .setDesc(t("setting.skills.agents.desc"))
      .addButton((btn) => {
        btn.setButtonText(t("setting.skills.create"));
        btn.onClick(async () => {
          const file = this.app.vault.getAbstractFileByPath("AGENTS.md");
          if (file && file instanceof TFile) {
            new Notice(t("setting.skills.exists"));
            return;
          }
          const text = inputEl.value.trim();
          if (!text) { new Notice(t("setting.skills.inputFirst")); return; }
          btn.setDisabled(true);
          btn.setButtonText(t("setting.skills.generating"));
          try {
            const { callAISession } = await import("./ai");
            const { getVaultBasePath } = await import("./server");
            const result = await callAISession({
              prompt: `根据以下要求创建一份 AGENTS.md 文件内容，定义可复用的 AI skill/agent。

用户要求：
${text}

请直接输出 AGENTS.md 的完整内容，不要多余解释。`,
              settings: s,
              vaultDir: getVaultBasePath(),
            });
            await this.app.vault.create("AGENTS.md", result.trim());
            new Notice(t("setting.skills.generated"));
            inputEl.value = "";
            btn.setDisabled(false);
            btn.setButtonText(t("setting.skills.create"));
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes("configure") || msg.includes("connection") || msg.includes("API") || msg.includes("key")) {
              new Notice(t("skill.sync.notice"));
            } else {
              new Notice(t("skill.create.failed", msg));
            }
            btn.setDisabled(false);
            btn.setButtonText(t("setting.skills.create"));
          }
        });
      })
      .addButton((btn) => {
        btn.setButtonText(t("setting.skills.edit"));
        btn.onClick(() => {
          const file = this.app.vault.getAbstractFileByPath("AGENTS.md");
          if (!file || !(file instanceof TFile)) {
            new Notice(t("setting.skills.notExist"));
            return;
          }
          this.app.workspace.openLinkText("AGENTS.md", "/");
        });
      }),
    "wand-sparkles");

    const inputEl: HTMLTextAreaElement = container.createEl("textarea", {
      cls: "xy-skills-generate-input",
      attr: { placeholder: t("setting.skills.create.desc") },
    });

    // ── Setting 2: Skills列表 ──────────────────────────────────

    this.decorateSetting(new Setting(container)
      .setName(t("setting.skills.list"))
      .setDesc(t("setting.skills.list.desc"))
      .addButton((btn) => {
        btn.setButtonText("↻");
        btn.setTooltip(t("setting.skills.syncTooltip"));
        btn.onClick(async () => {
          btn.setDisabled(true);
          try {
            const file = this.app.vault.getAbstractFileByPath("AGENTS.md");
            if (!file || !(file instanceof TFile)) {
              new Notice(t("setting.skills.notExist"));
              btn.setDisabled(false);
              return;
            }
            const content = await this.app.vault.read(file);
            const { callAISession } = await import("./ai");
            const { getVaultBasePath } = await import("./server");
            const result = await callAISession({
              prompt: `从以下内容中提取所有 skill/agent，每个包含：
- name：英文名称，照搬原文不要修改
- description：简要描述

只返回纯 JSON 数组 [{name, description}]，不要其他文字。\n\n${content}`,
              settings: s,
              vaultDir: getVaultBasePath(),
            });
            const jsonStart = result.indexOf("[");
            const jsonEnd = result.lastIndexOf("]");
            if (jsonStart === -1 || jsonEnd === -1) throw new Error(t("error.aiNoValidJson"));
            const jsonStr = result.slice(jsonStart, jsonEnd + 1);
            const skills = JSON.parse(jsonStr);
            if (!Array.isArray(skills)) throw new Error(t("error.aiFormatError"));
            s.skills = skills;
            await this.plugin.saveSettings();
            new Notice(t("notice.syncSkills", String(skills.length)));
            this.display();
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes("configure") || msg.includes("connection") || msg.includes("API") || msg.includes("key")) {
              new Notice(t("skill.sync.notice"));
            } else {
              new Notice(t("skill.sync.failed", msg));
            }
            btn.setDisabled(false);
          }
        });
      }),
    "list");

    if (s.skills.length > 0) {
      const table = container.createEl("table", { cls: "xy-skills-table" });
      const thead = table.createEl("thead");
      const headerRow = thead.createEl("tr");
      headerRow.createEl("th", { text: t("setting.skills.table.name") });
      headerRow.createEl("th", { text: t("setting.skills.table.desc") });
      headerRow.createEl("th", { text: t("setting.skills.table.autoRun") });

      const tbody = table.createEl("tbody");
      for (const skill of s.skills) {
        const row = tbody.createEl("tr");
        row.createEl("td", { text: skill.name });
        row.createEl("td", { text: skill.description });
        const actionCell = row.createEl("td");
        if (skill.autoRunInterval === undefined) skill.autoRunInterval = 0;
        const select = actionCell.createEl("select", { cls: "dropdown" });
        const intervals: { value: number; label: string }[] = [
          { value: 0, label: t("interval.off") },
          { value: 60, label: t("interval.hourly") },
          { value: 360, label: t("interval.6hours") },
          { value: 1440, label: t("interval.daily") },
          { value: 10080, label: t("interval.weekly") },
        ];
        for (const opt of intervals) {
          select.createEl("option", { value: String(opt.value), text: opt.label });
        }
        select.value = String(skill.autoRunInterval);
        select.addEventListener("change", async () => {
          skill.autoRunInterval = parseInt(select.value);
          await this.plugin.saveSettings();
        });
      }
    }
  }

  // ─── Prompt 模板 ──────────────────────────────────────────────────

  private buildPromptsTab(container: HTMLElement) {
    const s = this.s();
    const templates = s.promptTemplates || [];
    const builtinIds = ["polish", "summarize", "complete", "expand", "translate", "translate-en", "continue"];

    container.createEl("p", { cls: "xy-settings-desc", text: t("setting.prompts.title") });

    for (let i = 0; i < templates.length; i++) {
      const tpl = templates[i];
      const builtin = builtinIds.includes(tpl.id);
      const card = container.createDiv({ cls: "xy-api-provider-row" });

      const head = card.createDiv({ cls: "xy-api-provider-head" });
      const title = head.createDiv({ cls: "xy-api-provider-title" });
      const nameSpan = title.createSpan({ text: tpl.name });
      title.createEl("small", { text: ` · ${tpl.description}` });
      if (builtin) title.createEl("small", { text: t("setting.prompts.default"), cls: "xy-mcp-disabled" });

      const updateHeader = () => {
        nameSpan.textContent = tpl.name || t("api.provider.unnamed");
      };

      let collapsed = true;
      const content = card.createDiv({ cls: "xy-api-provider-content" });
      content.style.display = "none";
      head.style.cursor = "pointer";
      head.addEventListener("click", (e) => {
        const target = e.target instanceof HTMLElement ? e.target : null;
        if (target?.closest("button")) return;
        collapsed = !collapsed;
        content.style.display = collapsed ? "none" : "";
      });

      this.addPromptsFieldText(content, t("setting.prompts.name"), tpl.name, t("setting.prompts.namePlaceholder"), async (val) => {
        tpl.name = val;
        await this.plugin.saveSettings();
        updateHeader();
      });

      this.addPromptsFieldText(content, t("setting.prompts.desc.label"), tpl.description, t("setting.prompts.descPlaceholder"), async (val) => {
        tpl.description = val;
        await this.plugin.saveSettings();
      });

      const promptField = content.createDiv({ cls: "xy-api-provider-field" });
      promptField.createSpan({ cls: "xy-api-provider-label", text: t("setting.prompts.prompt") });
      const promptArea = promptField.createEl("textarea", { cls: "xy-api-provider-input", attr: { rows: "4", placeholder: t("setting.prompts.placeholder") } });
      promptArea.value = tpl.prompt;
      promptArea.addEventListener("change", async () => {
        tpl.prompt = promptArea.value.trim();
        await this.plugin.saveSettings();
      });

      const btnField = content.createDiv({ cls: "xy-api-provider-field" });
      if (builtin) {
        const restoreBtn = btnField.createEl("button", { cls: "xy-status-btn", text: t("setting.prompts.restore") });
        restoreBtn.addEventListener("click", async () => {
          const def = DEFAULT_PROMPT_TEMPLATES.find(d => d.id === tpl.id);
          if (def) {
            tpl.name = def.name;
            tpl.description = def.description;
            tpl.prompt = def.prompt;
            tpl.icon = def.icon;
            await this.plugin.saveSettings();
            this.display();
          }
        });
      } else {
        const deleteBtn = btnField.createEl("button", { cls: "xy-status-btn", text: t("setting.prompts.delete") });
        deleteBtn.addEventListener("click", async () => {
          s.promptTemplates.splice(i, 1);
          await this.plugin.saveSettings();
          this.display();
        });
      }
    }

    const addBtn = container.createDiv({ cls: "xy-settings-status-actions" });
    const newBtn = addBtn.createEl("button", { cls: "xy-status-btn", text: t("setting.prompts.add") });
    newBtn.addEventListener("click", async () => {
      s.promptTemplates.push({ id: "tpl-" + Date.now(), name: t("setting.prompts.newName"), description: t("setting.prompts.newDesc"), prompt: t("setting.prompts.defaultPrompt"), icon: "file-pen" });
      await this.plugin.saveSettings();
      this.display();
    });
  }

  private addPromptsFieldText(
    container: HTMLElement, label: string, value: string,
    placeholder: string, onChange: (val: string) => Promise<void>,
  ) {
    const field = container.createDiv({ cls: "xy-api-provider-field" });
    field.createSpan({ cls: "xy-api-provider-label", text: label });
    const input = field.createEl("input", { cls: "xy-api-provider-input", attr: { placeholder } });
    input.value = value;
    input.addEventListener("change", () => { void onChange(input.value); });
  }

  // ─── 通用设置 ─────────────────────────────────────────────────────

  private buildGeneralTab(container: HTMLElement) {
    const s = this.s();

    this.decorateSetting(new Setting(container)
      .setName(t("setting.general.mode"))
      .setDesc(s.execMode === "cli"
        ? t("mode.cli.desc")
        : t("mode.api.desc"))
      .addDropdown((dd) => {
        dd.addOption("cli", t("mode.cli"));
        dd.addOption("api", t("mode.api"));
        dd.setValue(s.execMode);
        dd.onChange(async (val) => {
          s.execMode = val as "api" | "cli";
          await this.plugin.saveSettings();
          const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT).first();
          if (leaf?.view instanceof XiaoyuanAIChatView) {
            leaf.view.switchMode(val as "api" | "cli");
          }
          await this.refreshStatusCard();
        });
      }), "bot");

    this.decorateSetting(new Setting(container)
      .setName(t("setting.proxy"))
      .setDesc(t("setting.proxy.desc"))
      .addToggle((t) => {
        t.setValue(s.proxyEnabled);
        t.onChange(async (val) => { s.proxyEnabled = val; await this.plugin.saveSettings(); });
      }), "waypoints");

    this.decorateSetting(new Setting(container)
      .setName(t("setting.proxyUrl"))
      .setDesc(t("setting.proxyUrl.desc"))
      .addText((text) =>
        text.setPlaceholder("http://127.0.0.1:7890").setValue(s.proxyUrl)
          .onChange(async (val) => { s.proxyUrl = val.trim(); await this.plugin.saveSettings(); }),
      ), "route");

    this.decorateSetting(new Setting(container)
      .setName(t("setting.autoOpen"))
      .addToggle((t) => {
        t.setValue(s.autoOpen);
        t.onChange(async (val) => { s.autoOpen = val; await this.plugin.saveSettings(); });
      }), "panel-right-open");

    this.decorateSetting(new Setting(container)
      .setName(t("setting.captureCmd"))
      .setDesc(t("setting.captureCmd.desc"))
      .addDropdown((dd) => {
        const cmds = this.app.commands.listCommands();
        dd.addOption("", t("setting.captureCmd.none"));
        for (const cmd of cmds) {
          dd.addOption(cmd.id, `${cmd.name} (${cmd.id})`);
        }
        dd.setValue(s.captureCommandId);
        dd.onChange(async (val) => { s.captureCommandId = val; await this.plugin.saveSettings(); });
      }), "camera");

    container.createEl("hr");
    container.createEl("h3", { text: t("setting.general.chatSettings") });

    this.decorateSetting(new Setting(container)
      .setName(t("setting.chatPath"))
      .setDesc(t("setting.chatPath.desc"))
      .addText((text) =>
        text.setPlaceholder("_xiaoyuanAI/chatHistory").setValue(s.chatHistoryPath === "_xiaoyuanAI/chatHistory" ? "" : s.chatHistoryPath)
          .onChange(async (val) => { s.chatHistoryPath = val.trim() || "_xiaoyuanAI/chatHistory"; await this.plugin.saveSettings(); }),
      ), "folder");

    this.decorateSetting(new Setting(container)
      .setName(t("setting.chatPosition"))
      .addDropdown((dd) => {
        dd.addOption("left", t("setting.chatPosition.left"));
        dd.addOption("right", t("setting.chatPosition.right"));
        dd.setValue(s.chatViewType);
        dd.onChange(async (val) => { s.chatViewType = val as "left" | "right"; await this.plugin.saveSettings(); });
      }), "layout-dashboard");

    this.decorateSetting(new Setting(container)
      .setName(t("setting.diff"))
      .setDesc(t("setting.diff.desc"))
      .addToggle((t) => {
        t.setValue(s.showDiffPreview);
        t.onChange(async (val) => { s.showDiffPreview = val; await this.plugin.saveSettings(); });
      }), "file-diff");

    this.decorateSetting(new Setting(container)
      .setName(t("setting.thinking"))
      .setDesc(t("setting.thinking.desc"))
      .addToggle((t) => {
        t.setValue(s.showThinking);
        t.onChange(async (val) => { s.showThinking = val; await this.plugin.saveSettings(); });
      }), "brain");

    this.decorateSetting(new Setting(container)
      .setName(t("setting.attachSize"))
      .setDesc(t("setting.attachSize.desc"))
      .addText((text) =>
        text.setPlaceholder("10").setValue(s.maxAttachmentSize === 10 ? "" : String(s.maxAttachmentSize))
          .onChange(async (val) => {
            const n = parseInt(val);
            s.maxAttachmentSize = n > 0 ? n : 10;
            await this.plugin.saveSettings();
          }),
      ), "hard-drive");

    this.decorateSetting(new Setting(container)
      .setName(t("setting.context"))
      .setDesc(t("setting.context.desc"))
      .addToggle((t) => {
        t.setValue(s.showContext);
        t.onChange(async (val) => {
          s.showContext = val;
          await this.plugin.saveSettings();
          const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_XIAOYUAN_AI_CHAT).first();
          if (leaf?.view instanceof XiaoyuanAIChatView) {
            leaf.view.rebuildToolbar();
          }
        });
      }), "file-text");

  }

  private buildAboutTab(container: HTMLElement) {
    const card = container.createDiv({ cls: "xy-settings-status" });

    const titleRow = card.createDiv({ cls: "xy-settings-status-row" });
    const iconSpan = titleRow.createSpan({ cls: "xy-settings-status-icon" });
    setIcon(iconSpan, "sparkles");
    titleRow.createSpan({ cls: "xy-settings-status-label", text: manifest.name || t("about.title") });
    titleRow.createSpan({ cls: "xy-settings-status-value", text: `v${manifest.version}` });

    const descRow = card.createDiv({ cls: "xy-settings-status-row" });
    const descIcon = descRow.createSpan({ cls: "xy-settings-status-icon" });
    setIcon(descIcon, "file-text");
    descRow.createSpan({ cls: "xy-settings-status-label", text: t("about.desc") });
    descRow.createSpan({ cls: "xy-settings-status-value", text: manifest.description });

    const authorRow = card.createDiv({ cls: "xy-settings-status-row" });
    const authorIcon = authorRow.createSpan({ cls: "xy-settings-status-icon" });
    setIcon(authorIcon, "user");
    authorRow.createSpan({ cls: "xy-settings-status-label", text: t("about.author") });
    authorRow.createSpan({ cls: "xy-settings-status-value", text: manifest.author || "ziwensite" });

    const licenseRow = card.createDiv({ cls: "xy-settings-status-row" });
    const licIcon = licenseRow.createSpan({ cls: "xy-settings-status-icon" });
    setIcon(licIcon, "scale");
    licenseRow.createSpan({ cls: "xy-settings-status-label", text: t("about.license") });
    licenseRow.createSpan({ cls: "xy-settings-status-value", text: "MIT" });

    const depRow = card.createDiv({ cls: "xy-settings-status-row" });
    const depIcon = depRow.createSpan({ cls: "xy-settings-status-icon" });
    setIcon(depIcon, "package");
    depRow.createSpan({ cls: "xy-settings-status-label", text: t("about.dep") });
    depRow.createSpan({ cls: "xy-settings-status-value", text: "opencode CLI" });

    container.createEl("hr");

    const linkCard = container.createDiv({ cls: "xy-settings-status" });
    const ghRow = linkCard.createDiv({ cls: "xy-settings-status-row" });
    const ghIcon = ghRow.createSpan({ cls: "xy-settings-status-icon" });
    setIcon(ghIcon, "github");
    ghRow.createSpan({ cls: "xy-settings-status-label", text: t("about.github") });
    const ghLink = ghRow.createEl("a", { cls: "xy-settings-status-value", text: "ziwensite/xiaoyuanAI", href: "https://github.com/ziwensite/xiaoyuanAI" });
    ghLink.target = "_blank";
    ghLink.style.color = "var(--interactive-accent)";

    const issueRow = linkCard.createDiv({ cls: "xy-settings-status-row" });
    const issueIcon = issueRow.createSpan({ cls: "xy-settings-status-icon" });
    setIcon(issueIcon, "bug");
    issueRow.createSpan({ cls: "xy-settings-status-label", text: t("about.issues") });
    const issueLink = issueRow.createEl("a", { cls: "xy-settings-status-value", text: t("about.issues.text"), href: "https://github.com/ziwensite/xiaoyuanAI/issues" });
    issueLink.target = "_blank";
    issueLink.style.color = "var(--interactive-accent)";

    container.createEl("hr");
    container.createEl("p", { cls: "xy-settings-desc", text: t("about.tech") });
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
      syncItem.createSpan({ cls: "xy-popup-label" }).textContent = t("modelPicker.syncModels");
      syncItem.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        popup.remove();
        try {
          const { fetchOpenCodeModelsFromCLI, ensureOpenCodeServer } = await import("./ai");
const vaultDir = getVaultBasePath();
          await ensureOpenCodeServer(s.opencode.cliPath, s.opencode.hostname, s.opencode.port, vaultDir, true);
          const result = await fetchOpenCodeModelsFromCLI(s.opencode.cliPath, vaultDir, s.opencode.port);
          s.opencodeModels = result.models.map((m) => ({ label: m.displayName, value: m.id }));
          s.opencodeModelCaps = result.caps;
          if (!s.opencode.model || !result.models.some((m) => m.id === s.opencode.model)) {
            s.opencode.model = result.defaultModel || result.models[0]?.id || "";
          }
          await this.plugin.saveSettings();
          new Notice(t("notice.syncModels", String(result.models.length)));
        } catch (err: unknown) {
          new Notice(t("notice.syncFailed", err instanceof Error ? err.message : String(err)));
        }
      });

      const groups = new Map<string, { label: string; value: string }[]>();
      for (const m of models) {
        const provider = m.value.includes("/") ? m.value.split("/")[0] : t("modelPicker.other");
        const list = groups.get(provider);
        if (list) {
          list.push(m);
        } else {
          groups.set(provider, [m]);
        }
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
