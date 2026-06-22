// Builds the system + user prompts for cover letter generation.
// Encodes the writing guide: punchy tone, vocabulary filters, "idea-level"
// framing, and the strict 4-paragraph blueprint.
import {
  TONE_DEFINITIONS,
  BANNED_BUZZWORDS,
  DEFAULT_COVER_LETTER_TEMPLATE,
  DEFAULT_COVER_LETTER_TEMPLATE_DE,
  type ToneKey,
  type Language,
} from "./config";

function germanDate(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`; // zero-padded DD.MM.YYYY
}

export function buildSystemPrompt(tone: ToneKey, language: Language): string {
  const toneInstruction = TONE_DEFINITIONS[tone] ?? TONE_DEFINITIONS["Formal / Corporate"];
  const banned = BANNED_BUZZWORDS.join(", ");
  const languageInstruction =
    language === "German"
      ? "Write the ENTIRE letter in German. Use clear, correct, natural B2 / upper-intermediate German — straightforward and professional. Do NOT write flowery, idiomatic, or native-level-sophisticated German; it must read believably as written by a competent B2 speaker. Follow standard German business-letter conventions."
      : "Write the entire letter in natural, professional English.";

  return `You are an expert career writer. Write exactly ONE tailored cover letter for this job, about one page long.

GROUND TRUTH (critical):
- Use ONLY facts from the Master Document — never invent or exaggerate skills, metrics, dates, projects, or companies.
- Do not mention any skill listed as missing in the Skill Gap Notice.
- Keep every metric and achievement attached to the exact project it belongs to.

VOICE:
- Confident, clear, concise, human — no clichés, no corporate filler.
- Do NOT open with "I am writing to express…" or similar; start with a real hook.
- Never use "proficient" (say "hands-on experience with", "built", "engineered"). Avoid these filler words, including when echoing the company's own marketing: ${banned}.
- Complement the CV — select and frame a few strong, relevant points; never restate it line by line or dump every metric.

LENGTH: fill about one page — roughly 380–440 words across four paragraphs. Never exceed one page.

LANGUAGE: ${languageInstruction}
TONE: ${toneInstruction}
Today's date (use for {DATE}): ${germanDate()}

Output ONLY the finished letter — no preamble, notes, or markdown.`;
}

export interface UserPromptInput {
  jobTitle: string;
  company: string;
  jobDescription: string;
  masterDocText: string;
  coverLetterTemplate: string;
  gaps: string[];
  language: Language;
}

export function buildUserPrompt(input: UserPromptInput): string {
  const { jobTitle, company, jobDescription, masterDocText, coverLetterTemplate, gaps, language } =
    input;

  const gapSection =
    gaps.length === 0
      ? "None — all required skills were found in the Master Document."
      : gaps.map((g) => `- ${g}`).join("\n");

  const defaultTemplate =
    language === "German" ? DEFAULT_COVER_LETTER_TEMPLATE_DE : DEFAULT_COVER_LETTER_TEMPLATE;
  const template = coverLetterTemplate || defaultTemplate;

  const subjectInstruction =
    language === "German"
      ? 'a concise German subject line, e.g. "Bewerbung als [exakte Positionsbezeichnung]"'
      : 'a concise subject line in the form "Application for the position of [exact job title]"';

  return `## Target Role
Job Title: ${jobTitle}
Company: ${company}

## Job Description
${jobDescription}

## Master Document (Source of Truth — use ONLY this content)
${masterDocText}

## Skill Gap Notice
The following skills were found in the job description but are NOT in the Master Document.
Do NOT mention, imply, or hint at these:
${gapSection}

## Cover Letter Template
Fill in EVERY {PLACEHOLDER} token — never leave one out, never delete one. Preserve ALL static text and spacing. Replace ONLY the placeholders.
- {YOUR_NAME}, {YOUR_EMAIL}, {YOUR_PHONE}: the applicant's own contact details from the Master Document.
- {YOUR_STREET}: the street and house number only (e.g. "Example Street 12").
- {YOUR_POSTAL_CITY}: postal code, city, and country on this separate line (e.g. "12345 City, Country").
- {YOUR_CITY}: the applicant's OWN city name only, for the date line — NOT the company's city.
- {DATE}: today's date, exactly as given in the system prompt.
- {SUBJECT_LINE} is REQUIRED — you must always produce it.

${template}

## Structural Blueprint
- SUBJECT_LINE (mandatory): ${subjectInstruction}. It MUST appear on its own line BETWEEN the date and the salutation — never after the salutation. One line only, no markdown, no bold markers. Never omit it.

Write exactly 4 short, scannable paragraphs:
- PARAGRAPH_1 (Hook & Alignment): State the role immediately. Connect the applicant's degree/background (from the Master Document) to this company's core mission (infer it from the job description). 3–4 sentences.
- PARAGRAPH_2 (Core Technical Value): Choose the project from the Master Document whose DOMAIN and TECH STACK best match THIS specific job — do NOT default to the same project every time. Match deliberately: an AI/platform role → the AI agent project; a data/streaming role → the data pipeline; a quality/tooling role → the automated-repair work; a geospatial/algorithmic role → the geospatial project; etc. Pick the SINGLE best fit (a second only if clearly relevant). Lead with the idea/architecture and ONE headline outcome — do NOT list implementation steps or multiple metrics; the CV already has those. Connect its value to the company's needs. 4–5 sentences.
- PARAGRAPH_3 (Cross-Functional & Cultural Fit): Summarize the internship experience in ONE sentence focused on collaboration and growth — do NOT list individual bullet points or tasks. Then, briefly: international adaptability and relocation experience (as reflected in the Master Document), language levels (use the levels stated in the Master Document), readiness for international assignments. Say each idea once. 3–4 sentences.
- PARAGRAPH_4 (Strategic Close): Why this specific company/track is the right fit. Confident, proactive call to action. Thank the reader. 2–3 sentences.

Write like a real, sharp person wrote it — selective and tight, not a template filler that dumps the whole CV.`;
}
