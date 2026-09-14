import {
  CLOUDFLARE_TEST_TURNSTILE_SECRET,
  type AppConfig,
} from "./config";

export interface TurnstileResponse {
  success?: boolean;
  action?: string;
  hostname?: string;
}

export function isTurnstileResponseValid(
  result: TurnstileResponse,
  config: Pick<AppConfig, "turnstileSecret" | "turnstileExpectedHostname">,
): boolean {
  if (result.success !== true) return false;
  // Cloudflare's Siteverify returns no action/hostname for the test secret.
  if (config.turnstileSecret === CLOUDFLARE_TEST_TURNSTILE_SECRET) return true;
  return (
    result.action === "contact" &&
    result.hostname === config.turnstileExpectedHostname
  );
}
