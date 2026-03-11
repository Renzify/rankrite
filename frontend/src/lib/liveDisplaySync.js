export const LIVE_DISPLAY_CHANNEL_NAME = "rankrite-live-display";
export const LIVE_DISPLAY_MESSAGE_TYPE = "LIVE_DISPLAY_SYNC";
export const LIVE_DISPLAY_STORAGE_KEY = "rankrite-live-display-state";

export function formatLiveLabel(value, fallback) {
  const text = (value ?? "").toString().trim();
  if (!text) return fallback;

  return text
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function readLiveDisplayState() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LIVE_DISPLAY_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeLiveDisplayState(state) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LIVE_DISPLAY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore write errors (e.g. private mode storage restrictions)
  }
}
