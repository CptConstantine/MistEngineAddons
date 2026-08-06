const UI_HOOKS = Object.freeze([
  ["renderMistSceneTagsOverlay", "onSceneTagsOverlayRendered"],
]);

export function createUiHookRegistrar({ hooks, registry }) {
  let subscriptions = null;

  return Object.freeze({
    register() {
      if (subscriptions) {
        return false;
      }

      subscriptions = UI_HOOKS.map(([hookName, handlerName]) => ({
        hookName,
        hookId: hooks.on(hookName, (...args) => registry[handlerName](...args)),
      }));
      return true;
    },

    unregister() {
      if (!subscriptions) {
        return false;
      }

      for (const { hookName, hookId } of subscriptions) {
        hooks.off(hookName, hookId);
      }
      subscriptions = null;
      return true;
    },
  });
}
