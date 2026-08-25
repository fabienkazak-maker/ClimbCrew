export const REMOTE_CUSTOM_AVATAR_MARKER = "remote";

const DEFAULT_API_BASE = String(
  import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || "",
).replace(/\/$/, "");
const DEFAULT_USE_API = Boolean(DEFAULT_API_BASE);

export function customAvatarSource(
  participant,
  { apiBase = DEFAULT_API_BASE, useApi = DEFAULT_USE_API } = {},
) {
  const inlineImage = String(participant?.customAvatarImage || "");
  if (inlineImage.startsWith("data:image/")) return inlineImage;
  if (!useApi) return inlineImage;

  const hasRemoteAvatar = Boolean(participant?.hasCustomAvatar)
    || inlineImage === REMOTE_CUSTOM_AVATAR_MARKER;
  if (!hasRemoteAvatar || !participant?.id) return "";

  return `${String(apiBase || "").replace(/\/$/, "")}/participants/${encodeURIComponent(participant.id)}/avatar`;
}
