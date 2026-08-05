import { MODULE_ID, SETTINGS } from "./constants.js";

export function registerSettings() {
  game.settings.register(MODULE_ID, SETTINGS.ENABLE_UI_HOOKS, {
    name: "MIST_ENGINE_ADDONS.Settings.EnableUiHooks.Name",
    hint: "MIST_ENGINE_ADDONS.Settings.EnableUiHooks.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
  });
}

export function areUiHooksEnabled() {
  return game.settings.get(MODULE_ID, SETTINGS.ENABLE_UI_HOOKS);
}
