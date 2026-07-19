// LangChain call: generate the cover letter from the system + user prompts.
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GENERATION_MODEL } from "../config";

function makeLlm(apiKey: string, model?: string): ChatGoogleGenerativeAI {
  return new ChatGoogleGenerativeAI({
    apiKey,
    model: model?.trim() || GENERATION_MODEL,
    temperature: 0.7,
    // Generous ceiling: Gemini 2.5 models spend hidden "thinking" tokens against
    // this budget — Pro especially. A low cap silently truncates or stalls the
    // letter. One-page length is enforced by the prompt, not by this limit.
    maxOutputTokens: 16384,
  });
}

function asText(content: unknown): string {
  return typeof content === "string" ? content : JSON.stringify(content);
}

export async function generateLetter(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  model?: string
): Promise<string> {
  const response = await makeLlm(apiKey, model).invoke([
    ["system", systemPrompt],
    ["human", userPrompt],
  ]);
  return asText(response.content);
}

/**
 * Length-correction pass. Receives ONLY the body paragraphs — the header,
 * salutation, and closing are frozen in code and reassembled afterwards, so
 * the model physically cannot alter the address block or signature.
 */
export async function reviseLetterLength(
  systemPrompt: string,
  bodyParagraphs: string,
  fillPercent: number,
  deltaWords: number,
  apiKey: string,
  model?: string
): Promise<string> {
  const direction =
    deltaWords >= 0
      ? `EXPAND them by about ${deltaWords} words: deepen paragraphs 2 and 3 with reasoning and connection to the role — never padding, repetition, or new CV facts`
      : `TRIM them by about ${-deltaWords} words: cut the least essential detail`;

  const response = await makeLlm(apiKey, model).invoke([
    ["system", systemPrompt],
    [
      "human",
      `Here are the body paragraphs of the cover letter you wrote:\n\n${bodyParagraphs}\n\n` +
        `The full letter currently fills about ${Math.round(fillPercent * 100)}% of one A4 page ` +
        `(Calibri 11pt). ${direction}. Keep every fact and every style rule. ` +
        `Output ONLY the revised body paragraphs — no header, no salutation, no closing, no commentary.`,
    ],
  ]);
  return asText(response.content);
}
