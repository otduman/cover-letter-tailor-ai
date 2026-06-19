// LangChain call: generate the cover letter from the system + user prompts.
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MODEL_NAME } from "../config";

export async function generateLetter(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<string> {
  const model = new ChatGoogleGenerativeAI({
    apiKey,
    model: MODEL_NAME,
    temperature: 0.7,
    maxOutputTokens: 4096,
  });

  const response = await model.invoke([
    ["system", systemPrompt],
    ["human", userPrompt],
  ]);

  const content = response.content;
  return typeof content === "string" ? content : JSON.stringify(content);
}
