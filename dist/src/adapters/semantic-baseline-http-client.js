export class SemanticBaselineHttpClient {
    baseUrl;
    apiKey;
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }
    async query(input) {
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
            throw new Error(`semantic baseline query failed: ${response.status} ${text}`);
        }
        return (await response.json());
    }
}
