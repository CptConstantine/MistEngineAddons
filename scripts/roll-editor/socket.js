import { MODULE_ID } from "../constants.js";

export const ROLL_EDITOR_SOCKET = `module.${MODULE_ID}`;
export const ROLL_EDITOR_ACTIONS = Object.freeze({
  REQUEST: `${MODULE_ID}.rollEditor.request`,
  CANCEL: `${MODULE_ID}.rollEditor.cancel`,
  DECISION: `${MODULE_ID}.rollEditor.decision`,
});

export function createRollEditorSocket({
  game,
  onRequest,
  onCancel,
  onDecision,
}) {
  function isActiveGm() {
    return game.user === game.users.activeGM;
  }

  function handleMessage(message) {
    switch (message?.action) {
      case ROLL_EDITOR_ACTIONS.REQUEST:
        if (isActiveGm()) {
          onRequest?.(message);
        }
        break;
      case ROLL_EDITOR_ACTIONS.CANCEL:
        if (isActiveGm()) {
          onCancel?.(message);
        }
        break;
      case ROLL_EDITOR_ACTIONS.DECISION:
        if (message.userId === game.user.id) {
          onDecision?.(message);
        }
        break;
    }
  }

  return Object.freeze({
    register() {
      game.socket.on(ROLL_EDITOR_SOCKET, handleMessage);
    },
    emit(message) {
      game.socket.emit(ROLL_EDITOR_SOCKET, message);
    },
  });
}
