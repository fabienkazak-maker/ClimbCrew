export const REMOTE_CUSTOM_AVATAR_MARKER = "remote";

export function customAvatarSource(participant, { apiBase = "", useApi = true } = {}) {
  const inlineImage = String(participant?.customAvatarImage || "");
  if (inlineImage.startsWith("data:image/")) return inlineImage;
  if (!useApi) return inlineImage;

  const hasRemoteAvatar = Boolean(participant?.hasCustomAvatar)
    || inlineImage === REMOTE_CUSTOM_AVATAR_MARKER;
  if (!hasRemoteAvatar || !participant?.id) return "";

  return `${String(apiBase || "").replace(/\/$/, "")}/participants/${encodeURIComponent(participant.id)}/avatar`;
}
