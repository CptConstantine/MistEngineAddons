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
    features: { onRollDialogRendered: () => calls++ },
  });

  assert.equal(registry.onRollDialogRendered({}), false);
  assert.equal(calls, 0);
});

test("UI features run only when enabled", () => {
  let renderedDialog;
  const registry = createUiFeatureRegistry({
    isEnabled: () => true,
    features: { onRollDialogRendered: (dialog) => (renderedDialog = dialog) },
  });
  const dialog = { id: "roll-dialog" };

  assert.equal(registry.onRollDialogRendered(dialog), true);
  assert.equal(renderedDialog, dialog);
});

test("hook registration is idempotent and removable", () => {
  const hooks = createHooksStub();
  const calls = [];
  const registrar = createUiHookRegistrar({
    hooks,
    registry: {
      onRollDialogRendered: () => calls.push("rendered"),
      onRollDialogClosed: () => calls.push("closed"),
      onSceneTagsChanged: () => calls.push("changed"),
    },
  });

  assert.equal(registrar.register(), true);
  assert.equal(registrar.register(), false);
  assert.equal(hooks.listeners.size, 3);

  [...hooks.listeners.values()][0].callback();
  assert.deepEqual(calls, ["rendered"]);

  assert.equal(registrar.unregister(), true);
  assert.equal(registrar.unregister(), false);
  assert.equal(hooks.listeners.size, 0);
  assert.equal(hooks.removed.length, 3);
});
