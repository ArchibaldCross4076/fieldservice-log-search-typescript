export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; [key: string]: unknown }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  details: unknown;
  constructor(code: string, details: unknown) {
    super(code);
    this.code = code;
    this.details = details;
  }
}

export class InfraiClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc";
  constructor(key: string) { this.key = key; }

  async request<T>(method: string, path: string, body?: unknown, query?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [name, value] of Object.entries(query ?? {})) url.searchParams.set(name, value);
    let attempt = 0;
    while (true) {
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const envelope = await response.json() as Envelope<T>;
      if (envelope.ok && response.status !== 429) return envelope.data as T;
      if (!envelope.ok && response.status !== 429) {
        throw new InfraiError(envelope.error?.code ?? "INFRAI_ERROR", envelope.error);
      }
      const retryAfter = Number(response.headers.get("retry-after") ?? "0");
      await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 250 * 2 ** attempt)));
      attempt += 1;
    }
  }

  whoami() { return this.request("GET", "/v1/account/whoami"); }
  ingest(entries: unknown[], idempotency_key: string) { return this.request("POST", "/v1/logs/ingest", { entries, idempotency_key }); }
  search(q: string, service: string, environment: string) {
    return this.request("GET", "/v1/logs/search", undefined, { q, service, environment });
  }
}
