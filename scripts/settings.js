import { MODULE_ID, SETTINGS, STYLE_OVERRIDES } from "./constants.js";

export function registerSettings() {
  game.settings.register(MODULE_ID, SETTINGS.ORGANIZE_STORY_TAGS, {
    name: "MIST_ENGINE_ADDONS.Settings.OrganizeStoryTags.Name",
    hint: "MIST_ENGINE_ADDONS.Settings.OrganizeStoryTags.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    onChange: () => globalThis.ui?.litmSceneTags?.render(),
  });

  game.settings.register(MODULE_ID, SETTINGS.ENABLE_NARRATOR_ROLL_EDITOR, {
    name: "MIST_ENGINE_ADDONS.Settings.EnableNarratorRollEditor.Name",
    hint: "MIST_ENGINE_ADDONS.Settings.EnableNarratorRollEditor.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register(MODULE_ID, SETTINGS.STYLE_OVERRIDE, {
    name: "MIST_ENGINE_ADDONS.Settings.StyleOverride.Name",
    hint: "MIST_ENGINE_ADDONS.Settings.StyleOverride.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      [STYLE_OVERRIDES.NONE]: "MIST_ENGINE_ADDONS.Settings.StyleOverride.None",
      [STYLE_OVERRIDES.CITY_OF_MIST]:
        "MIST_ENGINE_ADDONS.Settings.StyleOverride.CityOfMist",
      [STYLE_OVERRIDES.OTHERSCAPE]:
        "MIST_ENGINE_ADDONS.Settings.StyleOverride.Otherscape",
    },
    default: STYLE_OVERRIDES.NONE,
    onChange: () => globalThis.location?.reload(),
  });
}

export function isStoryTagOrganizationEnabled() {
  return game.settings.get(MODULE_ID, SETTINGS.ORGANIZE_STORY_TAGS);
}

export function isNarratorRollEditorEnabled() {
  return game.settings.get(MODULE_ID, SETTINGS.ENABLE_NARRATOR_ROLL_EDITOR);
}

export function getStyleOverride() {
  return game.settings.get(MODULE_ID, SETTINGS.STYLE_OVERRIDE);
}
