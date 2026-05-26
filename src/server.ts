export function getVaultBasePath(vault: any): string {
  return vault.adapter.getBasePath();
}
