import zh from "./locales/zh.json";
import en from "./locales/en.json";

const locales: Record<string, Record<string, string>> = { zh, en };
let locale = "zh";

export function initLocale(): void {
  try {
    const lang = window.localStorage?.getItem("language") as string || navigator.language || "zh";
    locale = lang.startsWith("zh") ? "zh" : "en";
  } catch {
    locale = "zh";
  }
}

export function t(key: string, ...args: string[]): string {
  const dict = locales[locale] || locales.zh;
  let text = dict[key];
  if (text === undefined) {
    const fallback = locales.zh[key];
    text = fallback !== undefined ? fallback : key;
  }
  args.forEach((arg, i) => { text = text.replace(`{${i}}`, arg); });
  return text;
}

export function currentLocale(): string {
  return locale;
}