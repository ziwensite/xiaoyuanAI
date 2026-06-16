import { Notice, setTooltip } from "obsidian";
import { t } from "./i18n";
import { showPopup, addPopupItem } from "./popup";
import { getActiveProvider } from "./constants";
import type { ReasoningEffort, ReasoningEffortAPI } from "./types";
import type XiaoyuanAIPlugin from "./main";

interface ToolbarHost {
  plugin: XiaoyuanAIPlugin;
  abortController: AbortController | null;
  pickFiles(): void;
  sendMessage(): void;
  syncOpenCodeState(): Promise<void>;
}

export function buildToolbarContent(container: HTMLElement, view: ToolbarHost): HTMLSpanElement {
  const s = view.plugin.settings;

  const attachBtn = container.createSpan({ cls: "xiaoyuan-attach-btn" });
  attachBtn.textContent = "+";
  setTooltip(attachBtn, t("chat.tooltip.attach"));
  attachBtn.addEventListener("click", () => view.pickFiles());

  // Context indicator
  if (s.showContext) {
    const ctxBtn = container.createSpan({ cls: "xiaoyuan-attach-btn" });
    ctxBtn.textContent = "📄";
    setTooltip(ctxBtn, t("chat.tooltip.context"));
  }

  // Agent (CLI only)
  if (s.execMode === "cli") {
    const agentOptions = (s.opencodeAgents || []).length
      ? (s.opencodeAgents || []).map((a) => ({ value: a.name, label: a.name }))
      : [{ value: "build", label: "build" }, { value: "plan", label: "plan" }];
    const agentText = container.createSpan({ cls: "xiaoyuan-level-select" });
    agentText.textContent = s.opencode.agent;
    setTooltip(agentText, t("chat.agent.tooltip"));
    agentText.addEventListener("click", (e) => {
      e.stopPropagation();
      showPopup(agentText, (popup) => {
        for (const m of agentOptions) {
          addPopupItem(popup, m.label, m.value === s.opencode.agent, () => {
            s.opencode.agent = m.value;
            view.plugin.saveSettings();
            agentText.textContent = m.value;
            const chatEl = agentText.closest(".xiaoyuan-chat");
            if (chatEl) {
              chatEl.removeClass("xy-agent-plan", "xy-agent-build");
              if (m.value === "plan") chatEl.addClass("xy-agent-plan");
              else if (m.value === "build") chatEl.addClass("xy-agent-build");
            }
            new Notice(t("setting.cli.agent") + ": " + m.value);
          });
        }
      }, { direction: "up" });
    });
    container.appendChild(agentText);
  }

  // Model trigger
  const trigger = container.createSpan({ cls: "xiaoyuan-model-select" });
  trigger.textContent = s.execMode === "cli"
    ? (s.opencode.model ? s.opencode.model.split("/").pop() || s.opencode.model : t("chat.model.tooltip"))
    : (getActiveProvider(s)?.model || t("chat.model.tooltip"));
  setTooltip(trigger, s.execMode === "cli" ? s.opencode.model || t("status.notConfigured") : getActiveProvider(s)?.model || t("status.notConfigured"));
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    showPopup(trigger, async (popup) => {
      if (s.execMode === "cli") {
        let models = s.opencodeModels || [];
        if (models.length === 0) {
          const loadingItem = popup.createDiv({ cls: "xy-popup-item" });
          loadingItem.createSpan({ cls: "xy-popup-label" }).textContent = t("status.checking");
          await view.syncOpenCodeState().catch(() => {});
          models = s.opencodeModels || [];
          popup.empty();
        }
        if (models.length === 0) {
          const emptyItem = popup.createDiv({ cls: "xy-popup-item" });
          emptyItem.createSpan({ cls: "xy-popup-label" }).textContent = t("notice.noModels");
          return;
        }
        const groups = new Map<string, { label: string; value: string }[]>();
        for (const m of models) {
          const provider = m.value.includes("/") ? m.value.split("/")[0] : "其他";
          const list = groups.get(provider);
          if (list) {
            list.push(m);
          } else {
            groups.set(provider, [m]);
          }
        }
        const sortedGroups = [...groups.entries()].sort(([a], [b]) => {
          if (a === "opencode") return -1;
          if (b === "opencode") return 1;
          return a.localeCompare(b);
        });
        for (const [providerName, items] of sortedGroups) {
          popup.createDiv({ cls: "xy-popup-separator" });
          const groupTitle = popup.createDiv({ cls: "xy-popup-group-title" });
          const arrow = groupTitle.createSpan({ cls: "xy-popup-arrow" });
          arrow.textContent = "▶";
          groupTitle.createSpan({ cls: "xy-popup-label" }).textContent = providerName;
          const children = popup.createDiv({ cls: "xy-popup-group-children" });
          children.classList.add("is-collapsed");
          for (const m of items) {
            addPopupItem(children, m.label, m.value === s.opencode.model, () => {
              s.opencode.model = m.value;
              view.plugin.saveSettings();
              const shortName = m.value.split("/").pop() || m.value;
              trigger.textContent = shortName;
              setTooltip(trigger, m.value);
              new Notice(t("setting.cli.model") + ": " + shortName);
            });
          }
          groupTitle.addEventListener("click", (ev) => {
            ev.stopPropagation();
            const open = arrow.textContent === "▼";
            arrow.textContent = open ? "▶" : "▼";
            children.classList.toggle("is-collapsed", open);
          });
        }
        popup.createDiv({ cls: "xy-popup-separator" });
        const syncBtn = popup.createDiv({ cls: "xy-popup-item" });
        syncBtn.createSpan({ cls: "xy-popup-label" }).textContent = t("status.refresh");
        syncBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          popup.remove();
          view.syncOpenCodeState();
        });
      } else {
        const providers = s.apiProviders;
        const activeProvider = getActiveProvider(s);
        let hasItem = false;
        for (const p of providers) {
          if (!p.model) continue;
          hasItem = true;
          const label = p.name ? `${p.name}: ${p.model}` : p.model;
          const isActive = p.id === activeProvider?.id;
          addPopupItem(popup, label, isActive, () => {
            s.activeApiProviderId = p.id;
            view.plugin.saveSettings();
            trigger.textContent = p.model;
            setTooltip(trigger, p.name ? `${p.name}: ${p.model}` : p.model);
            new Notice(t("notice.switchedTo", label));
          });
        }
        if (!hasItem) {
          const emptyItem = popup.createDiv({ cls: "xy-popup-item" });
          emptyItem.createSpan({ cls: "xy-popup-label" }).textContent = t("status.notConfigured");
        }
      }
    }, { direction: "up", maxHeight: "50vh" });
  });

  // Reasoning level
  const apiLevels = [
    { value: "none", label: "none" },
    { value: "low", label: "low" },
    { value: "medium", label: "medium" },
    { value: "high", label: "high" },
  ];
  if (s.execMode === "cli") {
    const levels: { value: string; label: string }[] = [
      { value: "none", label: "none" },
      { value: "minimal", label: "minimal" },
      { value: "low", label: "low" },
      { value: "medium", label: "medium" },
      { value: "high", label: "high" },
      { value: "xhigh", label: "xhigh" },
    ];
    const levelText = container.createSpan({ cls: "xiaoyuan-level-select" });
    levelText.textContent = s.defaultReasoning;
    setTooltip(levelText, t("chat.reasoning.tooltip"));
    levelText.addEventListener("click", (e) => {
      e.stopPropagation();
      showPopup(levelText, (popup) => {
        for (const m of levels) {
          addPopupItem(popup, m.label, m.value === s.defaultReasoning, () => {
            s.defaultReasoning = m.value as ReasoningEffort;
            view.plugin.saveSettings();
            levelText.textContent = m.label;
            new Notice(t("setting.cli.reasoning") + ": " + m.label);
          });
        }
      }, { direction: "up" });
    });
    container.appendChild(levelText);
  } else {
    const apiLevelText = container.createSpan({ cls: "xiaoyuan-level-select" });
    apiLevelText.textContent = s.apiReasoningEffort;
    setTooltip(apiLevelText, t("chat.reasoning.tooltip"));
    apiLevelText.addEventListener("click", (e) => {
      e.stopPropagation();
      showPopup(apiLevelText, (popup) => {
        for (const m of apiLevels) {
          addPopupItem(popup, m.label, m.value === s.apiReasoningEffort, () => {
            s.apiReasoningEffort = m.value as ReasoningEffortAPI;
            view.plugin.saveSettings();
            apiLevelText.textContent = m.label;
            new Notice(t("setting.cli.reasoning") + ": " + m.label);
          });
        }
      }, { direction: "up" });
    });
    container.appendChild(apiLevelText);
  }

  // Send/Stop button
  const sendBtn = container.createSpan({ cls: "xiaoyuan-send-btn" });
  sendBtn.style.marginLeft = "auto";
  sendBtn.addEventListener("click", () => {
    if (view.abortController) {
      view.abortController.abort();
    } else {
      view.sendMessage();
    }
  });
  return sendBtn;
}