import { loadConfig, type AppConfig } from "./config";
import {
  createContactHandler,
  SECURITY_HEADERS,
  type ContactHandler,
} from "./contact";
import { isTurnstileResponseValid, type TurnstileResponse } from "./turnstile";

export const TURNSTILE_SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileVerifier = (token: string, request: Request) => Promise<boolean>;

export function createTurnstileVerifier(
  config: Pick<
    AppConfig,
    "turnstileSecret" | "turnstileExpectedHostname" | "turnstileTimeoutMs"
  >,
): TurnstileVerifier {
  return async (token, request) => {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      config.turnstileTimeoutMs ?? 5_000,
    );
    try {
      const form = new URLSearchParams({ secret: config.turnstileSecret, response: token });
      const remoteIp = request.headers.get("cf-connecting-ip");
      if (remoteIp) form.set("remoteip", remoteIp);
      const response = await fetch(TURNSTILE_SITEVERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
        signal: controller.signal,
      });
      if (!response.ok) return false;
      const data: unknown = await response.json();
      if (typeof data !== "object" || data === null) return false;
      return isTurnstileResponseValid(data as TurnstileResponse, config);
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  };
}

export function createFetchHandler(
  config: Pick<AppConfig, "productionOrigin">,
  contact: ContactHandler,
): (request: Request) => Promise<Response> {
  const notFound = () =>
    new Response("Not found", { status: 404, headers: SECURITY_HEADERS });

  return (request) => {
    const path = new URL(request.url).pathname;
    if (path !== "/api/contact") return Promise.resolve(notFound());

    const origin = request.headers.get("origin");
    if (request.method === "OPTIONS") {
      if (origin !== config.productionOrigin) {
        return Promise.resolve(new Response(null, { status: 403, headers: SECURITY_HEADERS }));
      }
      const headers = new Headers(SECURITY_HEADERS);
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Headers", "Content-Type");
      headers.set("Access-Control-Allow-Methods", "POST");
      headers.set("Vary", "Origin");
      return Promise.resolve(new Response(null, { status: 204, headers }));
    }
    if (request.method === "POST") return contact(request);
    return Promise.resolve(notFound());
  };
}

if (import.meta.main) {
  const config = loadConfig();
  const contact = createContactHandler({
    config,
    verifyTurnstile: createTurnstileVerifier(config),
    sendMail: async () => {},
  });
  const server = Bun.serve({
    port: config.port,
    fetch: createFetchHandler(config, contact),
  });
  console.log(`Contact API listening on ${server.port ?? config.port}`);
}
