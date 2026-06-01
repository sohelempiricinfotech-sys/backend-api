import { AIProvider, AIRequestInput, AIResponse } from "./ai.type";

const DEFAULT_PROVIDER = AIProvider.OPENAI;
const DEFAULT_OPENAI_MODEL = "gpt-4.1-nano";
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-20250514";
const EXTERNAL_AI_REQUEST_BUDGET_MS = 8000;

const callOpenAI = async (
  prompt: string,
  model: string,
  maxTokens: number,
  temperature: number
): Promise<AIResponse> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, content: "OPENAI_API_KEY is not configured", provider: AIProvider.OPENAI, model };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "x-client-timeout-ms": String(EXTERNAL_AI_REQUEST_BUDGET_MS),
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return { success: false, content: `OpenAI API error: ${error}`, provider: AIProvider.OPENAI, model };
  }

  const data = await response.json();
  return {
    success: true,
    content: data.choices[0]?.message?.content || "",
    provider: AIProvider.OPENAI,
    model,
  };
};

const callClaude = async (
  prompt: string,
  model: string,
  maxTokens: number,
  temperature: number
): Promise<AIResponse> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { success: false, content: "ANTHROPIC_API_KEY is not configured", provider: AIProvider.CLAUDE, model };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "x-client-timeout-ms": String(EXTERNAL_AI_REQUEST_BUDGET_MS),
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return { success: false, content: `Claude API error: ${error}`, provider: AIProvider.CLAUDE, model };
  }

  const data = await response.json();
  const textBlock = data.content?.find((block: any) => block.type === "text");
  return {
    success: true,
    content: textBlock?.text || "",
    provider: AIProvider.CLAUDE,
    model,
  };
};

export const getAIResponse = async (input: AIRequestInput): Promise<AIResponse> => {
  const {
    prompt,
    provider = DEFAULT_PROVIDER,
    maxTokens = 1024,
    temperature = 0.7,
  } = input;

  const model = input.model || (provider === AIProvider.CLAUDE ? DEFAULT_CLAUDE_MODEL : DEFAULT_OPENAI_MODEL);

  switch (provider) {
    case AIProvider.OPENAI:
      return callOpenAI(prompt, model, maxTokens, temperature);

    case AIProvider.CLAUDE:
      return callClaude(prompt, model, maxTokens, temperature);

    default:
      return { success: false, content: `Unknown provider: ${provider}`, provider, model };
  }
};
