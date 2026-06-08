import { vi } from "vitest";

function stubClass<T extends string>(name: T): { new (...args: unknown[]): Record<string, unknown> } {
  return vi.fn(() => ({})) as unknown as { new (...args: unknown[]): Record<string, unknown> };
}

vi.mock("obsidian", () => {
  const Notice = vi.fn();
  const setIcon = vi.fn();
  const setTooltip = vi.fn();

  const Plugin = stubClass("Plugin");
  const WorkspaceLeaf = stubClass("WorkspaceLeaf");
  const MarkdownView = stubClass("MarkdownView");
  const ItemView = stubClass("ItemView");
  const App = stubClass("App");
  const PluginSettingTab = stubClass("PluginSettingTab");
  const Setting = stubClass("Setting");
  const TFile = stubClass("TFile");
  const Vault = stubClass("Vault");
  const Modal = stubClass("Modal");
  const Menu = stubClass("Menu");
  const MarkdownRenderer = { render: vi.fn() };
  const Workspace = stubClass("Workspace");

  return {
    Notice,
    setIcon,
    setTooltip,
    Plugin,
    WorkspaceLeaf,
    MarkdownView,
    ItemView,
    App,
    PluginSettingTab,
    Setting,
    TFile,
    Vault,
    Modal,
    Menu,
    MarkdownRenderer,
    Workspace,
  };
});
