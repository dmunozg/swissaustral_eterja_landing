import { describe, expect, mock, test } from "bun:test";
import {
  CLOUDFLARE_TEST_TURNSTILE_SECRET,
  type AppConfig,
} from "./config";
import type { ContactMail } from "./contact";
import { buildMailMessage, createMailer, createSmtpTransport } from "./email";

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

const base = {
  name: "Ada Lovelace",
  email: "ada@example.test",
  message: "Please send more information.",
  turnstileToken: "turnstile-token",
};

interface SmtpOptions {
  host: string;
  port: number;
  secure: boolean;
  requireTLS: boolean;
  auth: { user: string; pass: string };
  tls: { minVersion: string; rejectUnauthorized: boolean };
}

const optionsOf = (transport: ReturnType<typeof createSmtpTransport>): SmtpOptions =>
  (transport as unknown as { options: SmtpOptions }).options;

describe("SMTP transport configuration", () => {
  test("starts on port 587 without implicit TLS but requires STARTTLS", () => {
    const options = optionsOf(createSmtpTransport(TEST_CONFIG));

    expect(options.host).toBe(TEST_CONFIG.smtpHost);
    expect(options.port).toBe(587);
    expect(options.secure).toBe(false);
    expect(options.requireTLS).toBe(true);
    expect(options.auth).toEqual({
      user: TEST_CONFIG.smtpUser,
      pass: TEST_CONFIG.smtpPass,
    });
  });

  test("enables implicit TLS only for port 465", () => {
    expect(optionsOf(createSmtpTransport(TEST_CONFIG)).secure).toBe(false);
    expect(optionsOf(createSmtpTransport({ ...TEST_CONFIG, smtpPort: 465 })).secure).toBe(true);
  });

  test("enforces TLS 1.2 minimum and certificate verification", () => {
    for (const smtpPort of [587, 465]) {
      expect(optionsOf(createSmtpTransport({ ...TEST_CONFIG, smtpPort })).tls).toEqual({
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      });
    }
  });
});

describe("receipt mail message", () => {
  test("addresses the visitor and includes their message", () => {
    const payload = { ...base, message: "First line\nSecond line" };
    const message = buildMailMessage({ kind: "receipt", payload }, TEST_CONFIG);

    expect(message.to).toBe(base.email);
    expect(message.replyTo).toBeUndefined();
    expect(message.text).toContain(base.name);
    expect(message.text).toContain("First line\nSecond line");
    expect(message.html).toContain("First line<br>Second line");
  });

  test("escapes interpolated HTML in the visitor's content", () => {
    const payload = { ...base, name: 'Ada "Script" <b>& Co', message: "<script>alert(1)</script>" };
    const message = buildMailMessage({ kind: "receipt", payload }, TEST_CONFIG);

    expect(message.html).not.toContain("<b>");
    expect(message.html).not.toContain("<script>");
    expect(message.html).toContain("&lt;b&gt;");
    expect(message.html).toContain("&quot;Script&quot;");
    expect(message.html).toContain("&amp; Co");
    expect(message.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});

describe("report mail message", () => {
  test("addresses the configured team with the visitor as reply-to", () => {
    const message = buildMailMessage({ kind: "report", payload: base }, TEST_CONFIG);

    expect(message.to).toBe(TEST_CONFIG.emailReportTo);
    expect(message.replyTo).toBe(base.email);
    expect(message.subject).toContain(base.name);
    expect(message.text).toContain(`Name: ${base.name}`);
    expect(message.text).toContain(`Email: ${base.email}`);
    expect(message.text).toContain(base.message);
    expect(message.html).toContain(`<strong>Name:</strong> ${base.name}`);
    expect(message.html).toContain(`<strong>Email:</strong> ${base.email}`);
  });

  test("includes optional company and role only when present", () => {
    const withoutOptional = buildMailMessage({ kind: "report", payload: base }, TEST_CONFIG);
    expect(withoutOptional.text).not.toContain("Company");
    expect(withoutOptional.text).not.toContain("Role");
    expect(withoutOptional.html).not.toContain("Company");
    expect(withoutOptional.html).not.toContain("Role");

    const withOptional = buildMailMessage(
      { kind: "report", payload: { ...base, company: "Eterja", role: "Founder" } },
      TEST_CONFIG,
    );
    expect(withOptional.text).toContain("Company: Eterja");
    expect(withOptional.text).toContain("Role: Founder");
    expect(withOptional.html).toContain("Eterja");
    expect(withOptional.html).toContain("Founder");
  });

  test("escapes optional fields in HTML", () => {
    const message = buildMailMessage(
      { kind: "report", payload: { ...base, company: "<img src=x>", role: "a & b" } },
      TEST_CONFIG,
    );

    expect(message.html).not.toContain("<img");
    expect(message.html).toContain("&lt;img src=x&gt;");
    expect(message.html).toContain("a &amp; b");
  });
});

describe("mail header and body safety", () => {
  test("strips control characters from header values", () => {
    const payload = {
      ...base,
      name: "Ada\nBcc: evil@example.test\rCc: other@example.test",
    };
    const message = buildMailMessage({ kind: "report", payload }, TEST_CONFIG);

    expect(message.subject).toBe("New contact message from AdaBcc: evil@example.testCc: other@example.test");
    expect(message.subject).not.toMatch(/[\u0000-\u001f\u007f]/);
    expect(message.replyTo).toBe(base.email);
  });

  test("keeps message newlines in the plain text body and converts them in HTML", () => {
    const payload = { ...base, message: "Line one\r\nLine two\nLine three" };

    const text = buildMailMessage({ kind: "report", payload }, TEST_CONFIG).text;
    expect(text).toContain("Line one\r\nLine two\nLine three");

    const receipt = buildMailMessage({ kind: "receipt", payload }, TEST_CONFIG);
    expect(receipt.html).toContain("Line one<br>Line two<br>Line three");
    expect(receipt.text).toContain("Line one\r\nLine two\nLine three");
  });

  test("strips disallowed control characters from the body while preserving tabs and newlines", () => {
    const payload = { ...base, message: "Bad\u0007bell and\u007fdel, but\ttab and\nnewline" };
    const message = buildMailMessage({ kind: "receipt", payload }, TEST_CONFIG);

    expect(message.text).toContain("Badbell anddel, but\ttab and\nnewline");
    expect(message.text).not.toMatch(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/);
  });
});

describe("mailer wiring", () => {
  interface CapturedMail {
    from: string;
    to: string;
    replyTo?: string;
    subject: string;
    text: string;
    html: string;
  }

  test("sends both messages through the SMTP transport with the configured sender", async () => {
    const capturedTransportOptions: unknown[] = [];
    const sent: CapturedMail[] = [];
    mock.module("nodemailer", () => ({
      default: {
        createTransport: (options: unknown) => {
          capturedTransportOptions.push(options);
          return {
            options,
            sendMail: async (mail: CapturedMail) => {
              sent.push(mail);
            },
          };
        },
      },
    }));

    const sendMail = createMailer(TEST_CONFIG);
    const payload = { ...base, company: "Eterja", role: "Founder" };
    await sendMail({ kind: "receipt", payload } satisfies ContactMail);
    await sendMail({ kind: "report", payload } satisfies ContactMail);

    expect(capturedTransportOptions).toEqual([
      {
        host: TEST_CONFIG.smtpHost,
        port: TEST_CONFIG.smtpPort,
        secure: false,
        requireTLS: true,
        auth: { user: TEST_CONFIG.smtpUser, pass: TEST_CONFIG.smtpPass },
        tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
      },
    ]);
    expect(sent).toHaveLength(2);
    expect(sent[0]).toMatchObject({
      from: TEST_CONFIG.emailFrom,
      to: base.email,
      subject: "We received your message",
    });
    expect(sent[0]?.replyTo).toBeUndefined();
    expect(sent[1]).toMatchObject({
      from: TEST_CONFIG.emailFrom,
      to: TEST_CONFIG.emailReportTo,
      replyTo: base.email,
    });
    expect(sent[1]?.subject).toContain(base.name);
    expect(sent[1]?.text).toContain("Company: Eterja");
    expect(sent[1]?.text).toContain("Role: Founder");
  });
});
