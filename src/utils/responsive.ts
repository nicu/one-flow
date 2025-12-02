import type { Breakpoint } from "../hooks/useBreakpoint";

export type ResponsiveProp<T> = T | Partial<Record<Breakpoint, T>>;

export const getCurrentBreakpoint = (): Breakpoint => {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
};

export function getResponsiveValue<T>(
  val: ResponsiveProp<T> | undefined,
  breakpoint: Breakpoint
): T | undefined {
  if (val === undefined || val === null) return undefined;
  // primitive / single value
  if (typeof val !== "object" || Array.isArray(val)) return val as T;
  // object keyed by breakpoints
  const obj = val as Partial<Record<Breakpoint, T>>;
  // exact match
  if (obj[breakpoint] !== undefined) return obj[breakpoint] as T;
  // fallback order: desktop -> tablet -> mobile (depending on current)
  if (breakpoint === "desktop") return obj.desktop ?? obj.tablet ?? obj.mobile;
  if (breakpoint === "tablet") return obj.tablet ?? obj.mobile ?? obj.desktop;
  return obj.mobile ?? obj.tablet ?? obj.desktop;
}
