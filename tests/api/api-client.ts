export interface RequestOptions {
  method?: string;
  body?: unknown;
  expected?: number;
  csrf?: boolean;
  headers?: Record<string, string>;
}

export class ApiClient {
  readonly baseUrl: string;
  readonly cookies = new Map<string, string>();

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request(path: string, options: RequestOptions = {}): Promise<Response> {
    const method = options.method ?? "GET";
    const headers: Record<string, string> = {
      ...options.headers,
    };
    if (options.body !== undefined)
      headers["Content-Type"] = "application/json";
    if (this.cookies.size > 0) {
      headers.Cookie = [...this.cookies]
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");
    }
    if (
      options.csrf !== false &&
      !["GET", "HEAD", "OPTIONS"].includes(method)
    ) {
      const csrf = this.cookies.get("climbcrew_csrf");
      if (csrf) headers["X-CSRF-Token"] = csrf;
    }
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      ...(options.body === undefined
        ? {}
        : { body: JSON.stringify(options.body) }),
    });
    this.readCookies(response.headers.getSetCookie());
    const expected = options.expected ?? 200;
    if (response.status !== expected) {
      const detail = await response.text();
      throw new Error(
        `${method} ${path}: ${response.status}, attendu ${expected}: ${detail}`,
      );
    }
    return response;
  }

  private readCookies(values: string[]): void {
    for (const value of values) {
      const pair = value.split(";", 1)[0];
      if (!pair) continue;
      const separator = pair.indexOf("=");
      if (separator < 1) continue;
      const name = pair.slice(0, separator);
      const cookieValue = pair.slice(separator + 1);
      if (cookieValue) this.cookies.set(name, cookieValue);
      else this.cookies.delete(name);
    }
  }
}

export function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} absent`);
  return value;
}
