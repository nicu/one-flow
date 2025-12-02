import { useEffect, useState } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop";

const getBreakpointFromWidth = (w: number): Breakpoint => {
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
};

export const useBreakpoint = () => {
  const [width, setWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const breakpoint = getBreakpointFromWidth(width);
  return { width, breakpoint } as const;
};

export default useBreakpoint;
