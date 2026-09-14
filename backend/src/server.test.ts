import { afterEach, beforeEach, describe, expect, mock, test, type Mock } from "bun:test";
import {
  CLOUDFLARE_TEST_TURNSTILE_SECRET,
  type AppConfig,
} from "./config";
import {
  createContactHandler,
  type ContactMail,
} from "./contact";
import {
  createFetchHandler,
  createTurnstileVerifier,
  TURNSTILE_SITEVERIFY_URL,
} from "./server";
import { isTurnstileResponseValid, type TurnstileResponse } from "./turnstile";

const ORIGINAL_FETCH = globalThis.fetch;

const REAL_CONFIG = {
  turnstileSecret: "real-secret",
  turnstileExpectedHostname: "swissaustral.com",
  turnstileTimeoutMs: 5_000,
};

const TEST_SECRET_CONFIG = {
  turnstileSecret: CLOUDFLARE_TEST_TURNSTILE_SECRET,
  turnstileExpectedHostname: "swissaustral.com",
  turnstileTimeoutMs: 5_000,
};

const HANDLER_CONFIG: AppConfig = {
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

function mockFetch(
  implementation: (input: string | URL | Request, init?: RequestInit) =>
    | Response
    | Promise<Response>,
) {
  const fetchMock = mock(implementation);
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
});

describe("Turnstile response validation", () => {
  test("accepts success with the exact action and hostname for a real secret", () => {
    expect(
      isTurnstileResponseValid(
        { success: true, action: "contact", hostname: "swissaustral.com" },
        REAL_CONFIG,
      ),
    ).toBe(true);
  });

  const invalidRealSecretResponses: TurnstileResponse[] = [
    { success: true, action: "other", hostname: "swissaustral.com" },
    { success: true, action: "contact", hostname: "other.example.com" },
    { success: true, action: "contact" },
    { success: true, hostname: "swissaustral.com" },
    { success: true },
    { success: false, action: "contact", hostname: "swissaustral.com" },
  ];

  test.each(invalidRealSecretResponses)(
    "rejects a real-secret response without valid success, action, and hostname: %j",
    (result) => {
      expect(isTurnstileResponseValid(result, REAL_CONFIG)).toBe(false);
    },
  );

  test("rejects a non-boolean success value from a malformed siteverify body", () => {
    const malformed = {
      success: "true",
      action: "contact",
      hostname: "swissaustral.com",
    } as unknown as TurnstileResponse;
    expect(isTurnstileResponseValid(malformed, REAL_CONFIG)).toBe(false);
  });

  test.each([
    { success: true },
    { success: true, action: "other", hostname: "other.example.com" },
  ])(
    "accepts a successful response without action/hostname for the Cloudflare test secret: %j",
    (result) => {
      expect(isTurnstileResponseValid(result, TEST_SECRET_CONFIG)).toBe(true);
    },
  );

  test("rejects a failed response even for the Cloudflare test secret", () => {
    expect(
      isTurnstileResponseValid({ success: false }, TEST_SECRET_CONFIG),
    ).toBe(false);
  });
});

describe("Turnstile verifier", () => {
  const request = () =>
    new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "cf-connecting-ip": "203.0.113.7" },
    });

  test("posts the urlencoded siteverify form and accepts a valid response", async () => {
    const fetchMock = mockFetch(
      () =>
        new Response(JSON.stringify({ success: true, action: "contact", hostname: "swissaustral.com" }), {
          status: 200,
        }),
    );
    const verify = createTurnstileVerifier(REAL_CONFIG);

    expect(await verify("token-123", request())).toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe(TURNSTILE_SITEVERIFY_URL);
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("content-type")).toBe(
      "application/x-www-form-urlencoded",
    );
    const body = new URLSearchParams(String(init?.body));
    expect(body.get("secret")).toBe("real-secret");
    expect(body.get("response")).toBe("token-123");
    expect(body.get("remoteip")).toBe("203.0.113.7");
  });

  test("omits remoteip when no Cloudflare client IP is present", async () => {
    const fetchMock = mockFetch(
      () =>
        new Response(JSON.stringify({ success: true, action: "contact", hostname: "swissaustral.com" }), {
          status: 200,
        }),
    );
    const verify = createTurnstileVerifier(REAL_CONFIG);

    await verify("token-123", new Request("http://localhost/api/contact"));

    const [, init] = fetchMock.mock.calls[0] ?? [];
    const body = new URLSearchParams(String(init?.body));
    expect(body.get("remoteip")).toBeNull();
  });

  test.each([
    ["a failed siteverify verdict", { success: false, errorCodes: ["invalid-input-response"] }],
    ["a missing action", { success: true, hostname: "swissaustral.com" }],
    ["a missing hostname", { success: true, action: "contact" }],
    ["a foreign hostname", { success: true, action: "contact", hostname: "other.example.com" }],
  ])("rejects %s", async (_label, result) => {
    mockFetch(() => new Response(JSON.stringify(result), { status: 200 }));
    expect(await createTurnstileVerifier(REAL_CONFIG)("token", request())).toBe(false);
  });

  test("accepts a bare success verdict for the Cloudflare test secret", async () => {
    mockFetch(() => new Response(JSON.stringify({ success: true }), { status: 200 }));
    expect(await createTurnstileVerifier(TEST_SECRET_CONFIG)("token", request())).toBe(true);
  });

  test("fails closed when siteverify returns a non-OK status", async () => {
    mockFetch(() => new Response("internal error", { status: 500 }));
    expect(await createTurnstileVerifier(REAL_CONFIG)("token", request())).toBe(false);
  });

  test("fails closed when siteverify returns malformed JSON", async () => {
    mockFetch(() => new Response("not json", { status: 200 }));
    expect(await createTurnstileVerifier(REAL_CONFIG)("token", request())).toBe(false);
  });

  test("fails closed when siteverify returns a non-object JSON value", async () => {
    mockFetch(() => new Response("[1, 2]", { status: 200 }));
    expect(await createTurnstileVerifier(REAL_CONFIG)("token", request())).toBe(false);
  });

  test("fails closed when the siteverify request throws", async () => {
    mockFetch(() => Promise.reject(new TypeError("network down")));
    expect(await createTurnstileVerifier(REAL_CONFIG)("token", request())).toBe(false);
  });

  test("fails closed when siteverify does not respond before the timeout", async () => {
    mockFetch((_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        expect(signal).toBeInstanceOf(AbortSignal);
        signal?.addEventListener("abort", () => reject(new Error("aborted")));
      }),
    );
    const verify = createTurnstileVerifier({ ...REAL_CONFIG, turnstileTimeoutMs: 25 });
    const startedAt = performance.now();

    expect(await verify("token", request())).toBe(false);
    expect(performance.now() - startedAt).toBeLessThan(2_000);
  });
});

describe("request routing", () => {
  const config = { productionOrigin: "https://swissaustral.com" };
  let contact: Mock<() => Promise<Response>>;
  let handler: (request: Request) => Promise<Response>;

  beforeEach(() => {
    contact = mock(async () => new Response("contact", { status: 200 }));
    handler = createFetchHandler(config, contact);
  });

  test("answers the CORS preflight for the accepted origin", async () => {
    const result = await handler(
      new Request("http://localhost/api/contact", {
        method: "OPTIONS",
        headers: { origin: config.productionOrigin },
      }),
    );

    expect(result.status).toBe(204);
    expect(result.headers.get("access-control-allow-origin")).toBe(
      config.productionOrigin,
    );
    expect(result.headers.get("access-control-allow-methods")).toBe("POST");
    expect(result.headers.get("access-control-allow-headers")).toBe("Content-Type");
    expect(result.headers.get("vary")).toBe("Origin");
    expect(result.headers.get("x-frame-options")).toBe("DENY");
    expect(result.headers.get("x-content-type-options")).toBe("nosniff");
    expect(contact).toHaveBeenCalledTimes(0);
  });

  test("rejects the preflight for a foreign origin without CORS headers", async () => {
    const result = await handler(
      new Request("http://localhost/api/contact", {
        method: "OPTIONS",
        headers: { origin: "https://evil.example" },
      }),
    );

    expect(result.status).toBe(403);
    expect(result.headers.get("access-control-allow-origin")).toBeNull();
    expect(contact).toHaveBeenCalledTimes(0);
  });

  test("rejects a preflight without an origin header", async () => {
    const result = await handler(
      new Request("http://localhost/api/contact", { method: "OPTIONS" }),
    );

    expect(result.status).toBe(403);
    expect(result.headers.get("access-control-allow-origin")).toBeNull();
    expect(contact).toHaveBeenCalledTimes(0);
  });

  test("delegates POST /api/contact to the contact handler", async () => {
    const result = await handler(
      new Request("http://localhost/api/contact", { method: "POST", body: "{}" }),
    );

    expect(contact).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(200);
    expect(await result.text()).toBe("contact");
  });

  test.each([
    ["GET /api/contact", "GET", "http://localhost/api/contact"],
    ["PUT /api/contact", "PUT", "http://localhost/api/contact"],
    ["POST /api/other", "POST", "http://localhost/api/other"],
    ["GET /", "GET", "http://localhost/"],
  ])("returns 404 for %s", async (_label, method, url) => {
    const result = await handler(
      new Request(url, { method, body: method === "POST" ? "{}" : undefined }),
    );

    expect(result.status).toBe(404);
    expect(await result.text()).toBe("Not found");
    expect(result.headers.get("x-frame-options")).toBe("DENY");
    expect(contact).toHaveBeenCalledTimes(0);
  });
});

describe("routing through the real contact handler", () => {
  const base = {
    name: "Ada Lovelace",
    email: "ada@example.test",
    message: "Please send more information.",
    turnstileToken: "turnstile-token",
  };

  function buildHandler(
    verifyTurnstile: (token: string, request: Request) => Promise<boolean>,
  ) {
    const mails: ContactMail[] = [];
    const contact = createContactHandler({
      config: HANDLER_CONFIG,
      verifyTurnstile,
      sendMail: async (mail) => {
        mails.push(mail);
      },
      now: () => 1_000_000,
    });
    return { handler: createFetchHandler(HANDLER_CONFIG, contact), mails };
  }

  const post = (body: string) =>
    new Request("http://localhost/api/contact", {
      method: "POST",
      headers: {
        origin: HANDLER_CONFIG.productionOrigin,
        "content-type": "application/json",
      },
      body,
    });

  test("delivers receipt and report for a valid submission", async () => {
    const { handler, mails } = buildHandler(async () => true);

    const result = await handler(post(JSON.stringify(base)));

    expect(result.status).toBe(200);
    expect(mails.map((mail) => mail.kind)).toEqual(["receipt", "report"]);
  });

  test("sends no mail for a rejected token or an invalid payload", async () => {
    const rejected = buildHandler(async () => false);
    expect((await rejected.handler(post(JSON.stringify(base)))).status).toBe(403);
    expect(rejected.mails).toHaveLength(0);

    const invalid = buildHandler(async () => true);
    expect((await invalid.handler(post("not json"))).status).toBe(400);
    expect(invalid.mails).toHaveLength(0);
  });
});
