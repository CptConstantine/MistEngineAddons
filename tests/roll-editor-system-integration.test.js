import assert from "node:assert/strict";
import test from "node:test";

import { ROLL_EDITOR_ACTIONS } from "../scripts/roll-editor/socket.js";
import { createNarratorRollEditorIntegration } from "../scripts/roll-editor/system-integration.js";

function createSnapshot() {
  return {
    selectedTags: [
      {
        name: "Prepared",
        source: null,
        themebookId: "theme-1",
        index: 0,
        positive: true,
        powerTag: true,
        toBurn: false,
      },
    ],
    selectedGmTags: [],
    selectedStoryTags: [],
    challengeTags: [],
    numModPositive: 0,
    numModNegative: 0,
    mightScale: 0,
  };
}

function createHarness({ actor, onNarratorRequest, sceneApp } = {}) {
  const player = { id: "player-1" };
  const narrator = { id: "gm-1" };
  const handlers = new Map();
  const emitted = [];
  const game = {
    system: { id: "mist-engine-fvtt" },
    user: player,
    users: { activeGM: narrator },
    settings: { get: () => true },
    actors: { get: () => actor ?? null },
    socket: {
      on: (channel, handler) => handlers.set(channel, handler),
      emit: (channel, message) => emitted.push({ channel, message }),
    },
  };

  class DiceRollApp {
    updateTagsAndStatuses() {
      this.updateCalls = (this.updateCalls ?? 0) + 1;
    }

    handleConfirmationResponse(message) {
      this.responses.push(message);
      const pending = this.pendingRequest;
      this.pendingRequest = null;
      if (message.approved) {
        this.executedFormValues = pending.formValues;
      }
    }
  }
  const RollConfirmation = {
    sendRequest() {
      return "system-request";
    },
  };

  const runtime = {
    game,
    foundry: { utils: { randomID: () => "module-request" } },
    MistSceneApp: sceneApp ? { instance: sceneApp } : undefined,
  };
  const integration = createNarratorRollEditorIntegration({
    runtime,
    isEnabled: () => true,
    onNarratorRequest,
    loadClasses: async () => ({ DiceRollApp, RollConfirmation }),
  });
  return {
    DiceRollApp,
    RollConfirmation,
    emitted,
    game,
    handlers,
    integration,
  };
}

async function createPendingRoll(harness) {
  assert.equal(await harness.integration.register(), true);
  const app = new harness.DiceRollApp();
  app.actor = { id: "actor-1" };
  app.rollType = "quick";
  app.selectedTags = createSnapshot().selectedTags;
  app.selectedGmTags = [];
  app.selectedStoryTags = [];
  app.challengeTags = [];
  app.responses = [];
  app.renderCalls = 0;
  app.render = () => app.renderCalls++;
  harness.DiceRollApp.instance = app;

  const formValues = { mightScale: 0, numModPositive: 0, numModNegative: 0 };
  const requestId = harness.RollConfirmation.sendRequest(app, formValues);
  app.pendingRequest = { requestId, formValues, snapshot: createSnapshot() };
  return app;
}

function deliverDecision(harness, decision) {
  const handler = [...harness.handlers.values()][0];
  handler({
    action: ROLL_EDITOR_ACTIONS.DECISION,
    requestId: "module-request",
    userId: "player-1",
    actorId: "actor-1",
    gmUserId: "gm-1",
    ...decision,
  });
}

test("approval replaces the native pending snapshot before executing the roll", async () => {
  const harness = createHarness();
  const app = await createPendingRoll(harness);
  const editedSnapshot = createSnapshot();
  editedSnapshot.numModPositive = 2;
  editedSnapshot.numModNegative = 1;
  editedSnapshot.mightScale = 3;

  deliverDecision(harness, { mode: "approve", snapshot: editedSnapshot });

  assert.equal(harness.emitted.length, 1);
  assert.equal(app.responses.length, 1);
  assert.equal(app.responses[0].approved, true);
  assert.equal(app.executedFormValues.numModPositive, 2);
  assert.equal(app.executedFormValues.numModNegative, 1);
  assert.equal(app.executedFormValues.mightScale, 3);
  assert.equal(app.pendingRequest, null);
});

test("review unlocks the native player dialog without executing the roll", async () => {
  const harness = createHarness();
  const app = await createPendingRoll(harness);
  const editedSnapshot = createSnapshot();
  editedSnapshot.selectedTags = [];
  editedSnapshot.numModPositive = 1;
  editedSnapshot.numModNegative = 3;
  editedSnapshot.mightScale = -2;

  deliverDecision(harness, { mode: "review", snapshot: editedSnapshot });

  assert.equal(app.responses.length, 0);
  assert.equal(app.pendingRequest, null);
  assert.deepEqual(app.selectedTags, []);
  assert.equal(app.numModPositive, 1);
  assert.equal(app.numModNegative, 3);
  assert.equal(app.mightScale, -2);
  assert.equal(app.renderCalls, 1);
});

test("a decision that alters a submitted tag's value is ignored", async () => {
  const harness = createHarness();
  const app = await createPendingRoll(harness);
  const editedSnapshot = createSnapshot();
  editedSnapshot.selectedTags[0].value = 6;

  deliverDecision(harness, { mode: "approve", snapshot: editedSnapshot });

  assert.equal(app.responses.length, 0);
  assert.ok(app.pendingRequest);
});

test("approval accepts a scene tag selected after the request", async () => {
  const sceneApp = {
    currentSceneDataItem: { id: "scene-data-1" },
    getRollModifications: () => [],
    getSceneAndStoryTags: () => [
      {
        name: "Rain",
        positive: false,
        value: 2,
        isStatus: true,
        selected: true,
      },
    ],
    getCurrentScene: () => ({ tokens: { contents: [] } }),
  };
  const harness = createHarness({ sceneApp });
  const app = await createPendingRoll(harness);
  const editedSnapshot = createSnapshot();
  editedSnapshot.selectedStoryTags = [
    {
      name: "Rain",
      positive: false,
      value: 2,
      index: 0,
      sceneDataItemId: "scene-data-1",
      source: "scene-and-story",
    },
  ];

  deliverDecision(harness, { mode: "approve", snapshot: editedSnapshot });

  assert.equal(app.responses.length, 1);
  assert.equal(app.responses[0].approved, true);
  assert.deepEqual(app.executedFormValues, {
    mightScale: 0,
    numModPositive: 0,
    numModNegative: 0,
  });
});

test("approval accepts a challenge status flipped after the request", async () => {
  const challenge = {
    id: "challenge-1",
    type: "litm-npc",
    system: {
      floatingTagsAndStatuses: [
        {
          name: "Exposed",
          positive: false,
          value: 3,
          isStatus: true,
          selected: true,
        },
      ],
    },
  };
  const sceneApp = {
    getRollModifications: () => [],
    getSceneAndStoryTags: () => [],
    getCombinedSelectedNPCTags: () => [
      {
        name: "Exposed",
        positive: false,
        value: 3,
        isStatus: true,
        index: 0,
        actorId: "challenge-1",
        source: "litm-npc",
        selected: true,
      },
    ],
    getCurrentScene: () => ({
      tokens: { contents: [{ actor: challenge }] },
    }),
  };
  const harness = createHarness({ sceneApp });
  const app = await createPendingRoll(harness);
  app.pendingRequest.snapshot.challengeTags = [
    {
      name: "Exposed",
      positive: true,
      value: 3,
      index: 0,
      actorId: "challenge-1",
      source: "npc",
    },
  ];
  const editedSnapshot = createSnapshot();
  editedSnapshot.challengeTags = [
    {
      name: "Exposed",
      positive: false,
      value: 3,
      index: 0,
      actorId: "challenge-1",
      source: "npc",
    },
  ];

  deliverDecision(harness, { mode: "approve", snapshot: editedSnapshot });

  assert.equal(app.responses.length, 1);
  assert.equal(app.responses[0].approved, true);
});

test("approval accepts an actor tag selected from the scene window", async () => {
  const actor = {
    id: "actor-1",
    items: [],
    system: {
      fellowships: [],
      floatingTagsAndStatuses: [
        { name: "Shell shocked", value: 2, selected: true },
      ],
    },
  };
  const harness = createHarness({ actor });
  const app = await createPendingRoll(harness);
  const editedSnapshot = createSnapshot();
  editedSnapshot.selectedTags.push({
    name: "Shell shocked",
    source: "floating-tag",
    value: 2,
    isStatus: true,
    index: 1,
  });

  deliverDecision(harness, { mode: "approve", snapshot: editedSnapshot });

  assert.equal(app.responses.length, 1);
  assert.equal(app.responses[0].approved, true);
});

test("provides the native roll app to the narrator request handler", async () => {
  let nativeRollApp;
  const harness = createHarness({
    onNarratorRequest: (_request, context) => {
      nativeRollApp = context.DiceRollApp;
    },
  });
  assert.equal(await harness.integration.register(), true);
  harness.game.user = harness.game.users.activeGM;

  const handler = [...harness.handlers.values()][0];
  handler({
    action: ROLL_EDITOR_ACTIONS.REQUEST,
    requestId: "module-request",
    userId: "player-1",
    actorId: "actor-1",
    rollType: "quick",
    snapshot: createSnapshot(),
  });

  assert.equal(nativeRollApp, harness.DiceRollApp);
});
