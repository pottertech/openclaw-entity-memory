import type {
  OpenBrainEntityMemoryClient,
  OpenBrainHybridQueryRequest,
  OpenBrainHybridQueryResponse,
} from "./openbrain-contract.js";
import { OpenBrainHttpEntityMemoryClient } from "./openbrain-http-client.js";

export type OpenBrainEntityMemoryPackage = {
  client: OpenBrainEntityMemoryClient;
  query: (
    input: OpenBrainHybridQueryRequest,
  ) => Promise<OpenBrainHybridQueryResponse>;
};

export function createOpenBrainEntityMemoryPackage(input: {
  baseUrl: string;
  apiKey?: string;
}): OpenBrainEntityMemoryPackage {
  const client = new OpenBrainHttpEntityMemoryClient(
    input.baseUrl,
    input.apiKey,
  );

  return {
    client,
    query: (request) => client.hybridQuery(request),
  };
}