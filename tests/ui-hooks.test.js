import assert from "node:assert/strict";
import test from "node:test";

import { createUiHookRegistrar } from "../scripts/ui/register-ui-hooks.js";
import { createUiFeatureRegistry } from "../scripts/ui/ui-feature-registry.js";

function createHooksStub() {
  const listeners = new Map();
  const removed = [];
  let nextHookId = 1;

  return {
    listeners,
    removed,
    on(hookName, callback) {
      const hookId = nextHookId++;
      listeners.set(hookId, { hookName, callback });
      return hookId;
    },
    off(hookName, hookId) {
      removed.push({ hookName, hookId });
      listeners.delete(hookId);
    },
  };
}

test("UI features do nothing while the feature setting is disabled", () => {
  let calls = 0;
  const registry = createUiFeatureRegistry({
    isEnabled: () => false,
    features: { onSceneTagsOverlayRendered: () => calls++ },
  });

  assert.equal(registry.onSceneTagsOverlayRendered({}, {}), false);
  assert.equal(calls, 0);
});

test("UI features run only when enabled", () => {
  let sceneControls;
  const registry = createUiFeatureRegistry({
    isEnabled: () => true,
    features: {
      onSceneTagsOverlayRendered: (_application, html) =>
        (sceneControls = html),
    },
  });
  const overlay = {};

  assert.equal(registry.onSceneTagsOverlayRendered({}, overlay), true);
  assert.equal(sceneControls, overlay);
});

test("hook registration is idempotent and removable", () => {
  const hooks = createHooksStub();
  const calls = [];
  const registrar = createUiHookRegistrar({
    hooks,
    registry: {
      onSceneTagsOverlayRendered: () => calls.push("overlay-rendered"),
    },
  });

  assert.equal(registrar.register(), true);
  assert.equal(registrar.register(), false);
  assert.equal(hooks.listeners.size, 1);

  [...hooks.listeners.values()][0].callback();
  assert.deepEqual(calls, ["overlay-rendered"]);

  assert.equal(registrar.unregister(), true);
  assert.equal(registrar.unregister(), false);
  assert.equal(hooks.listeners.size, 0);
  assert.equal(hooks.removed.length, 1);
});
