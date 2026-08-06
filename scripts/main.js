import { MODULE_ID } from "./constants.js";
import { isStoryTagOrganizationEnabled, registerSettings } from "./settings.js";
import {
  getCompatibilityMessageKey,
  getRuntimeCompatibility,
} from "./system-compatibility.js";
import { createUiHookRegistrar } from "./ui/register-ui-hooks.js";
import { organizeStoryTagOverlay } from "./ui/story-tag-organizer.js";
import { createUiFeatureRegistry } from "./ui/ui-feature-registry.js";

let uiHookRegistrar;

function registerApi() {
  const module = game.modules.get(MODULE_ID);
  if (!module) {
    console.error(`${MODULE_ID} | Unable to register the module API.`);
    return;
  }

  module.api = Object.freeze({
    getCompatibility: () => getRuntimeCompatibility(game),
    isCompatible: () => getRuntimeCompatibility(game).compatible,
  });
}

function reportIncompatibility(compatibility) {
  const messageKey = getCompatibilityMessageKey(compatibility.reason);
  const message = game.i18n.localize(messageKey);
  console.warn(`${MODULE_ID} | ${message}`);
}

function registerUiHooks() {
  uiHookRegistrar ??= createUiHookRegistrar({
    hooks: Hooks,
    registry: createUiFeatureRegistry({
      isEnabled: isStoryTagOrganizationEnabled,
      features: {
        onSceneTagsOverlayRendered: (_application, html) =>
          organizeStoryTagOverlay(html),
      },
    }),
  });
  uiHookRegistrar.register();

  if (isStoryTagOrganizationEnabled()) {
    organizeStoryTagOverlay(ui.litmSceneTags?.element);
  }
}

Hooks.once("init", () => {
  registerSettings();
  console.info(`${MODULE_ID} | Initializing.`);
});

Hooks.once("ready", () => {
  registerApi();

  const compatibility = getRuntimeCompatibility(game);
  if (!compatibility.compatible) {
    reportIncompatibility(compatibility);
    return;
  }

  registerUiHooks();
  console.info(`${MODULE_ID} | Ready.`);
});
