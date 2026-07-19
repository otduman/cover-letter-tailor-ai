// LangChain call: generate the cover letter from the system + user prompts.
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GENERATION_MODEL } from "../config";

export async function generateLetter(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  model?: string
): Promise<string> {
  const llm = new ChatGoogleGenerativeAI({
    apiKey,
    model: model?.trim() || GENERATION_MODEL,
    temperature: 0.7,
    // Generous ceiling: Gemini 2.5 models spend hidden "thinking" tokens against
    // this budget — Pro especially. A low cap silently truncates or stalls the
    // letter. One-page length is enforced by the prompt, not by this limit.
    maxOutputTokens: 16384,
  });

  const response = await llm.invoke([
    ["system", systemPrompt],
    ["human", userPrompt],
  ]);

  const content = response.content;
  return typeof content === "string" ? content : JSON.stringify(content);
}
