import i18n from "i18next";

const STORAGE_KEY = "oneflow:i18n";

type TranslationsMap = Record<string, Record<string, string>>;

export function saveResourcesToStorage() {
  try {
    const out: TranslationsMap = {};
    const langs = Object.keys(i18n.options.resources || {});
    for (const lng of langs) {
      const res = i18n.getDataByLanguage(lng) || {};
      // merge translation namespace (default is 'translation')
      out[lng] = { ...(res.translation || {}) };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
  } catch (e) {
    // ignore
  }
}

export function loadResourcesFromStorage(): TranslationsMap | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TranslationsMap;
    return parsed;
  } catch (e) {
    return null;
  }
}

export function setTranslationForKey(key: string, value: string, lng?: string) {
  const locale = lng || i18n.language || "en";
  // Add or replace resource in runtime
  i18n.addResource(locale, "translation", key, value);
  // Persist
  saveResourcesToStorage();
}

export function seedTranslationsFromComponents(
  components: any[],
  targetLng = "en"
) {
  if (!Array.isArray(components)) return;
  // Determine all known languages from i18n configuration (fallback to targetLng)
  const langs = Object.keys(i18n.options.resources || {});
  const useLangs = langs.length > 0 ? langs : [targetLng];

  const visit = (nodes: any[]) => {
    for (const n of nodes) {
      if (!n || !n.id) continue;
      const id = n.id;
      const props = n.properties || {};
      const candidates: [string, any][] = [
        ["text", props.text],
        ["buttonText", props.buttonText],
        ["label", props.label],
        ["placeholder", props.placeholder],
        ["alt", props.alt],
      ];
      for (const [suffix, val] of candidates) {
        if (val != null && val !== "") {
          const key = `${id}.${suffix}`;
          for (const lng of useLangs) {
            if (!i18n.exists(key, { lng })) {
              // Seed the same source text into each language so switching
              // languages immediately updates the UI (user can later edit per-locale)
              i18n.addResource(lng, "translation", key, String(val));
            }
          }
        }
      }
      if (Array.isArray(n.children)) visit(n.children);
    }
  };
  visit(components);
  saveResourcesToStorage();
}
