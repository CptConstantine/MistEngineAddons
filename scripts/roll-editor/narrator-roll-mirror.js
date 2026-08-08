import { cloneRollSnapshot } from "./snapshot.js";

function createSnapshot(app) {
  return cloneRollSnapshot({
    selectedTags: app.selectedTags,
    selectedGmTags: app.selectedGmTags,
    selectedStoryTags: app.selectedStoryTags,
    challengeTags: app.challengeTags,
    numModPositive: app.numModPositive,
    numModNegative: app.numModNegative,
    mightScale: app.mightScale,
  });
}

export function openNarratorRollMirror({
  DiceRollApp,
  runtime,
  request,
  actor,
  onDecision,
}) {
  const previousInstance = DiceRollApp.instance;
  const snapshot = cloneRollSnapshot(request.snapshot);
  const app = new DiceRollApp({ actor, type: request.rollType });
  let decided = false;

  app.selectedTags = snapshot.selectedTags;
  app.selectedGmTags = snapshot.selectedGmTags;
  app.selectedStoryTags = snapshot.selectedStoryTags;
  app.challengeTags = snapshot.challengeTags;
  app.numModPositive = snapshot.numModPositive;
  app.numModNegative = snapshot.numModNegative;
  app.mightScale = snapshot.mightScale;
  app.options.window.title = `Edit roll for ${runtime.game.users.get(request.userId)?.name ?? "player"}`;

  function restorePreviousInstance() {
    if (DiceRollApp.instance === app) {
      DiceRollApp.instance = previousInstance;
    }
  }

  function decide(mode) {
    if (decided) {
      return;
    }
    decided = true;
    onDecision({
      mode,
      ...(mode === "approve" ? { snapshot: createSnapshot(app) } : {}),
    });
    app.close();
  }

  function injectDecisionButtons() {
    const footer = app.element?.querySelector("footer.dialog-footer");
    if (!footer) {
      return;
    }

    footer
      .querySelectorAll("[data-mist-engine-addons-roll-decision]")
      .forEach((button) => {
        button.remove();
      });
    footer.querySelectorAll("button").forEach((button) => {
      button.disabled = true;
      button.hidden = true;
    });

    const document = runtime.document ?? globalThis.document;
    const rejectButton = document.createElement("button");
    rejectButton.type = "button";
    rejectButton.className = "roll-button";
    rejectButton.dataset.mistEngineAddonsRollDecision = "true";
    rejectButton.innerHTML = '<i class="fa-solid fa-xmark"></i> Reject';
    rejectButton.addEventListener("click", () => decide("reject"));

    const approveButton = document.createElement("button");
    approveButton.type = "button";
    approveButton.className = "roll-button";
    approveButton.dataset.mistEngineAddonsRollDecision = "true";
    approveButton.innerHTML = '<i class="fa-solid fa-check"></i> Approve';
    approveButton.addEventListener("click", () => decide("approve"));

    footer.append(rejectButton, approveButton);
  }

  app.addEventListener("render", injectDecisionButtons);
  app.addEventListener("close", () => {
    if (!decided) {
      onDecision({ mode: "reject" });
    }
    restorePreviousInstance();
  });
  app.render(true, { focus: true });

  return Object.freeze({
    app,
    approve: () => decide("approve"),
    reject: () => decide("reject"),
    dismiss: () => {
      decided = true;
      return app.close();
    },
  });
}
