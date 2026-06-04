export let vaultBasePath = "";

export function setVaultBasePath(path: string) {
  vaultBasePath = path;
}

export function getVaultBasePath(): string {
  return vaultBasePath;
}