export const CONTACT_LIMITS = {
  name: 100,
  company: 150,
  role: 150,
  email: 254,
  message: 5_000,
  turnstileToken: 2_048,
} as const;

export type ContactLimitField = keyof typeof CONTACT_LIMITS;

export interface ContactPayload {
  name: string;
  company?: string;
  role?: string;
  email: string;
  message: string;
  turnstileToken: string;
}

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
