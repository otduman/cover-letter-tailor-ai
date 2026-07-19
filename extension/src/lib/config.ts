// Ported from the Python config.py — the project's core domain constants.

export const MODEL_NAME = "gemini-2.5-flash"; // skill-gap analysis (cheap step)
// Letter writing — Pro writes noticeably better prose. (The earlier Pro "stall"
// was our old 1100-token output cap: Pro's hidden thinking tokens consumed it.)
// Overridable per-user in Settings.
export const GENERATION_MODEL = "gemini-2.5-pro";

// Focused list of the AI-filler words that actually show up in cover letters.
export const BANNED_BUZZWORDS: string[] = [
  "delve",
  "synergy",
  "leverage", "leveraging", "leveraged",
  "robust",
  "seamless", "seamlessly",
  "spearheaded",
  "cutting-edge",
  "innovative", "innovation",
  "utilize", "utilizing", "utilized",
  "impactful",
  "transformative",
  "dynamic",
  "passionate", "passion",
  "results-driven",
  "detail-oriented",
  "proficient",
  "I am writing to express",
];

export type Language = "English" | "German";

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
  "{YOUR_NAME}\n{YOUR_STREET}\n{YOUR_POSTAL_CITY}\n{YOUR_EMAIL}\n{YOUR_PHONE}\n\n{COMPANY_NAME}\n" +
  "{YOUR_CITY}, {DATE}\n\n{SUBJECT_LINE}\n\nDear {HIRING_MANAGER},\n\n{PARAGRAPH_1}\n\n" +
  "{PARAGRAPH_2}\n\n{PARAGRAPH_3}\n\n{PARAGRAPH_4}\n\nSincerely,\n{YOUR_NAME}";

// German variant — standard Anschreiben conventions. {SALUTATION} lets the
// model address a named team/contact when the ad provides one.
export const DEFAULT_COVER_LETTER_TEMPLATE_DE =
  "{YOUR_NAME}\n{YOUR_STREET}\n{YOUR_POSTAL_CITY}\n{YOUR_EMAIL}\n{YOUR_PHONE}\n\n{COMPANY_NAME}\n" +
  "{YOUR_CITY}, {DATE}\n\n{SUBJECT_LINE}\n\n{SALUTATION}\n\n{PARAGRAPH_1}\n\n" +
  "{PARAGRAPH_2}\n\n{PARAGRAPH_3}\n\n{PARAGRAPH_4}\n\nMit freundlichen Grüßen\n{YOUR_NAME}";
