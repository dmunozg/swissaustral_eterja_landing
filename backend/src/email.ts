import nodemailer from "nodemailer";
import type { AppConfig } from "./config";
import type { ContactMail } from "./contact";

export interface MailMessage {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}

export type SmtpConfig = Pick<AppConfig, "smtpHost" | "smtpPort" | "smtpUser" | "smtpPass">;

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const HEADER_CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/g;
const BODY_CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character);

const headerValue = (value: string): string => value.replace(HEADER_CONTROL_CHARACTERS, "");
const bodyValue = (value: string): string => value.replace(BODY_CONTROL_CHARACTERS, "");
const messageHtml = (value: string): string => escapeHtml(value).replace(/\r?\n/g, "<br>");

export function buildMailMessage(mail: ContactMail, config: AppConfig): MailMessage {
  const name = headerValue(mail.payload.name);
  const email = headerValue(mail.payload.email);
  const company = mail.payload.company === undefined ? undefined : headerValue(mail.payload.company);
  const role = mail.payload.role === undefined ? undefined : headerValue(mail.payload.role);
  const message = bodyValue(mail.payload.message);
  const escapedMessage = messageHtml(message);

  if (mail.kind === "receipt") {
    return {
      to: email,
      subject: "We received your message",
      text: `Hello ${name},\n\nWe received your message:\n\n${message}\n\nWe will be in touch soon.`,
      html: `<p>Hello ${escapeHtml(name)},</p><p>We received your message:</p><p>${escapedMessage}</p><p>We will be in touch soon.</p>`,
    };
  }

  const textLines = [`Name: ${name}`, `Email: ${email}`];
  const htmlLines = [
    `<p><strong>Name:</strong> ${escapeHtml(name)}</p>`,
    `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
  ];
  if (company) {
    textLines.push(`Company: ${company}`);
    htmlLines.push(`<p><strong>Company:</strong> ${escapeHtml(company)}</p>`);
  }
  if (role) {
    textLines.push(`Role: ${role}`);
    htmlLines.push(`<p><strong>Role:</strong> ${escapeHtml(role)}</p>`);
  }

  return {
    to: config.emailReportTo,
    replyTo: email,
    subject: `New contact message from ${name}`,
    text: `${textLines.join("\n")}\n\n${message}`,
    html: `${htmlLines.join("")}<p>${escapedMessage}</p>`,
  };
}

export function createSmtpTransport(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    requireTLS: true,
    auth: { user: config.smtpUser, pass: config.smtpPass },
    tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  });
}

export function createMailer(config: AppConfig) {
  const transporter = createSmtpTransport(config);
  return async (mail: ContactMail): Promise<void> => {
    const message = buildMailMessage(mail, config);
    await transporter.sendMail({
      from: config.emailFrom,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  };
}
