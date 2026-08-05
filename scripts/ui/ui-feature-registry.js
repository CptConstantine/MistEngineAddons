export function createUiFeatureRegistry({ isEnabled, features = {} }) {
  function dispatch(featureName, ...args) {
    if (!isEnabled()) {
      return false;
    }

    features[featureName]?.(...args);
    return true;
  }

  return Object.freeze({
    onRollDialogRendered: (...args) =>
      dispatch("onRollDialogRendered", ...args),
    onRollDialogClosed: (...args) => dispatch("onRollDialogClosed", ...args),
    onSceneTagsChanged: (...args) => dispatch("onSceneTagsChanged", ...args),
  });
}
