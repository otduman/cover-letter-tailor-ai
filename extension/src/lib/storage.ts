// Typed wrapper around chrome.storage.local for the extension's settings.
import type { ToneKey } from "./config";

export interface Settings {
  geminiApiKey: string;
  // Google OAuth ("Web application" client) credentials.
  googleClientId: string;
  googleClientSecret: string;
  // Stored after the user connects; used to mint access tokens.
  googleRefreshToken: string;
  // Google Doc holding the master career history.
  masterDocUrl: string;
  // Cached plain-text contents of the master doc, refreshed from Google Docs.
  masterDocText: string;
  // Optional custom cover letter template; empty means use the default.
  coverLetterTemplate: string;
  lastTone: ToneKey;
}

const DEFAULTS: Settings = {
  geminiApiKey: "",
  googleClientId: "",
  googleClientSecret: "",
  googleRefreshToken: "",
  masterDocUrl: "",
  masterDocText: "",
  coverLetterTemplate: "",
  lastTone: "Formal / Corporate",
};

export async function getSettings(): Promise<Settings> {
  const stored = await browser.storage.local.get(DEFAULTS);
  return { ...DEFAULTS, ...stored } as Settings;
}

export async function setSettings(patch: Partial<Settings>): Promise<void> {
  await browser.storage.local.set(patch);
}
