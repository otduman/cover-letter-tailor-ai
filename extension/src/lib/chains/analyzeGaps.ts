// Semantic skill-gap analysis: extract the job's required skills AND decide which
// the candidate genuinely lacks — in one Gemini call. Replaces the old brittle
// substring match (which flagged "RESTful APIs" as missing when the doc said "REST").
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { MODEL_NAME } from "../config";

const GapSchema = z.object({
  missing: z
    .array(z.string())
    .describe(
      "Required hard skills/technologies the candidate has NO evidence for in the " +
        "master document. Empty if the candidate covers everything required."
    ),
});

export async function analyzeGaps(
  jobDescription: string,
  masterDocText: string,
  apiKey: string
): Promise<string[]> {
  const model = new ChatGoogleGenerativeAI({
    apiKey,
    model: MODEL_NAME,
    temperature: 0.1,
  });
  const structured = model.withStructuredOutput(GapSchema, { name: "gaps" });

  const result = await structured.invoke(
    "You compare a job's REQUIRED hard skills against a candidate's master document.\n" +
      "Steps:\n" +
      "1. From the job description, list the concrete required technical skills/tools/technologies.\n" +
      "2. Return ONLY those the candidate has NO evidence for in the master document.\n" +
      "Rules:\n" +
      "- Treat equivalent or parent/child terms as PRESENT: e.g. 'REST' covers 'RESTful APIs'; " +
      "'Spring Boot' covers 'Spring'; 'PostgreSQL' covers 'SQL'; 'CI/CD' covers 'GitHub Actions'.\n" +
      "- Ignore soft skills, generic phrases, and nice-to-haves; only real, nameable technologies.\n" +
      "- If the candidate covers everything, return an empty list.\n\n" +
      `## Job Description\n${jobDescription}\n\n## Candidate Master Document\n${masterDocText}`
  );

  return result.missing.map((s) => s.trim()).filter(Boolean);
}
