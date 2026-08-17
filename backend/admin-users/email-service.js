import nodemailer from "nodemailer";
import {
  buildAccountApprovedEmail,
  buildAccountRequestConfirmation,
  buildAdminAccountRequestReadyEmail,
  buildEmailChangeConfirmationEmail,
  buildPasswordResetCodeEmail,
} from "./email-templates.js";

function envBoolean(name, fallback = false) {
  const value = process.env[name];
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "oui", "on"].includes(String(value).trim().toLowerCase());
}

const EMAIL_ENABLED = envBoolean("EMAIL_ENABLED", false);
const SMTP_HOST = String(process.env.SMTP_HOST || "").trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = envBoolean("SMTP_SECURE", SMTP_PORT === 465);
const SMTP_REQUIRE_TLS = envBoolean("SMTP_REQUIRE_TLS", SMTP_PORT !== 465);
const SMTP_USER = String(process.env.SMTP_USER || "").trim();
const SMTP_PASSWORD = String(process.env.SMTP_PASSWORD || "");
const EMAIL_FROM_NAME = String(process.env.EMAIL_FROM_NAME || "ClimbCrew").trim();
const EMAIL_FROM_ADDRESS = String(process.env.EMAIL_FROM_ADDRESS || SMTP_USER || "").trim();
const EMAIL_REPLY_TO = String(process.env.EMAIL_REPLY_TO || "").trim();
const PUBLIC_URL = String(
  process.env.PUBLIC_URL || process.env.FRONTEND_ORIGIN || process.env.CORS_ORIGIN || ""
).split(",")[0].trim().replace(/\/$/, "");

let transporter = null;

function getTransporter() {
  if (!EMAIL_ENABLED) return null;
  if (transporter) return transporter;

  if (!SMTP_HOST) throw new Error("SMTP_HOST est requis lorsque EMAIL_ENABLED=true");
  if (!Number.isFinite(SMTP_PORT) || SMTP_PORT <= 0) throw new Error("SMTP_PORT invalide");
  if (!EMAIL_FROM_ADDRESS) throw new Error("EMAIL_FROM_ADDRESS est requis lorsque EMAIL_ENABLED=true");
  if ((SMTP_USER && !SMTP_PASSWORD) || (!SMTP_USER && SMTP_PASSWORD)) {
    throw new Error("SMTP_USER et SMTP_PASSWORD doivent être renseignés ensemble");
  }

  const options = {
    pool: true,
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    requireTLS: SMTP_REQUIRE_TLS,
  };

  if (SMTP_USER && SMTP_PASSWORD) {
    options.auth = { user: SMTP_USER, pass: SMTP_PASSWORD };
  }

  transporter = nodemailer.createTransport(options);
  return transporter;
}

async function sendEmail({ to, subject, text, html, attachments = [] }) {
  const target = String(to || "").trim().toLowerCase();
  if (!target) throw new Error("Adresse de destination absente");

  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    return { sent: false, skipped: true, reason: "email_disabled" };
  }

  const info = await activeTransporter.sendMail({
    from: {
      name: EMAIL_FROM_NAME || "ClimbCrew",
      address: EMAIL_FROM_ADDRESS,
    },
    to: target,
    replyTo: EMAIL_REPLY_TO || undefined,
    subject,
    text,
    html,
    attachments,
  });

  return {
    sent: true,
    skipped: false,
    messageId: info.messageId || null,
    accepted: Array.isArray(info.accepted) ? info.accepted : [],
    rejected: Array.isArray(info.rejected) ? info.rejected : [],
  };
}

export function isEmailEnabled() {
  return EMAIL_ENABLED;
}

export async function sendAccountRequestConfirmation({ email, prenom, nom, verificationUrl }) {
  return sendEmail({
    to: email,
    ...buildAccountRequestConfirmation({ prenom, nom, publicUrl: PUBLIC_URL, verificationUrl }),
  });
}

export async function sendAccountApprovedEmail({ email, prenom, nom }) {
  return sendEmail({
    to: email,
    ...buildAccountApprovedEmail({ prenom, nom, publicUrl: PUBLIC_URL }),
  });
}

export async function sendAdminAccountRequestReadyEmail({ email, prenom, nom, applicantEmail }) {
  return sendEmail({
    to: email,
    ...buildAdminAccountRequestReadyEmail({ prenom, nom, email: applicantEmail, publicUrl: PUBLIC_URL }),
  });
}

export async function sendPasswordResetCode({ email, prenom, code, expiresAt }) {
  return sendEmail({
    to: email,
    ...buildPasswordResetCodeEmail({ prenom, code, expiresAt, publicUrl: PUBLIC_URL }),
  });
}

export async function sendEmailChangeConfirmation({ email, prenom, newEmail, confirmUrl, expiresAt }) {
  return sendEmail({
    to: email,
    ...buildEmailChangeConfirmationEmail({ prenom, newEmail, confirmUrl, expiresAt, publicUrl: PUBLIC_URL }),
  });
}

export async function sendBackupEmail({ to, filePath, fileName, size }) {
  const sizeMb = (Number(size || 0) / (1024 * 1024)).toFixed(2);
  const now = new Date().toLocaleString("fr-FR", { timeZone: process.env.BACKUP_TIMEZONE || "Europe/Paris" });
  return sendEmail({
    to,
    subject: `Sauvegarde ClimbClubCristal — ${fileName}`,
    text: [
      "Sauvegarde PostgreSQL complète de ClimbClubCristal.",
      `Fichier : ${fileName}`,
      `Taille : ${sizeMb} Mo`,
      `Créée / envoyée : ${now}`,
      "Conserver cette pièce jointe dans un emplacement protégé. Elle contient les données de l'application.",
    ].join("\n"),
    html: `<p><strong>Sauvegarde PostgreSQL complète de ClimbClubCristal.</strong></p><p>Fichier : ${fileName}<br>Taille : ${sizeMb} Mo<br>Créée / envoyée : ${now}</p><p>Conserver cette pièce jointe dans un emplacement protégé. Elle contient les données de l'application.</p>`,
    attachments: [{
      filename: fileName,
      path: filePath,
      contentType: "application/octet-stream",
    }],
  });
}
