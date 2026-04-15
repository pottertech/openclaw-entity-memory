import { OpenBrainHttpEntityMemoryClient } from "./openbrain-http-client.js";
export function createOpenBrainEntityMemoryPackage(input) {
    const client = new OpenBrainHttpEntityMemoryClient(input.baseUrl, input.apiKey);
    return {
        client,
        query: (request) => client.hybridQuery(request),
    };
}
