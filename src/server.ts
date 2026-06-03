let cachedBasePath = "";

export function setVaultBasePath(path: string) {
  cachedBasePath = path;
}

export function getVaultBasePath(_vault?: any): string {
  return cachedBasePath;
}
