import { describe, expect, test } from "bun:test";
import {
  CLOUDFLARE_TEST_TURNSTILE_SECRETS,
  ConfigError,
  loadConfig,
  type Environment,
} from "./config";

function environment(productionOrigin: string): Environment {
  return {
    NODE_ENV: "test",
    SMTP_HOST: "smtp.example.test",
    SMTP_USER: "smtp-user",
    SMTP_PASS: "smtp-pass",
    EMAIL_FROM: "website@example.test",
    EMAIL_REPORT_TO: "team@example.test",
    PRODUCTION_ORIGIN: productionOrigin,
  };
}

describe("configuration", () => {
  test.each(["custom://example.test/", "nothttps://example.test/"]) (
    "rejects non-HTTP(S) origin %s",
    (productionOrigin) => {
      expect(() => loadConfig(environment(productionOrigin))).toThrow(ConfigError);
    },
  );

  test.each(["http://example.test/", "https://example.test/"]) (
    "accepts %s",
    (productionOrigin) => {
      expect(loadConfig(environment(productionOrigin)).productionOrigin).toBe(
        productionOrigin.slice(0, -1),
      );
    },
  );

  test.each([undefined, "", ...CLOUDFLARE_TEST_TURNSTILE_SECRETS]) (
    "rejects the test Turnstile secret in production",
    (turnstileSecret) => {
      expect(() =>
        loadConfig({
          ...environment("https://example.test/"),
          PRODUCTION: "true",
          TURNSTILE_SECRET_KEY: turnstileSecret,
        }),
      ).toThrow(ConfigError);
    },
  );

  test("accepts a non-test Turnstile secret in production", () => {
    expect(
      loadConfig({
        ...environment("https://example.test/"),
        PRODUCTION: "true",
        TURNSTILE_SECRET_KEY: "production-secret",
      }).turnstileSecret,
    ).toBe("production-secret");
  });

  test.each([undefined, "", ...CLOUDFLARE_TEST_TURNSTILE_SECRETS])(
    "rejects a missing or test Turnstile secret when NODE_ENV is production",
    (turnstileSecret) => {
      expect(() =>
        loadConfig({
          ...environment("https://example.test/"),
          NODE_ENV: "production",
          TURNSTILE_SECRET_KEY: turnstileSecret,
        }),
      ).toThrow(ConfigError);
    },
  );

  test("accepts a non-test Turnstile secret when NODE_ENV is production", () => {
    expect(
      loadConfig({
        ...environment("https://example.test/"),
        NODE_ENV: "production",
        TURNSTILE_SECRET_KEY: "production-secret",
      }).turnstileSecret,
    ).toBe("production-secret");
  });

  test("uses the Turnstile test secret outside production", () => {
    expect(
      loadConfig(environment("https://example.test/")).turnstileSecret,
    ).toBe("1x0000000000000000000000000000000AA");
  });

  test.each(["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM", "EMAIL_REPORT_TO", "PRODUCTION_ORIGIN"])(
    "fails naming the missing required variable %s",
    (name) => {
      const env = environment("https://example.test/");
      delete env[name];
      expect(() => loadConfig(env)).toThrow(new RegExp(`Missing required environment variable: ${name}`));
    },
  );

  test("fails naming an invalid EMAIL_FROM", () => {
    expect(() =>
      loadConfig({ ...environment("https://example.test/"), EMAIL_FROM: "not-an-email" }),
    ).toThrow("EMAIL_FROM must be an email address");
  });

  test("applies the Eterja production values", () => {
    const config = loadConfig({
      ...environment("https://swissaustral.com/"),
      NODE_ENV: "production",
      TURNSTILE_SECRET_KEY: "production-secret",
    });

    expect(config.nodeEnv).toBe("production");
    expect(config.productionOrigin).toBe("https://swissaustral.com");
    expect(config.turnstileExpectedHostname).toBe("swissaustral.com");
    expect(config.port).toBe(3000);
    expect(config.smtpPort).toBe(587);
    expect(config.turnstileTimeoutMs).toBe(5_000);
    expect(config.trustProxy).toBe(false);
    expect(config.rateLimitMax).toBe(5);
    expect(config.rateLimitWindowMs).toBe(600_000);
  });
});
