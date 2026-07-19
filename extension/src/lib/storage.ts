// Typed wrapper around chrome.storage.local for the extension's settings.
import type { ToneKey, Language } from "./config";

export interface Settings {
  geminiApiKey: string;
  // Gemini model used for letter writing; empty = built-in default.
  generationModel: string;
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
  language: Language;
}

const DEFAULTS: Settings = {
  geminiApiKey: "",
  generationModel: "",
  googleClientId: "",
  googleClientSecret: "",
  googleRefreshToken: "",
  masterDocUrl: "",
  masterDocText: "",
  coverLetterTemplate: "",
  lastTone: "Formal / Corporate",
  language: "English",
};

export async function getSettings(): Promise<Settings> {
  const stored = await browser.storage.local.get(DEFAULTS);
  return { ...DEFAULTS, ...stored } as Settings;
}

export async function setSettings(patch: Partial<Settings>): Promise<void> {
  await browser.storage.local.set(patch);
}
