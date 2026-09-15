export type NodeEnvironment = "development" | "test" | "production";

export interface AppConfig {
  nodeEnv: NodeEnvironment;
  production: boolean;
  port: number;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  emailFrom: string;
  emailReportTo: string;
  productionOrigin: string;
  turnstileSecret: string;
  turnstileExpectedHostname: string;
  turnstileTimeoutMs?: number;
  trustProxy: boolean;
  rateLimitMax: number;
  rateLimitWindowMs: number;
}

export type Environment = Record<string, string | undefined>;

export const CLOUDFLARE_TEST_TURNSTILE_SECRET =
  "1x0000000000000000000000000000000AA";

export const CLOUDFLARE_TEST_TURNSTILE_SECRETS: readonly string[] = [
  CLOUDFLARE_TEST_TURNSTILE_SECRET,
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
];

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

const required = (env: Environment, name: string): string => {
  const value = env[name]?.trim();
  if (!value) {
    throw new ConfigError(`Missing required environment variable: ${name}`);
  }
  return value;
};

const integer = (env: Environment, name: string, fallback?: number): number => {
  const raw = env[name] ?? (fallback === undefined ? undefined : String(fallback));
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new ConfigError(`${name} must be a positive integer`);
  }
  return value;
};

const boolean = (env: Environment, name: string, fallback: boolean): boolean => {
  const raw = env[name];
  if (raw === undefined) return fallback;
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw new ConfigError(`${name} must be true or false`);
};

const email = (env: Environment, name: string): string => {
  const value = required(env, name);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new ConfigError(`${name} must be an email address`);
  }
  return value;
};

const origin = (env: Environment): string => {
  const value = required(env, "PRODUCTION_ORIGIN");
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new ConfigError("PRODUCTION_ORIGIN must be an absolute URL");
  }
  if (
    (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
    parsed.origin === "null" ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new ConfigError("PRODUCTION_ORIGIN must be an HTTP(S) origin");
  }
  return parsed.origin;
};

export function loadConfig(env: Environment = Bun.env): AppConfig {
  const nodeEnv = env.NODE_ENV ?? "development";
  if (nodeEnv !== "development" && nodeEnv !== "test" && nodeEnv !== "production") {
    throw new ConfigError("NODE_ENV must be development, test, or production");
  }

  const productionOrigin = origin(env);
  const production = boolean(env, "PRODUCTION", false);
  const turnstileSecret = env.TURNSTILE_SECRET_KEY?.trim();
  if (
    (nodeEnv === "production" || production) &&
    (!turnstileSecret || CLOUDFLARE_TEST_TURNSTILE_SECRETS.includes(turnstileSecret))
  ) {
    throw new ConfigError(
      "TURNSTILE_SECRET_KEY must be a non-test key when NODE_ENV is production or PRODUCTION is true",
    );
  }

  return {
    nodeEnv,
    production,
    port: integer(env, "PORT", 3000),
    smtpHost: required(env, "SMTP_HOST"),
    smtpPort: integer(env, "SMTP_PORT", 587),
    smtpUser: required(env, "SMTP_USER"),
    smtpPass: required(env, "SMTP_PASS"),
    emailFrom: email(env, "EMAIL_FROM"),
    emailReportTo: email(env, "EMAIL_REPORT_TO"),
    productionOrigin,
    turnstileSecret: turnstileSecret || CLOUDFLARE_TEST_TURNSTILE_SECRET,
    turnstileExpectedHostname:
      env.TURNSTILE_EXPECTED_HOSTNAME?.trim() || new URL(productionOrigin).hostname,
    turnstileTimeoutMs: integer(env, "TURNSTILE_TIMEOUT_MS", 5_000),
    trustProxy: boolean(env, "TRUST_PROXY", false),
    rateLimitMax: integer(env, "RATE_LIMIT_MAX", 5),
    rateLimitWindowMs: integer(env, "RATE_LIMIT_WINDOW_MS", 600_000),
  };
}
