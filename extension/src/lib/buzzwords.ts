// Post-generation lint: flag any banned AI-sounding words that slipped through.
import { BANNED_BUZZWORDS } from "./config";

export function detectBuzzwords(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_BUZZWORDS.filter((w) => lower.includes(w.toLowerCase()));
}
