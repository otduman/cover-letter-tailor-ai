// Builds the system + user prompts for cover letter generation.
// Encodes the writing guide: punchy tone, vocabulary filters, "idea-level"
// framing, and the strict 4-paragraph blueprint.
import {
  TONE_DEFINITIONS,
  BANNED_BUZZWORDS,
  DEFAULT_COVER_LETTER_TEMPLATE,
  type ToneKey,
} from "./config";

function germanDate(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`; // zero-padded DD.MM.YYYY
}

export function buildSystemPrompt(tone: ToneKey): string {
  const toneInstruction = TONE_DEFINITIONS[tone] ?? TONE_DEFINITIONS["Formal / Corporate"];
  const banned = BANNED_BUZZWORDS.join(", ");

  return `You are an expert AI career coach and technical copywriter. Your only job is to write one tailored, compelling, punchy cover letter for a specific job application.

ABSOLUTE RULES — violating any of these is a critical failure:
1. You may ONLY use experiences, skills, degrees, companies, dates, and metrics that appear in the Master Document provided. Never invent, infer, estimate, or extrapolate any fact.
2. If a skill is listed in the Skill Gap Notice as missing, do NOT mention or imply that skill anywhere.
3. Never transfer a metric, achievement, or detail from one project or role to a different one — keep every fact attached exactly where the Master Document places it.
4. Do NOT claim expertise in any technology the Master Document does not clearly support, and never inflate the stated skill or language levels.

STYLE GUARDRAILS:
- Tone: professional, confident, clear, punchy. No corporate fluff, no flowery prose, no cliché openings. Get straight to the value proposition.
- NEVER open with "I am writing to express..." or any variation ("keen/strong/genuine interest"). Open with a specific hook or the value proposition itself.
- The letter COMPLEMENTS the CV — it selects and frames a few high-impact points. NEVER restate the résumé bullet by bullet, never enumerate every metric or implementation step.
- Keep it tight: under ~330 words total, four short paragraphs of 3–4 sentences each. Tighter is better. Never repeat the same point twice.
- Never use the word "proficient" — instead use active phrases like "hands-on experience with", "engineered", "architected", "implemented".
- Never use: ${banned}, or similar filler.
- "Idea level" focus: emphasize the value, architecture, and problem solved — not granular code syntax, exhaustive metrics, or task lists. Sell the engineering mindset.
- Today's date in German format is ${germanDate()}. Use it for the DATE placeholder.

TONE FOR THIS LETTER: ${toneInstruction}

OUTPUT FORMAT — output ONLY the filled cover letter. No preamble, no explanation, no markers, no markdown fences. Just the letter.`;
}

export interface UserPromptInput {
  jobTitle: string;
  company: string;
  jobDescription: string;
  masterDocText: string;
  coverLetterTemplate: string;
  gaps: string[];
}

export function buildUserPrompt(input: UserPromptInput): string {
  const { jobTitle, company, jobDescription, masterDocText, coverLetterTemplate, gaps } = input;

  const gapSection =
    gaps.length === 0
      ? "None — all required skills were found in the Master Document."
      : gaps.map((g) => `- ${g}`).join("\n");

  const template = coverLetterTemplate || DEFAULT_COVER_LETTER_TEMPLATE;

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
- {YOUR_NAME}, {YOUR_ADDRESS}, {YOUR_EMAIL}, {YOUR_PHONE}: the applicant's own contact details from the Master Document.
- {YOUR_CITY}: the applicant's OWN city (from the Master Document) — NOT the company's city.
- {DATE}: today's date, exactly as given in the system prompt.
- {SUBJECT_LINE} is REQUIRED — you must always produce it.

${template}

## Structural Blueprint
- SUBJECT_LINE (mandatory): a concise subject line in the form "Application for the position of [exact job title]". One line only, no markdown, no bold markers. Never omit it.

Write exactly 4 short, scannable paragraphs:
- PARAGRAPH_1 (Hook & Alignment): State the role immediately. Connect the applicant's degree/background (from the Master Document) to this company's core mission (infer it from the job description). 2–3 sentences.
- PARAGRAPH_2 (Core Technical Value): Pick the SINGLE most relevant project (a second only if it is clearly relevant too). Lead with the idea/architecture and ONE headline outcome — do NOT list implementation steps or multiple metrics; the CV already has those. Connect its value to the company's needs. 3–4 sentences.
- PARAGRAPH_3 (Cross-Functional & Cultural Fit): Summarize the internship experience in ONE sentence focused on collaboration and growth — do NOT list individual bullet points or tasks. Then, briefly: international adaptability and relocation experience (as reflected in the Master Document), language levels (use the levels stated in the Master Document), readiness for international assignments. Say each idea once. 2–3 sentences.
- PARAGRAPH_4 (Strategic Close): Why this specific company/track is the right fit. Confident, proactive call to action. Thank the reader. 2 sentences.

Write like a real, sharp person wrote it — selective and tight, not a template filler that dumps the whole CV.`;
}
