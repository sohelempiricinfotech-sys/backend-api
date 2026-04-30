export enum AIProvider {
  OPENAI = "openai",
  CLAUDE = "claude",
}

export interface AIRequestInput {
  prompt: string;
  provider?: AIProvider;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  success: boolean;
  content: string;
  provider: AIProvider;
  model: string;
}
