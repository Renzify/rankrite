const THEME_STORAGE_KEY = "rankrite-ui-theme";
const DEFAULT_THEME = "light";
const ALLOWED_THEMES = new Set(["light", "dark"]);

function normalizeTheme(theme) {
  return ALLOWED_THEMES.has(theme) ? theme : DEFAULT_THEME;
}

export function getStoredTheme() {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return normalizeTheme(storedTheme);
}

export function applyTheme(theme) {
  const normalizedTheme = normalizeTheme(theme);

  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", normalizedTheme);
    document.documentElement.style.colorScheme =
      normalizedTheme === "dark" ? "dark" : "light";
  }

  return normalizedTheme;
}

export function persistTheme(theme) {
  const normalizedTheme = normalizeTheme(theme);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
  }

  return normalizedTheme;
}

export function applyStoredTheme() {
  return applyTheme(getStoredTheme());
}
