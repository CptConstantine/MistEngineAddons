import { MODULE_ID, SYSTEM_ID } from "../constants.js";
import { cloneRollSnapshot, validateEditedSnapshot } from "./snapshot.js";
import { createRollEditorSocket, ROLL_EDITOR_ACTIONS } from "./socket.js";
import { buildTagCatalog } from "./tag-catalog.js";

const SYSTEM_SCRIPTS = Object.freeze({
  rollConfirmation: `systems/${SYSTEM_ID}/module/lib/roll-confirmation.mjs`,
  diceRollApp: `systems/${SYSTEM_ID}/module/apps/dice-roll-app.mjs`,
});

function createRequest(runtime, app, formValues) {
  const snapshot = cloneRollSnapshot({
    selectedTags: app.selectedTags,
    selectedGmTags: app.selectedGmTags,
    selectedStoryTags: app.selectedStoryTags,
    challengeTags: app.challengeTags,
    numModPositive: formValues.numModPositive,
    numModNegative: formValues.numModNegative,
    mightScale: formValues.mightScale,
  });

  return {
    action: ROLL_EDITOR_ACTIONS.REQUEST,
    requestId: runtime.foundry.utils.randomID(),
    userId: runtime.game.user.id,
    actorId: app.actor?.id ?? null,
    rollType: app.rollType,
    snapshot,
  };
}

async function loadSystemClasses(runtime) {
  const getRoute = runtime.foundry?.utils?.getRoute;
  if (!getRoute) {
    throw new Error("Foundry route utilities are unavailable.");
  }

  const [confirmationModule, appModule] = await Promise.all([
    import(getRoute(SYSTEM_SCRIPTS.rollConfirmation)),
    import(getRoute(SYSTEM_SCRIPTS.diceRollApp)),
  ]);

  return {
    DiceRollApp: appModule.DiceRollApp,
    RollConfirmation: confirmationModule.RollConfirmation,
  };
}

export function createNarratorRollEditorIntegration({
  isEnabled,
  runtime,
  onNarratorRequest,
  onNarratorCancel,
  loadClasses = loadSystemClasses,
}) {
  let registered = false;
  let socket;
  let classes;

  function isSystemConfirmationEnabled() {
    return runtime.game.settings.get(SYSTEM_ID, "gmRollConfirmation") === true;
  }

  function applyDecision(message) {
    const app = classes.DiceRollApp.instance;
    const pending = app?.pendingRequest;
    if (
      !pending ||
      pending.requestId !== message.requestId ||
      message.gmUserId !== runtime.game.users.activeGM?.id
    ) {
      return false;
    }

    const originalSnapshot = cloneRollSnapshot({
      ...pending.snapshot,
      ...pending.formValues,
    });
    const availableTags = buildTagCatalog({
      actor: runtime.game.actors.get(message.actorId),
      sceneApp: runtime.MistSceneApp?.instance,
    });

    if (message.mode === "review") {
      const validation = validateEditedSnapshot(
        originalSnapshot,
        message.snapshot,
        availableTags,
      );
      if (!validation.valid) {
        return false;
      }

      pending.snapshot = cloneRollSnapshot(message.snapshot);
      pending.formValues = {
        ...pending.formValues,
        numModPositive: message.snapshot.numModPositive,
        numModNegative: message.snapshot.numModNegative,
        mightScale: message.snapshot.mightScale,
      };
      app.pendingRequest = null;
      app.selectedTags = pending.snapshot.selectedTags;
      app.selectedGmTags = pending.snapshot.selectedGmTags;
      app.selectedStoryTags = pending.snapshot.selectedStoryTags;
      app.challengeTags = pending.snapshot.challengeTags;
      app.numModPositive = pending.formValues.numModPositive;
      app.numModNegative = pending.formValues.numModNegative;
      app.mightScale = pending.formValues.mightScale;
      app.render();
      return true;
    }

    if (message.mode === "approve") {
      const validation = validateEditedSnapshot(
        originalSnapshot,
        message.snapshot,
        availableTags,
      );
      if (!validation.valid) {
        return false;
      }

      pending.snapshot = cloneRollSnapshot(message.snapshot);
      pending.formValues = {
        ...pending.formValues,
        numModPositive: message.snapshot.numModPositive,
        numModNegative: message.snapshot.numModNegative,
        mightScale: message.snapshot.mightScale,
      };
      app.handleConfirmationResponse({
        requestId: message.requestId,
        approved: true,
      });
      return true;
    }

    if (message.mode === "reject") {
      app.handleConfirmationResponse({
        requestId: message.requestId,
        approved: false,
      });
      return true;
    }

    return false;
  }

  return Object.freeze({
    async register() {
      if (registered || runtime.game.system?.id !== SYSTEM_ID) {
        return false;
      }

      try {
        classes = await loadClasses(runtime);
      } catch (error) {
        console.error(
          `${MODULE_ID} | Unable to load Mist Engine roll classes.`,
          error,
        );
        return false;
      }

      if (
        typeof classes.RollConfirmation?.sendRequest !== "function" ||
        typeof classes.DiceRollApp?.prototype?.handleConfirmationResponse !==
          "function"
      ) {
        console.error(
          `${MODULE_ID} | Mist Engine roll-confirmation API is unavailable.`,
        );
        return false;
      }

      socket = createRollEditorSocket({
        game: runtime.game,
        onRequest: (message) =>
          onNarratorRequest?.(message, {
            DiceRollApp: classes.DiceRollApp,
            decide: (decision) =>
              socket.emit({
                action: ROLL_EDITOR_ACTIONS.DECISION,
                requestId: message.requestId,
                userId: message.userId,
                actorId: message.actorId,
                gmUserId: runtime.game.user.id,
                ...decision,
              }),
          }),
        onCancel: onNarratorCancel,
        onDecision: applyDecision,
      });
      socket.register();

      const originalSendRequest = classes.RollConfirmation.sendRequest;
      classes.RollConfirmation.sendRequest = (app, formValues) => {
        if (!isEnabled() || !isSystemConfirmationEnabled()) {
          return originalSendRequest.call(
            classes.RollConfirmation,
            app,
            formValues,
          );
        }

        const request = createRequest(runtime, app, formValues);
        socket.emit(request);
        return request.requestId;
      };

      const originalCancelPendingRequest =
        classes.DiceRollApp.prototype.cancelPendingRequest;
      if (typeof originalCancelPendingRequest === "function") {
        classes.DiceRollApp.prototype.cancelPendingRequest = function () {
          const requestId = this.pendingRequest?.requestId;
          if (requestId && isEnabled() && isSystemConfirmationEnabled()) {
            socket.emit({ action: ROLL_EDITOR_ACTIONS.CANCEL, requestId });
          }
          return originalCancelPendingRequest.call(this);
        };
      }

      registered = true;
      return true;
    },
    cancel(requestId) {
      socket?.emit({ action: ROLL_EDITOR_ACTIONS.CANCEL, requestId });
    },
  });
}
