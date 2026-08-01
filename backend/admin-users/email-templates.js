function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatExpiration(expiresAt) {
  const date = new Date(expiresAt);
  if (!Number.isFinite(date.getTime())) return "dans une heure";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}

function layout({ title, preview, content }) {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;color:#0f172a;font-family:Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:22px 26px;background:#0f172a;color:#ffffff;">
                <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#67e8f9;">ClimbCrew</div>
                <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:26px;font-size:16px;line-height:1.6;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 26px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.5;">
                Message automatique envoyé par ClimbCrew. Ne communique jamais ton mot de passe.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildAccountRequestConfirmation({ prenom, nom, publicUrl }) {
  const displayName = [prenom, nom].filter(Boolean).join(" ").trim() || "grimpeur";
  const safeName = escapeHtml(displayName);
  const normalizedUrl = String(publicUrl || "").replace(/\/$/, "");
  const loginLink = normalizedUrl
    ? `<p style="margin:22px 0 0;"><a href="${escapeHtml(normalizedUrl)}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0891b2;color:#ffffff;text-decoration:none;font-weight:700;">Ouvrir ClimbCrew</a></p>`
    : "";

  const subject = "ClimbCrew – demande de création de compte reçue";
  const text = [
    `Bonjour ${displayName},`,
    "",
    "Ta demande de création de compte ClimbCrew a bien été enregistrée.",
    "Un administrateur doit maintenant l'approuver avant ta première connexion.",
    "Tu pourras te connecter dès que cette approbation aura été effectuée.",
    normalizedUrl ? `ClimbCrew : ${normalizedUrl}` : "",
  ].filter(Boolean).join("\n");

  const html = layout({
    title: "Demande de compte enregistrée",
    preview: "Ta demande ClimbCrew a bien été reçue.",
    content: `
      <p style="margin:0 0 16px;">Bonjour <strong>${safeName}</strong>,</p>
      <p style="margin:0 0 14px;">Ta demande de création de compte ClimbCrew a bien été enregistrée.</p>
      <p style="margin:0 0 14px;">Un administrateur doit maintenant l’approuver avant ta première connexion.</p>
      <p style="margin:0;">Tu pourras te connecter dès que cette approbation aura été effectuée.</p>
      ${loginLink}
    `,
  });

  return { subject, text, html };
}

export function buildPasswordResetCodeEmail({ prenom, code, expiresAt, publicUrl }) {
  const displayName = String(prenom || "").trim() || "grimpeur";
  const safeName = escapeHtml(displayName);
  const safeCode = escapeHtml(code);
  const expirationLabel = formatExpiration(expiresAt);
  const normalizedUrl = String(publicUrl || "").replace(/\/$/, "");
  const loginLink = normalizedUrl
    ? `<p style="margin:22px 0 0;"><a href="${escapeHtml(normalizedUrl)}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0891b2;color:#ffffff;text-decoration:none;font-weight:700;">Saisir le code dans ClimbCrew</a></p>`
    : "";

  const subject = "ClimbCrew – code de réinitialisation du mot de passe";
  const text = [
    `Bonjour ${displayName},`,
    "",
    "Voici ton code de réinitialisation ClimbCrew :",
    code,
    "",
    `Ce code est valable jusqu'au ${expirationLabel} et ne peut être utilisé qu'une fois.`,
    "Si tu n'es pas à l'origine de cette demande, ignore ce message.",
    normalizedUrl ? `ClimbCrew : ${normalizedUrl}` : "",
  ].filter(Boolean).join("\n");

  const html = layout({
    title: "Réinitialisation du mot de passe",
    preview: "Ton code temporaire ClimbCrew est disponible.",
    content: `
      <p style="margin:0 0 16px;">Bonjour <strong>${safeName}</strong>,</p>
      <p style="margin:0 0 14px;">Voici ton code de réinitialisation ClimbCrew :</p>
      <div style="margin:18px 0;padding:16px;border-radius:12px;background:#ecfeff;border:1px solid #a5f3fc;text-align:center;font-family:Consolas,monospace;font-size:28px;font-weight:800;letter-spacing:.14em;color:#164e63;">${safeCode}</div>
      <p style="margin:0 0 14px;">Ce code est valable jusqu’au <strong>${escapeHtml(expirationLabel)}</strong> et ne peut être utilisé qu’une fois.</p>
      <p style="margin:0;">Si tu n’es pas à l’origine de cette demande, ignore ce message.</p>
      ${loginLink}
    `,
  });

  return { subject, text, html };
}
