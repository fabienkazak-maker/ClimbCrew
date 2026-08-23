import { API_BASE, USE_API } from "./api.js";

export const REMOTE_CUSTOM_AVATAR_MARKER = "remote";

export function customAvatarSource(participant, { apiBase = API_BASE, useApi = USE_API } = {}) {
  const inlineImage = String(participant?.customAvatarImage || "");
  if (inlineImage.startsWith("data:image/")) return inlineImage;
  if (!useApi) return inlineImage;

  const hasRemoteAvatar = Boolean(participant?.hasCustomAvatar)
    || inlineImage === REMOTE_CUSTOM_AVATAR_MARKER;
  if (!hasRemoteAvatar || !participant?.id) return "";

  return `${String(apiBase || "").replace(/\/$/, "")}/participants/${encodeURIComponent(participant.id)}/avatar`;
}
