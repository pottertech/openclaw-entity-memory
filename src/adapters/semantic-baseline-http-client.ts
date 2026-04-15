import type {
  SemanticBaselineClient,
  SemanticBaselineQueryRequest,
  SemanticBaselineQueryResponse,
} from "./semantic-baseline-contract.js";

export class SemanticBaselineHttpClient implements SemanticBaselineClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string,
  ) {}

  async query(
    input: SemanticBaselineQueryRequest,
  ): Promise<SemanticBaselineQueryResponse> {
    const response = await fetch(`${this.baseUrl}/v1/semantic/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `semantic baseline query failed: ${response.status} ${text}`,
      );
    }

    return (await response.json()) as SemanticBaselineQueryResponse;
  }
}