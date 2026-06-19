// LangChain chain: extract required skills from a job description as structured
// JSON (replaces the regex-fallback approach from the Python skill_matcher).
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { MODEL_NAME } from "../config";

const SkillsSchema = z.object({
  skills: z
    .array(z.string())
    .describe(
      "Specific technical skills, tools, programming languages, frameworks, " +
        "methodologies, certifications, and domain knowledge required or preferred."
    ),
});

export async function extractSkills(
  jobDescription: string,
  apiKey: string
): Promise<string[]> {
  const model = new ChatGoogleGenerativeAI({
    apiKey,
    model: MODEL_NAME,
    temperature: 0.1,
  });

  const structured = model.withStructuredOutput(SkillsSchema, { name: "skills" });

  const result = await structured.invoke(
    "Extract the specific technical skills, tools, programming languages, " +
      "methodologies, frameworks, certifications, and domain knowledge required " +
      "or preferred in this job description.\n\n" +
      `Job Description:\n${jobDescription}`
  );

  return result.skills.map((s) => s.trim()).filter(Boolean);
}
