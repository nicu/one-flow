export type PaletteColor = {
  main: string;
  light?: string;
  dark?: string;
  contrastText?: string;
};

export type TypographyVariant = {
  fontSize: string;
  fontWeight?: number | string;
  lineHeight?: string;
  letterSpacing?: string;
};

export interface Theme {
  spacing: (n: number) => string;
  palette: {
    primary: PaletteColor;
    secondary: PaletteColor;
    background: {
      default: string;
      paper: string;
    };
    text: {
      primary: string;
      secondary: string;
    };
    surface: Record<string, string>;
  };
  shadows: string[];
  typography: {
    h1: TypographyVariant;
    h2: TypographyVariant;
    h3: TypographyVariant;
    body1: TypographyVariant;
    body2: TypographyVariant;
    caption: TypographyVariant;
  };
}
