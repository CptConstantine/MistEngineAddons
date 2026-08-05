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
    features: { onSceneControlButtons: () => calls++ },
  });

  assert.equal(registry.onSceneControlButtons([]), false);
  assert.equal(calls, 0);
});

test("UI features run only when enabled", () => {
  let sceneControls;
  const registry = createUiFeatureRegistry({
    isEnabled: () => true,
    features: {
      onSceneControlButtons: (controls) => (sceneControls = controls),
    },
  });
  const controls = [];

  assert.equal(registry.onSceneControlButtons(controls), true);
  assert.equal(sceneControls, controls);
});

test("hook registration is idempotent and removable", () => {
  const hooks = createHooksStub();
  const calls = [];
  const registrar = createUiHookRegistrar({
    hooks,
    registry: {
      onSceneControlButtons: () => calls.push("scene-controls"),
      onCanvasReady: () => calls.push("canvas-ready"),
      onActorUpdated: () => calls.push("actor-updated"),
    },
  });

  assert.equal(registrar.register(), true);
  assert.equal(registrar.register(), false);
  assert.equal(hooks.listeners.size, 3);

  [...hooks.listeners.values()][0].callback();
  assert.deepEqual(calls, ["scene-controls"]);

  assert.equal(registrar.unregister(), true);
  assert.equal(registrar.unregister(), false);
  assert.equal(hooks.listeners.size, 0);
  assert.equal(hooks.removed.length, 3);
});
