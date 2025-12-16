import manifest from "../imgManifest.json";

const imgs: string[] = Array.isArray(manifest) ? manifest : [];

export function getSavedImage(index: number, fallbackSize = 150): string {
  if (!imgs || imgs.length === 0) {
    // fallback to previous external avatar generator until manifest is populated
    return `https://i.pravatar.cc/${fallbackSize}?u=${index}`;
  }
  const name = imgs[index % imgs.length];
  return `/img/${name}`;
}

export function getRandomSavedImage(fallbackSize = 150): string {
  if (!imgs || imgs.length === 0)
    return `https://i.pravatar.cc/${fallbackSize}`;
  const idx = Math.floor(Math.random() * imgs.length);
  return `/img/${imgs[idx]}`;
}
