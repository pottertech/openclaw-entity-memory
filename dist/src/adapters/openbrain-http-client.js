export class OpenBrainHttpEntityMemoryClient {
    baseUrl;
    apiKey;
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }
    async hybridQuery(input) {
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
            throw new Error(`entity-memory hybrid query failed: ${response.status} ${text}`);
        }
        return (await response.json());
    }
}
