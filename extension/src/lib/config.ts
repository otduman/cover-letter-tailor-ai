// Ported from the Python config.py — the project's core domain constants.

export const MODEL_NAME = "gemini-2.5-flash";

export const BANNED_BUZZWORDS: string[] = [
  "delve", "delving",
  "synergy", "synergies", "synergistic",
  "testament",
  "tapestry",
  "leverage", "leveraging", "leveraged",
  "robust",
  "seamlessly", "seamless",
  "spearheaded", "spearheading",
  "orchestrated", "orchestrating",
  "rockstar", "rock star",
  "ninja",
  "guru",
  "thought leader", "thought leadership",
  "game-changer", "game changer", "game-changing",
  "cutting-edge", "cutting edge",
  "best-in-class", "best in class",
  "deep dive",
  "move the needle",
  "circle back",
  "paradigm shift", "paradigm",
  "holistic",
  "innovative", "innovation",
  "utilize", "utilizing",
  "impactful",
  "transformative",
  "dynamic",
  "passionate",
  "passion",
  "driven professional",
  "results-driven",
  "detail-oriented",
  "fast-paced environment",
  // Extra banned terms from the writing guide:
  "proficient",
  "I am writing to express",
];

export type ToneKey = "Formal / Corporate" | "Casual / Startup" | "Graduate / Trainee";

export const TONE_DEFINITIONS: Record<ToneKey, string> = {
  "Formal / Corporate":
    "Write in formal, professional English. Use complete sentences in the cover letter. " +
    "Avoid contractions. Appropriate for finance, law, consulting, or enterprise roles.",
  "Casual / Startup":
    "Write in a direct, first-person, conversational tone. Contractions are fine. " +
    "The cover letter should read like a smart, confident person talking — not a template. " +
    "Appropriate for tech startups, creative agencies, or growth-stage companies.",
  "Graduate / Trainee":
    "Write for a graduate or trainee programme (e.g. Siemens SGP, Deutsche Börse). " +
    "Blend the technical engineering foundation with an entrepreneurial, business-focused mindset. " +
    "Highlight collaborating with product managers, translating ambiguous requirements into scalable " +
    "services, and thriving in highly international environments.",
};

// Default cover letter template (fallback when the user has not supplied one).
// Sender placeholders ({YOUR_*}) are filled from the master document; set a
// custom template in Settings to override the layout.
export const DEFAULT_COVER_LETTER_TEMPLATE =
  "{YOUR_NAME}\n{YOUR_ADDRESS}\n{YOUR_EMAIL}\n{YOUR_PHONE}\n\n{COMPANY_NAME}\n" +
  "{YOUR_CITY}, {DATE}\n\n{SUBJECT_LINE}\n\nDear {HIRING_MANAGER},\n\n{PARAGRAPH_1}\n\n" +
  "{PARAGRAPH_2}\n\n{PARAGRAPH_3}\n\n{PARAGRAPH_4}\n\nSincerely,\n{YOUR_NAME}";
