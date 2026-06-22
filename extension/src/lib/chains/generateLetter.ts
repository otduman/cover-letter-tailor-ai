// LangChain call: generate the cover letter from the system + user prompts.
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GENERATION_MODEL } from "../config";

export async function generateLetter(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<string> {
  const model = new ChatGoogleGenerativeAI({
    apiKey,
    model: GENERATION_MODEL,
    temperature: 0.7,
    // Generous ceiling: Gemini 2.5 Flash spends hidden "thinking" tokens against
    // this budget, so a low cap truncates the letter (German runs longer). One-page
    // length is enforced by the prompt, not by this limit.
    maxOutputTokens: 8192,
  });

  const response = await model.invoke([
    ["system", systemPrompt],
    ["human", userPrompt],
  ]);

  const content = response.content;
  return typeof content === "string" ? content : JSON.stringify(content);
}
