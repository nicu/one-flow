import type { Theme } from "./types";

export const defaultTheme: Theme = {
  spacing: (n: number) => `${4 * n}px`,
  palette: {
    primary: {
      main: "#1976d2",
      light: "#63a4ff",
      dark: "#004ba0",
      contrastText: "#fff",
    },
    secondary: {
      main: "#9c27b0",
      light: "#d05ce3",
      dark: "#6a0080",
      contrastText: "#fff",
    },
    background: { default: "#f6f8fb", paper: "#ffffff" },
    text: { primary: "#0f172a", secondary: "#475569" },
    surface: {
      elevated: "#ffffff",
      card: "#ffffff",
      muted: "#f8fafc",
    },
  },
  shadows: [
    "none",
    "0px 1px 2px rgba(16,24,40,0.05)",
    "0px 4px 6px rgba(16,24,40,0.08)",
    "0px 10px 15px rgba(16,24,40,0.12)",
  ],
  typography: {
    h1: { fontSize: "2rem", fontWeight: 700, lineHeight: "2.4rem" },
    h2: { fontSize: "1.5rem", fontWeight: 700, lineHeight: "2rem" },
    h3: { fontSize: "1.25rem", fontWeight: 600, lineHeight: "1.75rem" },
    body1: { fontSize: "1rem", fontWeight: 400, lineHeight: "1.5rem" },
    body2: { fontSize: "0.875rem", fontWeight: 400, lineHeight: "1.25rem" },
    caption: { fontSize: "0.75rem", fontWeight: 400, lineHeight: "1rem" },
  },
};
