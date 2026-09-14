import { describe, expect, test } from "bun:test";
import {
  CONTACT_LIMITS,
  parseContactPayload,
  type ContactLimitField,
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
