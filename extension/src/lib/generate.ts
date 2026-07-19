// End-to-end cover letter generation, orchestrating the ported core logic.
// (Mirrors the generation block from the old Streamlit app.py.)
import { getSettings } from "./storage";
import { analyzeGaps } from "./chains/analyzeGaps";
import { generateLetter, reviseLetterLength } from "./chains/generateLetter";
import { detectBuzzwords } from "./buzzwords";
import { measurePageFill } from "./pageFit";
import { buildSystemPrompt, buildUserPrompt } from "./promptBuilder";
import type { ToneKey, Language } from "./config";

export interface GenerateInput {
  jobTitle: string;
  company: string;
  jobDescription: string;
  tone: ToneKey;
  language: Language;
}

export interface GenerateResult {
  letter: string;
  gaps: string[];
  buzzwordHits: string[];
  /** Fraction of one A4 page the letter fills (1.0 = exactly full). */
  pageFill: number;
}

// Acceptable page-fill band: "on the verge" of one page without spilling over.
const MIN_FILL = 0.88;
const MAX_FILL = 1.0;
const TARGET_FILL = 0.95;

export async function generateCoverLetter(input: GenerateInput): Promise<GenerateResult> {
  const settings = await getSettings();
  if (!settings.geminiApiKey) throw new Error("Add your Gemini API key in Settings.");
  if (!settings.masterDocText) {
    throw new Error("Load your master career document in Settings first.");
  }

  const gaps = await analyzeGaps(
    input.jobDescription,
    settings.masterDocText,
    settings.geminiApiKey
  );

  const systemPrompt = buildSystemPrompt(input.tone, input.language);
  const userPrompt = buildUserPrompt({
    jobTitle: input.jobTitle,
    company: input.company,
    jobDescription: input.jobDescription,
    masterDocText: settings.masterDocText,
    coverLetterTemplate: settings.coverLetterTemplate,
    gaps,
    language: input.language,
  });

  const raw = await generateLetter(
    systemPrompt,
    userPrompt,
    settings.geminiApiKey,
    settings.generationModel
  );
  let letter = cleanOutput(raw);
  let fill = measurePageFill(letter);

  // Page-fit loop: up to two corrective passes to land inside the band.
  // Only the body paragraphs are ever sent for revision — header, salutation,
  // and closing are frozen here and reassembled verbatim. If the letter can't
  // be split (unexpected structure), we skip correction rather than risk it.
  let parts = splitLetter(letter);
  for (let i = 0; i < 2 && parts && (fill < MIN_FILL || fill > MAX_FILL); i++) {
    const words = letter.split(/\s+/).length;
    const wordsPerFullPage = words / fill;
    const deltaWords = Math.round((TARGET_FILL - fill) * wordsPerFullPage);
    if (Math.abs(deltaWords) < 15) break; // not worth a round-trip

    const revisedBody = cleanOutput(
      await reviseLetterLength(
        systemPrompt,
        parts.body,
        fill,
        deltaWords,
        settings.geminiApiKey,
        settings.generationModel
      )
    );
    const candidate = `${parts.head}\n\n${revisedBody}\n\n${parts.tail}`;
    const candidateFill = measurePageFill(candidate);
    // Keep the revision only if it actually lands closer to the target.
    if (Math.abs(candidateFill - TARGET_FILL) < Math.abs(fill - TARGET_FILL)) {
      letter = candidate;
      fill = candidateFill;
      parts = { ...parts, body: revisedBody };
    } else {
      break;
    }
  }

  const buzzwordHits = detectBuzzwords(letter); // check the FINAL letter, not raw

  return { letter, gaps, buzzwordHits, pageFill: fill };
}

// Deterministic backstop: the model keeps echoing these AI-filler words from the
// job ad even when told not to. Swap them for plain synonyms after generation.
const BANNED_SWAPS: [RegExp, string][] = [
  [/\bleveraging\b/gi, "using"],
  [/\bleveraged\b/gi, "used"],
  [/\bleverage\b/gi, "use"],
  [/\butilizing\b/gi, "using"],
  [/\butilizes\b/gi, "uses"],
  [/\butilized\b/gi, "used"],
  [/\butilize\b/gi, "use"],
  [/\binnovative\b/gi, "new"],
  [/\binnovation\b/gi, "progress"],
  [/\bimpactful\b/gi, "meaningful"],
  [/\brobust\b/gi, "reliable"],
  [/\bseamlessly\b/gi, "smoothly"],
  [/\bseamless\b/gi, "smooth"],
  [/\bcutting-edge\b/gi, "advanced"],
  [/\btransformative\b/gi, "major"],
  [/\bspearheaded\b/gi, "led"],
  [/\bproficient\b/gi, "experienced"],
  [/\bdynamic\b/gi, "fast-moving"],
  [/\bdelve\b/gi, "examine"],
  [/\bpassionate\b/gi, "committed"],
  [/\bpassion\b/gi, "enthusiasm"],
];

function preserveCase(match: string, replacement: string): string {
  return match[0] === match[0].toUpperCase()
    ? replacement[0].toUpperCase() + replacement.slice(1)
    : replacement;
}

interface LetterParts {
  head: string; // everything through the salutation line (address block, date, subject)
  body: string; // the four paragraphs — the only part revision may touch
  tail: string; // closing ("Sincerely," / "Mit freundlichen Grüßen") through signature
}

/** Split the letter around its body so header/closing can be frozen. */
function splitLetter(letter: string): LetterParts | null {
  const sal = letter.match(/^(Dear .*|Sehr geehrte.*)$/m);
  if (!sal || sal.index === undefined) return null;
  const headEnd = sal.index + sal[0].length;

  const close = letter.match(/^(Sincerely,?|Mit freundlichen Grüßen,?)\s*$/m);
  if (!close || close.index === undefined || close.index <= headEnd) return null;

  return {
    head: letter.slice(0, headEnd),
    body: letter.slice(headEnd, close.index).trim(),
    tail: letter.slice(close.index).trim(),
  };
}

/** Strip markdown fences, unfilled placeholders, and AI-filler words. */
function cleanOutput(raw: string): string {
  let out = raw.trim();
  if (out.includes("--- COVER LETTER ---")) {
    out = out.split("--- COVER LETTER ---")[1].trim();
  }
  if (out.startsWith("```")) {
    out = out
      .split("\n")
      .filter((line) => !line.trim().startsWith("```"))
      .join("\n")
      .trim();
  }
  // Remove any placeholder the model failed to fill (e.g. a literal {YOUR_CITY}).
  out = out.replace(/\{YOUR_CITY\},\s*/g, "").replace(/\{[A-Z_]+\}/g, "");
  // Swap filler words the model echoes despite instructions.
  for (const [re, rep] of BANNED_SWAPS) {
    out = out.replace(re, (m) => preserveCase(m, rep));
  }
  // Tidy whitespace.
  out = out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return out;
}
