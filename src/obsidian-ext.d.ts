import "obsidian";

declare module "obsidian" {
  interface App {
    setting: {
      open(): void;
      openTabById(id: string): void;
    };
  }

  interface MenuItem {
    setSubmenu(): Menu;
  }

  interface View {
    quote?(text: string): void;
  }
}