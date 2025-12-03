import React, { createContext, useContext, useState } from "react";

export const theme = {
  colors: {
    primary: "#FF5A5F", // Airbnb red-ish
    secondary: "#008489",
    text: "#484848",
    textLight: "#767676",
    background: "#ffffff",
    border: "#EBEBEB",
  },
  borderRadius: {
    small: "4px",
    medium: "8px",
    large: "12px",
    circle: "50%",
    input: "8px", // Global input radius
    button: "8px", // Global button radius
  },
  shadows: {
    small: "0 2px 4px rgba(0,0,0,0.1)",
    medium: "0 4px 12px rgba(0,0,0,0.15)",
    large: "0 8px 24px rgba(0,0,0,0.2)",
  },
  typography: {
    fontFamily:
      "Inter, Circular, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif",
    fontSize: {
      small: "14px",
      base: "16px",
      large: "18px",
      xl: "24px",
      xxl: "32px",
    },
  },
  // Standard breakpoints for responsive props and layout
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
  },
};

type ThemeShape = typeof theme;

interface ThemeContextValue {
  theme: ThemeShape;
  setTheme: (t: ThemeShape) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme,
   
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [current, setCurrent] = useState<ThemeShape>(theme);
  return (
    <ThemeContext.Provider value={{ theme: current, setTheme: setCurrent }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
