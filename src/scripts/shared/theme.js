const THEME_STORAGE_KEY = "cognifocus-theme";

function getStoredTheme() {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : null;
  } catch {
    return null;
  }
}

function getSystemTheme() {
  return window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getResolvedTheme() {
  return (
    getStoredTheme() ??
    document.documentElement.dataset.theme ??
    getSystemTheme()
  );
}

function setTheme(theme) {
  const resolvedTheme =
    theme === "light" || theme === "dark" ? theme : getSystemTheme();
  const root = document.documentElement;
  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
}

function updateToggle(toggleButton, theme) {
  const isDark = theme === "dark";
  const icon = toggleButton.querySelector("[data-theme-toggle-icon]");
  const label = toggleButton.querySelector("[data-theme-toggle-label]");
  const nextTheme = isDark ? "light" : "dark";

  toggleButton.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
  toggleButton.setAttribute("aria-pressed", String(isDark));

  if (icon) {
    icon.className = `bi ${isDark ? "bi-sun-fill" : "bi-moon-stars-fill"}`;
  }

  if (label) {
    label.textContent = `Switch to ${nextTheme} theme`;
  }
}

export function initThemeToggles() {
  const toggleButtons = document.querySelectorAll("[data-theme-toggle]");
  if (!toggleButtons.length) return;

  const syncButtons = () => {
    const resolvedTheme = getResolvedTheme();
    toggleButtons.forEach((toggleButton) => {
      updateToggle(toggleButton, resolvedTheme);
    });
  };

  syncButtons();

  toggleButtons.forEach((toggleButton) => {
    if (toggleButton.dataset.themeToggleBound === "true") return;
    toggleButton.dataset.themeToggleBound = "true";

    toggleButton.addEventListener("click", () => {
      const currentTheme = getResolvedTheme();
      const nextTheme = currentTheme === "dark" ? "light" : "dark";

      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {
        // Browsers can block localStorage; the page still updates.
      }

      setTheme(nextTheme);
      syncButtons();
    });
  });

  const storedTheme = getStoredTheme();
  const systemQuery = window.matchMedia("(prefers-color-scheme: dark)");

  if (!storedTheme) {
    const handleSystemThemeChange = () => {
      setTheme(getSystemTheme());
      syncButtons();
    };

    if (typeof systemQuery.addEventListener === "function") {
      systemQuery.addEventListener("change", handleSystemThemeChange);
    } else if (typeof systemQuery.addListener === "function") {
      systemQuery.addListener(handleSystemThemeChange);
    }
  }

  window.addEventListener("storage", (event) => {
    if (event.key !== THEME_STORAGE_KEY) return;

    setTheme(getResolvedTheme());
    syncButtons();
  });
}
