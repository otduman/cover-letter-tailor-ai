// End-to-end cover letter generation, orchestrating the ported core logic.
// (Mirrors the generation block from the old Streamlit app.py.)
import { getSettings } from "./storage";
import { extractSkills } from "./chains/extractSkills";
import { generateLetter } from "./chains/generateLetter";
import { findGaps } from "./skillGaps";
import { detectBuzzwords } from "./buzzwords";
import { buildSystemPrompt, buildUserPrompt } from "./promptBuilder";
import type { ToneKey } from "./config";

export interface GenerateInput {
  jobTitle: string;
  company: string;
  jobDescription: string;
  tone: ToneKey;
}

export interface GenerateResult {
  letter: string;
  gaps: string[];
  buzzwordHits: string[];
}

export async function generateCoverLetter(input: GenerateInput): Promise<GenerateResult> {
  const settings = await getSettings();
  if (!settings.geminiApiKey) throw new Error("Add your Gemini API key in Settings.");
  if (!settings.masterDocText) {
    throw new Error("Load your master career document in Settings first.");
  }

  const requiredSkills = await extractSkills(input.jobDescription, settings.geminiApiKey);
  const gaps = findGaps(requiredSkills, settings.masterDocText);

  const systemPrompt = buildSystemPrompt(input.tone);
  const userPrompt = buildUserPrompt({
    jobTitle: input.jobTitle,
    company: input.company,
    jobDescription: input.jobDescription,
    masterDocText: settings.masterDocText,
    coverLetterTemplate: settings.coverLetterTemplate,
    gaps,
  });

  const raw = await generateLetter(systemPrompt, userPrompt, settings.geminiApiKey);
  const letter = cleanOutput(raw);
  const buzzwordHits = detectBuzzwords(raw);

  return { letter, gaps, buzzwordHits };
}

/** Strip stray markdown fences / section markers the model may emit. */
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
  return out;
}
