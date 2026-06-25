export type Theme = "light" | "dark" | "system"

const KEY = "honorhub.theme"

export function getTheme(): Theme {
  return (localStorage.getItem(KEY) as Theme) || "system"
}

export function applyTheme(theme: Theme = getTheme()) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.toggle("dark", dark)
}

export function setTheme(theme: Theme) {
  localStorage.setItem(KEY, theme)
  applyTheme(theme)
}
