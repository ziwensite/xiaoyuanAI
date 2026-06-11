import { TFile, Notice } from "obsidian";
import type { Vault } from "obsidian";
import type { Workspace } from "obsidian";

export async function openInEditor(
  content: string,
  vault: Vault,
  workspace: Workspace,
  chatHistoryPath: string,
  ts?: number,
  source?: string,
): Promise<void> {
  try {
    const tempRel = `${chatHistoryPath}/temp`;
    try { await vault.createFolder(tempRel); } catch {}

    const d = ts ? new Date(ts) : new Date();
    const dateStr = `${String(d.getFullYear())}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
    const suffix = Math.random().toString(36).slice(2, 8);
    const fileRel = `${tempRel}/msg-${dateStr}-${suffix}.md`;

    const title = (content.split("\n")[0] || "消息").replace(/^#+\s*/, "").slice(0, 50);
    const dateOnly = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const frontmatter = `---\ntitle: ${title}\ncreated: ${dateOnly}${source ? `\nsource: ${source}` : ""}\n---\n\n`;
    const fullContent = frontmatter + content;

    const existing = vault.getAbstractFileByPath(fileRel);
    let file: TFile;
    if (existing instanceof TFile) {
      await vault.modify(existing, fullContent);
      file = existing;
    } else {
      file = await vault.create(fileRel, fullContent);
    }

    await workspace.getLeaf("tab").openFile(file);
  } catch (err: unknown) {
    new Notice(`打开失败: ${err instanceof Error ? err.message : String(err)}`);
  }
}