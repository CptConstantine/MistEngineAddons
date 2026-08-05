export function createUiFeatureRegistry({ isEnabled, features = {} }) {
  function dispatch(featureName, ...args) {
    if (!isEnabled()) {
      return false;
    }

    features[featureName]?.(...args);
    return true;
  }

  return Object.freeze({
    onSceneControlButtons: (...args) =>
      dispatch("onSceneControlButtons", ...args),
    onCanvasReady: (...args) => dispatch("onCanvasReady", ...args),
    onActorUpdated: (...args) => dispatch("onActorUpdated", ...args),
  });
}
