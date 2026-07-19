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
      ? "Write the ENTIRE letter in clear, natural, professional business German (solid B2–C1 level) — direct and concrete, not overly literary or flowery. Follow standard German business-letter conventions, including starting the first sentence after the salutation in lowercase where grammatically correct."
      : "Write the entire letter in natural, professional English.";

  return `You are an expert career writer. Write exactly ONE tailored cover letter for this job, about one page long.

GROUND TRUTH (critical):
- Use ONLY facts from the Master Document — never invent or exaggerate skills, metrics, dates, projects, or companies.
- Do not mention any skill listed as missing in the Skill Gap Notice.
- Keep every metric and achievement attached to the exact project it belongs to.
- Respect the dates in the Master Document: describe degrees and roles whose dates have ended as COMPLETED — never as "current", "ongoing", or in progress.

VOICE:
- Confident, clear, concise, human — no clichés, no corporate filler.
- Do NOT open with "I am writing to express…" or similar; start with a real hook.
- Never use "proficient" (say "hands-on experience with", "built", "engineered"). Avoid these filler words, including when echoing the company's own marketing: ${banned}.
- Complement the CV — select and frame a few strong, relevant points; never restate it line by line or dump every metric.

LENGTH: fill about one page — roughly 350–430 words across four paragraphs. Never exceed one page.

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
- {HIRING_MANAGER} / {SALUTATION}: if the job description names a specific team or contact person, address them (e.g. "Dear Recruiting Team," / "Sehr geehrtes Recruiting-Team,"); otherwise use "Hiring Manager" / "Sehr geehrte Damen und Herren,". For {SALUTATION}, output the full salutation line including the comma.

${template}

## Structural Blueprint
- SUBJECT_LINE (mandatory): ${subjectInstruction}. It MUST appear on its own line BETWEEN the date and the salutation — never after the salutation. One line only, no markdown, no bold markers. Never omit it.

Write exactly 4 paragraphs. Two hard rules for the body:
1. Anchor EVERY body paragraph to a real requirement or phrase from THIS job description — the reader must feel the letter was written for this ad.
2. Spread the evidence: use 2–3 DIFFERENT projects across the letter. Never build the whole letter around one project, and never spend a paragraph enumerating one project's implementation details — name technologies briefly in passing and spend the words on what the work demonstrates.

- PARAGRAPH_1 (Hook & Alignment): Name the role. Connect the applicant's degree and strongest relevant foundation to something SPECIFIC this company/role offers or builds (the team, the program structure, the product, the domain — pick it from the ad). 2–4 sentences.
- PARAGRAPH_2 (Primary technical fit): Take the job's MOST important technical requirement and prove it with the 1–2 projects from the Master Document that genuinely match it. Focus on what the work demonstrates for THAT requirement (e.g. scalable data pipelines, clean testable code, software quality). 3–5 sentences.
- PARAGRAPH_3 (Second angle): Take a DIFFERENT requirement or cultural trait from the ad (e.g. eagerness to learn new technologies, teamwork, product thinking) and prove it with a DIFFERENT project than paragraph 2, plus one short clause on the internship experience. 3–4 sentences.
- PARAGRAPH_4 (Fit & close): Language levels exactly as stated in the Master Document, international readiness if relevant to the ad, and a confident, forward-looking close. 2–3 sentences.

Write like a sharp, real person: selective, concrete, tied to this specific ad — never a template filler that dumps the whole CV.`;
}
