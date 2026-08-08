import { STYLE_OVERRIDES } from "./constants.js";

export const STYLE_OVERRIDE_LINK_ID = "mist-engine-addons-style-override";
export const STYLE_OVERRIDE_DATASET_KEY = "mistEngineAddonsTheme";

const STYLE_OVERRIDE_FILES = Object.freeze({
  [STYLE_OVERRIDES.CITY_OF_MIST]: "city-of-mist.css",
  [STYLE_OVERRIDES.OTHERSCAPE]: "otherscape.css",
});

export function applyStyleOverride({
  theme,
  document = globalThis.document,
} = {}) {
  if (!document) {
    return false;
  }

  document.getElementById(STYLE_OVERRIDE_LINK_ID)?.remove();
  delete document.documentElement.dataset[STYLE_OVERRIDE_DATASET_KEY];

  const stylesheet = STYLE_OVERRIDE_FILES[theme];
  if (!stylesheet) {
    return false;
  }

  const link = document.createElement("link");
  link.id = STYLE_OVERRIDE_LINK_ID;
  link.rel = "stylesheet";
  link.href = new URL(`../styles/${stylesheet}`, import.meta.url).href;
  document.head.append(link);
  document.documentElement.dataset[STYLE_OVERRIDE_DATASET_KEY] = theme;
  return true;
}
