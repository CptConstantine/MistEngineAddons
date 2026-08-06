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
}

export function isStoryTagOrganizationEnabled() {
  return game.settings.get(MODULE_ID, SETTINGS.ORGANIZE_STORY_TAGS);
}
