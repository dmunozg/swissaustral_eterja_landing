import { describe, expect, test } from "bun:test";
import {
  CLOUDFLARE_TEST_TURNSTILE_SECRET,
  type AppConfig,
} from "./config";
import {
  CONTACT_LIMITS,
  CONTACT_MAX_BODY_BYTES,
  createContactHandler,
  parseContactPayload,
  type ContactDependencies,
  type ContactLimitField,
  type ContactMail,
} from "./contact";

const base = {
  name: "Ada Lovelace",
  email: "ada@example.test",
  message: "Please send more information.",
  turnstileToken: "turnstile-token",
};

const REQUIRED_FIELDS: ContactLimitField[] = ["name", "email", "message", "turnstileToken"];
const OPTIONAL_FIELDS: ContactLimitField[] = ["company", "role"];

function withField(field: ContactLimitField, length: number): Record<string, unknown> {
  const value =
    field === "email" ? "a".repeat(length - 12) + "@example.com" : "x".repeat(length);
  return { ...base, [field]: value };
}

describe("Eterja contact payload contract", () => {
  test("defines the agreed field limits", () => {
    expect(CONTACT_LIMITS).toEqual({
      name: 100,
      company: 150,
      role: 150,
      email: 254,
      message: 5_000,
      turnstileToken: 2_048,
    });
  });

  test("accepts a valid payload without optional fields", () => {
    const result = parseContactPayload(base);

    expect(result).toEqual(base);
    expect(Object.keys(result ?? {})).toEqual([
      "name",
      "email",
      "message",
      "turnstileToken",
    ]);
  });

  test("trims required fields", () => {
    expect(
      parseContactPayload({
        ...base,
        name: "  Ada Lovelace  ",
        turnstileToken: "  turnstile-token  ",
      }),
    ).toEqual(base);
  });

  test("accepts and trims optional fields", () => {
    expect(
      parseContactPayload({ ...base, company: "  Eterja  ", role: "  Founder  " }),
    ).toEqual({ ...base, company: "Eterja", role: "Founder" });
  });

  test("treats blank optional fields as absent", () => {
    const result = parseContactPayload({ ...base, company: "   ", role: "" });

    expect(result).toEqual(base);
  });

  test.each(REQUIRED_FIELDS)("rejects a payload with a missing or undefined %s", (field) => {
    const withoutKey: Record<string, unknown> = { ...base };
    delete withoutKey[field];
    expect(parseContactPayload(withoutKey)).toBeNull();
    expect(parseContactPayload({ ...base, [field]: undefined })).toBeNull();
  });

  test.each(REQUIRED_FIELDS)("rejects a blank %s", (field) => {
    expect(parseContactPayload({ ...base, [field]: "   " })).toBeNull();
  });

  test.each(REQUIRED_FIELDS)("rejects a non-string %s", (field) => {
    for (const value of [1, true, null, [], {}]) {
      expect(parseContactPayload({ ...base, [field]: value })).toBeNull();
    }
  });

  test.each(REQUIRED_FIELDS)("rejects an oversized %s", (field) => {
    expect(parseContactPayload(withField(field, CONTACT_LIMITS[field] + 1))).toBeNull();
  });

  test.each(REQUIRED_FIELDS)("accepts a %s exactly at its limit", (field) => {
    expect(parseContactPayload(withField(field, CONTACT_LIMITS[field]))).not.toBeNull();
  });

  test.each(OPTIONAL_FIELDS)("accepts an optional %s exactly at its limit", (field) => {
    expect(parseContactPayload({ ...base, [field]: "y".repeat(CONTACT_LIMITS[field]) })).not.toBeNull();
  });

  test.each(OPTIONAL_FIELDS)("rejects an oversized optional %s", (field) => {
    expect(parseContactPayload({ ...base, [field]: "y".repeat(CONTACT_LIMITS[field] + 1) })).toBeNull();
  });

  test.each(OPTIONAL_FIELDS)("rejects a non-string optional %s", (field) => {
    for (const value of [1, null, {}]) {
      expect(parseContactPayload({ ...base, [field]: value })).toBeNull();
    }
  });

  test("rejects a non-object payload", () => {
    for (const value of [42, "text", true, null, undefined, []]) {
      expect(parseContactPayload(value)).toBeNull();
    }
  });

  test.each(["not-an-email", "a@b", "a b@example.test", "ada@example"])(
    "rejects an invalid email %s",
    (email) => {
      expect(parseContactPayload({ ...base, email })).toBeNull();
    },
  );

  test("rejects unsafe control characters in required and optional fields", () => {
    expect(parseContactPayload({ ...base, name: "Ada\u0000" })).toBeNull();
    expect(parseContactPayload({ ...base, message: "Hello\u001f world" })).toBeNull();
    expect(parseContactPayload({ ...base, company: "E\u007fterja" })).toBeNull();
  });
});

const TEST_CONFIG: AppConfig = {
  nodeEnv: "test",
  production: false,
  port: 3000,
  smtpHost: "smtp.example.test",
  smtpPort: 587,
  smtpUser: "smtp-user",
  smtpPass: "smtp-pass",
  emailFrom: "website@example.test",
  emailReportTo: "team@example.test",
  productionOrigin: "https://swissaustral.com",
  turnstileSecret: CLOUDFLARE_TEST_TURNSTILE_SECRET,
  turnstileExpectedHostname: "swissaustral.com",
  turnstileTimeoutMs: 5_000,
  trustProxy: false,
  rateLimitMax: 5,
  rateLimitWindowMs: 600_000,
};

function createTestHandler(overrides: Partial<ContactDependencies> = {}) {
  const mails: ContactMail[] = [];
  const turnstileCalls: Array<{ token: string; request: Request }> = [];
  let verifyResult = true;
  let mailError: Error | undefined;

  const handler = createContactHandler({
    config: TEST_CONFIG,
    verifyTurnstile: async (token, request) => {
      turnstileCalls.push({ token, request });
      return verifyResult;
    },
    sendMail: async (mail) => {
      if (mailError) throw mailError;
      mails.push(mail);
    },
    now: () => 1_000_000,
    ...overrides,
  });

  return {
    handler,
    mails,
    turnstileCalls,
    setVerifyResult: (value: boolean) => {
      verifyResult = value;
    },
    setMailError: (error: Error | undefined) => {
      mailError = error;
    },
  };
}

function postRequest(body: string, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: {
      origin: TEST_CONFIG.productionOrigin,
      "content-type": "application/json",
      ...headers,
    },
    body,
  });
}

// Builds a JSON body of exactly `targetBytes` bytes (all-ASCII fields).
function paddedBody(targetBytes: number): string {
  const skeleton = JSON.stringify({ ...base, padding: "" });
  return JSON.stringify({ ...base, padding: "x".repeat(targetBytes - skeleton.length) });
}

describe("contact endpoint handler", () => {
  test("sends the receipt first and the report second for a valid submission", async () => {
    const { handler, mails, turnstileCalls } = createTestHandler();

    const result = await handler(postRequest(JSON.stringify(base)));

    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ message: "Message sent" });
    expect(mails.map((mail) => mail.kind)).toEqual(["receipt", "report"]);
    expect(mails.every((mail) => mail.payload)).toBe(true);
    expect(mails[0]?.payload).toEqual(base);
    expect(mails[1]?.payload).toEqual(base);
    expect(turnstileCalls).toHaveLength(1);
    expect(turnstileCalls[0]?.token).toBe(base.turnstileToken);
  });

  test("passes the parsed and trimmed payload to the mail dependency", async () => {
    const { handler, mails } = createTestHandler();

    const result = await handler(
      postRequest(
        JSON.stringify({
          ...base,
          name: "  Ada Lovelace  ",
          company: "  Eterja  ",
          role: "  Founder  ",
          turnstileToken: "  turnstile-token  ",
        }),
      ),
    );

    expect(result.status).toBe(200);
    expect(mails[0]?.payload).toEqual({
      ...base,
      company: "Eterja",
      role: "Founder",
    });
  });

  test("sets security headers and CORS only for the accepted origin", async () => {
    const { handler } = createTestHandler();
    const result = await handler(postRequest(JSON.stringify(base)));

    expect(result.headers.get("x-frame-options")).toBe("DENY");
    expect(result.headers.get("x-content-type-options")).toBe("nosniff");
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(result.headers.get("cross-origin-resource-policy")).toBe("same-origin");
    expect(result.headers.get("referrer-policy")).toBe("no-referrer");
    expect(result.headers.get("access-control-allow-origin")).toBe(
      TEST_CONFIG.productionOrigin,
    );
    expect(result.headers.get("vary")).toBe("Origin");
  });

  test("rejects a foreign origin without calling any dependency", async () => {
    const { handler, mails, turnstileCalls } = createTestHandler();

    const result = await handler(
      postRequest(JSON.stringify(base), { origin: "https://evil.example" }),
    );

    expect(result.status).toBe(403);
    expect(await result.json()).toEqual({ error: "Forbidden" });
    expect(result.headers.get("access-control-allow-origin")).toBeNull();
    expect(mails).toHaveLength(0);
    expect(turnstileCalls).toHaveLength(0);
  });

  test("rejects a request without an origin header", async () => {
    const { handler, mails } = createTestHandler();
    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(base),
    });

    const result = await handler(request);

    expect(result.status).toBe(403);
    expect(await result.json()).toEqual({ error: "Forbidden" });
    expect(result.headers.get("access-control-allow-origin")).toBeNull();
    expect(mails).toHaveLength(0);
  });

  test("rejects a malformed JSON body without calling any dependency", async () => {
    const { handler, mails, turnstileCalls } = createTestHandler();

    const result = await handler(postRequest("this is not json"));

    expect(result.status).toBe(400);
    expect(await result.json()).toEqual({ error: "Invalid request" });
    expect(mails).toHaveLength(0);
    expect(turnstileCalls).toHaveLength(0);
  });

  test("rejects a non-JSON content type", async () => {
    const { handler } = createTestHandler();
    const result = await handler(
      postRequest(JSON.stringify(base), {
        "content-type": "application/x-www-form-urlencoded",
      }),
    );
    expect(result.status).toBe(400);
  });

  test("rejects a request without a content type", async () => {
    const { handler } = createTestHandler();
    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { origin: TEST_CONFIG.productionOrigin },
      body: JSON.stringify(base),
    });

    expect((await handler(request)).status).toBe(400);
  });

  test("rejects an invalid payload from the body without calling any dependency", async () => {
    const { handler, mails, turnstileCalls } = createTestHandler();

    const withoutToken: Record<string, unknown> = { ...base };
    delete withoutToken.turnstileToken;
    const result = await handler(postRequest(JSON.stringify(withoutToken)));

    expect(result.status).toBe(400);
    expect(mails).toHaveLength(0);
    expect(turnstileCalls).toHaveLength(0);
  });

  test("rejects a body whose declared content length exceeds the limit", async () => {
    const { handler, mails } = createTestHandler();

    const result = await handler(
      postRequest("{}", {
        "content-length": String(CONTACT_MAX_BODY_BYTES + 1),
      }),
    );

    expect(result.status).toBe(400);
    expect(mails).toHaveLength(0);
  });

  test("rejects an oversized body streamed without a content length", async () => {
    const { handler, mails } = createTestHandler();

    const result = await handler(postRequest(paddedBody(CONTACT_MAX_BODY_BYTES + 1)));

    expect(result.status).toBe(400);
    expect(mails).toHaveLength(0);
  });

  test("accepts a body exactly at the limit", async () => {
    const { handler } = createTestHandler();
    expect((await handler(postRequest(paddedBody(CONTACT_MAX_BODY_BYTES)))).status).toBe(200);
  });

  test("allows at most the configured submissions per window, then releases after expiry", async () => {
    let currentTime = 1_000_000;
    const { handler, mails, turnstileCalls } = createTestHandler({
      now: () => currentTime,
    });
    const body = JSON.stringify(base);

    for (let i = 0; i < TEST_CONFIG.rateLimitMax; i += 1) {
      expect((await handler(postRequest(body))).status).toBe(200);
    }
    const limited = await handler(postRequest(body));
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ error: "Too many requests" });
    expect(limited.headers.get("access-control-allow-origin")).toBe(
      TEST_CONFIG.productionOrigin,
    );
    expect(mails).toHaveLength(TEST_CONFIG.rateLimitMax * 2);
    expect(turnstileCalls).toHaveLength(TEST_CONFIG.rateLimitMax);

    currentTime += TEST_CONFIG.rateLimitWindowMs + 1;
    expect((await handler(postRequest(body))).status).toBe(200);
  });

  test("tracks attempts per Cloudflare client IP", async () => {
    const { handler } = createTestHandler();
    const body = JSON.stringify(base);

    for (let i = 0; i < TEST_CONFIG.rateLimitMax; i += 1) {
      const request = postRequest(body, { "cf-connecting-ip": "203.0.113.7" });
      expect((await handler(request)).status).toBe(200);
    }
    expect(
      (await handler(postRequest(body, { "cf-connecting-ip": "203.0.113.7" }))).status,
    ).toBe(429);
    expect(
      (await handler(postRequest(body, { "cf-connecting-ip": "198.51.100.1" }))).status,
    ).toBe(200);
  });

  test("keys by the first trusted proxy address when trustProxy is enabled", async () => {
    const { handler } = createTestHandler({
      config: { ...TEST_CONFIG, trustProxy: true },
    });
    const body = JSON.stringify(base);

    for (let i = 0; i < TEST_CONFIG.rateLimitMax; i += 1) {
      const request = postRequest(body, { "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
      expect((await handler(request)).status).toBe(200);
    }
    expect(
      (await handler(postRequest(body, { "x-forwarded-for": "203.0.113.7, 10.0.0.2" }))).status,
    ).toBe(429);
    expect(
      (await handler(postRequest(body, { "x-forwarded-for": "198.51.100.1" }))).status,
    ).toBe(200);
  });

  test("rejects a submission with a rejected Turnstile token and sends no mail", async () => {
    const { handler, mails, turnstileCalls, setVerifyResult } = createTestHandler();
    setVerifyResult(false);

    const result = await handler(postRequest(JSON.stringify(base)));

    expect(result.status).toBe(403);
    expect(await result.json()).toEqual({ error: "Unable to verify request" });
    expect(mails).toHaveLength(0);
    expect(turnstileCalls).toHaveLength(1);
  });

  test("returns a generic error, logs safe delivery details, and stops at the failing mail step", async () => {
    const { handler, mails, setMailError } = createTestHandler();
    const originalConsoleError = console.error;
    const errors: unknown[][] = [];
    console.error = (...args: unknown[]) => errors.push(args);
    try {
      const smtpError = Object.assign(new Error("smtp down"), {
        code: "ESOCKET",
        command: "CONN",
        responseCode: 421,
      });
      setMailError(smtpError);

      const failed = await handler(postRequest(JSON.stringify(base)));
      expect(failed.status).toBe(500);
      expect(await failed.json()).toEqual({ error: "Unable to send message" });
      expect(mails).toHaveLength(0);
      expect(errors).toEqual([
        [
          "Contact email delivery failed",
          {
            kind: "receipt",
            clientIp: "unknown",
            name: "Error",
            code: "ESOCKET",
            command: "CONN",
            responseCode: 421,
          },
        ],
      ]);

      let calls = 0;
      const partial = createContactHandler({
        config: TEST_CONFIG,
        verifyTurnstile: async () => true,
        sendMail: async (mail) => {
          calls += 1;
          if (mail.kind === "report") throw new Error("smtp down");
        },
      });
      const partialResult = await partial(postRequest(JSON.stringify(base)));
      expect(partialResult.status).toBe(500);
      expect(calls).toBe(2);
    } finally {
      console.error = originalConsoleError;
    }
  });

  test.each([
    ["GET", "http://localhost/api/contact"],
    ["DELETE", "http://localhost/api/contact"],
    ["POST", "http://localhost/api/other"],
  ])("returns 404 for %s %s", async (method, url) => {
    const { handler, mails } = createTestHandler();

    const result = await handler(new Request(url, { method, body: method === "POST" ? "{}" : undefined }));

    expect(result.status).toBe(404);
    expect(mails).toHaveLength(0);
  });
});
