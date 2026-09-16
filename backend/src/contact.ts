import type { AppConfig } from "./config";

export const CONTACT_LIMITS = {
  name: 100,
  company: 150,
  role: 150,
  email: 254,
  message: 5_000,
  turnstileToken: 2_048,
} as const;

export const CONTACT_MAX_BODY_BYTES = 16_384;

export type ContactLimitField = keyof typeof CONTACT_LIMITS;

export interface ContactPayload {
  name: string;
  company?: string;
  role?: string;
  email: string;
  message: string;
  turnstileToken: string;
}

export type MailKind = "receipt" | "report";

export interface ContactMail {
  kind: MailKind;
  payload: ContactPayload;
}

export interface ContactDependencies {
  config: AppConfig;
  verifyTurnstile: (token: string, request: Request) => Promise<boolean>;
  sendMail: (mail: ContactMail) => Promise<void>;
  now?: () => number;
  clientKey?: (request: Request) => string;
}

export type ContactHandler = (request: Request) => Promise<Response>;

export const SECURITY_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

const REQUIRED_FIELDS = ["name", "email", "message", "turnstileToken"] as const;
const OPTIONAL_FIELDS = ["company", "role"] as const;

type RequiredField = (typeof REQUIRED_FIELDS)[number];
type OptionalField = (typeof OPTIONAL_FIELDS)[number];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

const requiredString = (
  input: Record<string, unknown>,
  field: RequiredField,
): string | null => {
  const raw = input[field];
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  return text.length > 0 && text.length <= CONTACT_LIMITS[field] ? text : null;
};

const optionalString = (
  input: Record<string, unknown>,
  field: OptionalField,
): string | null | undefined => {
  const raw = input[field];
  if (raw === undefined) return undefined;
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  if (text.length > CONTACT_LIMITS[field]) return null;
  return text.length > 0 ? text : undefined;
};

export function parseContactPayload(value: unknown): ContactPayload | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;

  const name = requiredString(input, "name");
  const email = requiredString(input, "email");
  const message = requiredString(input, "message");
  const turnstileToken = requiredString(input, "turnstileToken");
  if (!name || !email || !message || !turnstileToken) return null;

  const company = optionalString(input, "company");
  const role = optionalString(input, "role");
  if (company === null || role === null) return null;

  if (!EMAIL_PATTERN.test(email)) return null;
  if (
    [name, email, message, turnstileToken, company, role].some(
      (field) => field !== undefined && CONTROL_CHARACTERS.test(field),
    )
  ) {
    return null;
  }

  const payload: ContactPayload = { name, email, message, turnstileToken };
  if (company !== undefined) payload.company = company;
  if (role !== undefined) payload.role = role;
  return payload;
}

const ATTEMPTS_CLEANUP_BUDGET = 16;

function response(
  status: number,
  body: Record<string, string>,
  origin?: string,
): Response {
  const headers = new Headers(SECURITY_HEADERS);
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  return Response.json(body, { status, headers });
}

async function readJson(request: Request): Promise<unknown | null> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") return null;

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const length = Number(contentLength);
    if (!Number.isSafeInteger(length) || length < 0 || length > CONTACT_MAX_BODY_BYTES) {
      return null;
    }
  }

  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > CONTACT_MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function defaultClientKey(request: Request, trustProxy: boolean): string {
  if (trustProxy) {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwarded) return forwarded;
  }
  return request.headers.get("cf-connecting-ip")?.trim() || "unknown";
}

type MailErrorDetails = {
  name: string;
  code?: string;
  command?: string;
  responseCode?: number;
  errno?: string;
  syscall?: string;
};

function mailErrorDetails(error: unknown): MailErrorDetails {
  if (!(error instanceof Error)) return { name: typeof error };
  const details: MailErrorDetails = { name: error.name };
  if ("code" in error && typeof error.code === "string") details.code = error.code;
  if ("command" in error && typeof error.command === "string") details.command = error.command;
  if ("responseCode" in error && typeof error.responseCode === "number") {
    details.responseCode = error.responseCode;
  }
  if ("errno" in error && typeof error.errno === "string") details.errno = error.errno;
  if ("syscall" in error && typeof error.syscall === "string") details.syscall = error.syscall;
  return details;
}

export function createContactHandler(dependencies: ContactDependencies): ContactHandler {
  const attempts = new Map<string, number[]>();
  const now = dependencies.now ?? Date.now;
  const clientKey =
    dependencies.clientKey ??
    ((request) => defaultClientKey(request, dependencies.config.trustProxy));
  let cleanupIterator: ReturnType<typeof attempts.entries> | undefined;

  const cleanupExpiredAttempts = (cutoff: number) => {
    cleanupIterator ??= attempts.entries();
    for (let inspected = 0; inspected < ATTEMPTS_CLEANUP_BUDGET; inspected += 1) {
      const entry = cleanupIterator.next();
      if (entry.done) {
        cleanupIterator = attempts.entries();
        return;
      }
      const [key, timestamps] = entry.value;
      if (timestamps.every((timestamp) => timestamp <= cutoff)) attempts.delete(key);
    }
  };

  return async (request) => {
    const origin = request.headers.get("origin");
    if (request.method !== "POST" || new URL(request.url).pathname !== "/api/contact") {
      return response(404, { error: "Not found" });
    }

    if (origin !== dependencies.config.productionOrigin) {
      return response(403, { error: "Forbidden" });
    }

    const payload = parseContactPayload(await readJson(request));
    if (!payload) return response(400, { error: "Invalid request" }, origin);

    const currentTime = now();
    const key = clientKey(request);
    const cutoff = currentTime - dependencies.config.rateLimitWindowMs;
    cleanupExpiredAttempts(cutoff);
    const recent = (attempts.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
    if (recent.length >= dependencies.config.rateLimitMax) {
      attempts.set(key, recent);
      return response(429, { error: "Too many requests" }, origin);
    }
    recent.push(currentTime);
    attempts.set(key, recent);

    if (!(await dependencies.verifyTurnstile(payload.turnstileToken, request))) {
      return response(403, { error: "Unable to verify request" }, origin);
    }

    for (const kind of ["receipt", "report"] as const) {
      try {
        await dependencies.sendMail({ kind, payload });
      } catch (error) {
        console.error("Contact email delivery failed", {
          kind,
          clientIp: clientKey(request),
          ...mailErrorDetails(error),
        });
        return response(500, { error: "Unable to send message" }, origin);
      }
    }

    return response(200, { message: "Message sent" }, origin);
  };
}
