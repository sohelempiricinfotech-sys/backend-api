export interface MicroserviceOptions {
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  body?: any;
  timeoutMs?: number;
}

export interface MicroserviceResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
  error?: string;
}

async function callMicroservice(
  baseUrl: string,
  endpoint: string,
  method: string,
  options: MicroserviceOptions = {}
): Promise<MicroserviceResponse> {
  let url = `${baseUrl}${endpoint}`;

  if (options.query && Object.keys(options.query).length > 0) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options.query)) {
      params.append(key, String(value));
    }
    url += `?${params.toString()}`;
  }

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs || 10000
  );
  try {
    const response = await fetch(url, {
      method,
      headers,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await response.json() : await response.text();
    // convert headers to plain object
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    return {
      status: response.status,
      data,
      headers: responseHeaders,
    };
  } catch (error: any) {
    console.log(error);
    return {
      status: 500,
      data: null,
      error:
        error?.name === "AbortError"
          ? "Request timed out"
          : error?.message || "Internal communication error",
      headers: {},
    };
  }
}

export async function authMicroserviceCall(
  endpoint: string,
  method: string,
  options: MicroserviceOptions
): Promise<MicroserviceResponse> {
  const baseUrl = process.env.AUTH_SERVICE_URL as string;
  return callMicroservice(baseUrl, endpoint, method, options);
}
