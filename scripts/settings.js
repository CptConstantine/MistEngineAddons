import { MODULE_ID, SETTINGS } from "./constants.js";

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
}

export function isStoryTagOrganizationEnabled() {
  return game.settings.get(MODULE_ID, SETTINGS.ORGANIZE_STORY_TAGS);
}

export function isNarratorRollEditorEnabled() {
  return game.settings.get(MODULE_ID, SETTINGS.ENABLE_NARRATOR_ROLL_EDITOR);
}
