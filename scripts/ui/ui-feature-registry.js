export function createUiFeatureRegistry({ isEnabled, features = {} }) {
  function dispatch(featureName, ...args) {
    if (!isEnabled()) {
      return false;
    }

    features[featureName]?.(...args);
    return true;
  }

  return Object.freeze({
    onSceneTagsOverlayRendered: (...args) =>
      dispatch("onSceneTagsOverlayRendered", ...args),
  });
}
