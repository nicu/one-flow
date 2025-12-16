import manifest from "../imgManifest.json";

const imgs: string[] = Array.isArray(manifest) ? manifest : [];

export function getSavedImage(index: number, fallbackSize = 150): string {
  if (!imgs || imgs.length === 0) {
    // fallback to previous external avatar generator until manifest is populated
    return `https://i.pravatar.cc/${fallbackSize}?u=${index}`;
  }
  const name = imgs[index % imgs.length];
  // Respect Vite's `base` (import.meta.env.BASE_URL) so images load correctly
  // when the app is served from a subpath (GitHub Pages). `BASE_URL` will
  // be `./` in relative mode or `/one-flow/` when configured explicitly.
  const base = import.meta.env.BASE_URL || "/";
  return `${base}img/${name}`.replace(/([^:]?)\/\//g, "$1/");
}

export function getRandomSavedImage(fallbackSize = 150): string {
  if (!imgs || imgs.length === 0)
    return `https://i.pravatar.cc/${fallbackSize}`;
  const idx = Math.floor(Math.random() * imgs.length);
  const base = import.meta.env.BASE_URL || "/";
  return `${base}img/${imgs[idx]}`.replace(/([^:]?)\/\//g, "$1/");
}
