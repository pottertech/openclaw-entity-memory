import type {
  OpenBrainEntityMemoryClient,
  OpenBrainHybridQueryRequest,
  OpenBrainHybridQueryResponse,
} from "./openbrain-contract.js";

export class OpenBrainHttpEntityMemoryClient implements OpenBrainEntityMemoryClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string,
  ) {}

  async hybridQuery(
    input: OpenBrainHybridQueryRequest,
  ): Promise<OpenBrainHybridQueryResponse> {
    const response = await fetch(`${this.baseUrl}/v1/query/hybrid`, {
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
        `entity-memory hybrid query failed: ${response.status} ${text}`,
      );
    }

    return (await response.json()) as OpenBrainHybridQueryResponse;
  }
}