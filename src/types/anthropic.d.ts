declare module '@anthropic-ai/sdk' {
  export interface MessageContent {
    type: 'text';
    text: string;
  }

  export interface Message {
    id: string;
    type: string;
    role: string;
    content: MessageContent[];
    model: string;
    stop_reason: string | null;
    stop_sequence: string | null;
    usage: {
      input_tokens: number;
      output_tokens: number;
    };
  }

  export interface AnthropicResponse {
    id: string;
    type: string;
    role: string;
    content: MessageContent[];
    model: string;
    stop_reason: string | null;
    stop_sequence: string | null;
    usage: {
      input_tokens: number;
      output_tokens: number;
    };
  }

  export class Anthropic {
    constructor(options: { apiKey: string });
    messages: {
      create(params: {
        model: string;
        max_tokens: number;
        messages: Array<{
          role: string;
          content: string;
        }>;
        system?: string;
      }): Promise<Message>;
    };
  }
}