import assert from "node:assert/strict";
import test from "node:test";

import { MODULE_ID, SETTINGS, STYLE_OVERRIDES } from "../scripts/constants.js";
import { registerSettings } from "../scripts/settings.js";

function withSettingsStub(callback) {
  const originalGame = globalThis.game;
  const originalLocation = Object.getOwnPropertyDescriptor(
    globalThis,
    "location",
  );
  const registrations = [];
  let reloads = 0;

  globalThis.game = {
    settings: {
      register: (...registration) => registrations.push(registration),
    },
  };
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { reload: () => reloads++ },
  });

  try {
    callback({ registrations, getReloads: () => reloads });
  } finally {
    if (originalGame === undefined) {
      delete globalThis.game;
    } else {
      globalThis.game = originalGame;
    }

    if (originalLocation) {
      Object.defineProperty(globalThis, "location", originalLocation);
    } else {
      delete globalThis.location;
    }
  }
}

test("style override registers as a GM-controlled world setting", () => {
  withSettingsStub(({ registrations, getReloads }) => {
    registerSettings();

    const registration = registrations.find(
      ([namespace, key]) =>
        namespace === MODULE_ID && key === SETTINGS.STYLE_OVERRIDE,
    );

    assert.ok(registration);
    const [, , configuration] = registration;
    assert.equal(configuration.scope, "world");
    assert.equal(configuration.config, true);
    assert.equal(configuration.type, String);
    assert.equal(configuration.default, STYLE_OVERRIDES.NONE);
    assert.deepEqual(configuration.choices, {
      none: "MIST_ENGINE_ADDONS.Settings.StyleOverride.None",
      "city-of-mist": "MIST_ENGINE_ADDONS.Settings.StyleOverride.CityOfMist",
      otherscape: "MIST_ENGINE_ADDONS.Settings.StyleOverride.Otherscape",
    });

    configuration.onChange();
    assert.equal(getReloads(), 1);
  });
});
