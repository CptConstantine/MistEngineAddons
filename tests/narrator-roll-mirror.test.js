import assert from "node:assert/strict";
import test from "node:test";

import { openNarratorRollMirror } from "../scripts/roll-editor/narrator-roll-mirror.js";

class FakeDiceRollApp extends EventTarget {
  constructor({ actor, type }) {
    super();
    this.actor = actor;
    this.rollType = type;
    this.options = { window: {} };
    this.element = FakeDiceRollApp.element;
    this.renderCalls = 0;
    this.closeCalls = 0;
    FakeDiceRollApp.instance = this;
  }

  render() {
    this.renderCalls++;
    this.dispatchEvent(new Event("render"));
  }

  close() {
    this.closeCalls++;
    this.dispatchEvent(new Event("close"));
  }
}

function createRequest() {
  return {
    requestId: "request-1",
    userId: "player-1",
    rollType: "quick",
    snapshot: {
      selectedTags: [{ name: "Prepared", positive: true }],
      selectedGmTags: [],
      selectedStoryTags: [],
      challengeTags: [],
      numModPositive: 2,
      numModNegative: 1,
      mightScale: 3,
    },
  };
}

function createRuntime() {
  return { game: { users: new Map([["player-1", { name: "Player" }]]) } };
}

test("opens a native roll mirror and approves its current state", () => {
  const previous = new FakeDiceRollApp({ actor: { id: "gm-actor" } });
  const decisions = [];
  const mirror = openNarratorRollMirror({
    DiceRollApp: FakeDiceRollApp,
    runtime: createRuntime(),
    request: createRequest(),
    actor: { id: "hero-1" },
    onDecision: (decision) => decisions.push(decision),
  });

  assert.equal(mirror.app.actor.id, "hero-1");
  assert.equal(mirror.app.rollType, "quick");
  assert.equal(mirror.app.numModPositive, 2);
  assert.equal(mirror.app.numModNegative, 1);
  assert.equal(mirror.app.mightScale, 3);
  assert.equal(mirror.app.renderCalls, 1);
  assert.equal(FakeDiceRollApp.instance, mirror.app);

  mirror.app.numModPositive = 4;
  mirror.approve();

  assert.deepEqual(decisions, [
    {
      mode: "approve",
      snapshot: {
        ...createRequest().snapshot,
        numModPositive: 4,
      },
    },
  ]);
  assert.equal(mirror.app.closeCalls, 1);
  assert.equal(FakeDiceRollApp.instance, previous);
});

test("rejects an undecided mirror when the GM closes it", () => {
  const decisions = [];
  const mirror = openNarratorRollMirror({
    DiceRollApp: FakeDiceRollApp,
    runtime: createRuntime(),
    request: createRequest(),
    actor: { id: "hero-1" },
    onDecision: (decision) => decisions.push(decision),
  });

  mirror.app.close();

  assert.deepEqual(decisions, [{ mode: "reject" }]);
});

test("preserves native roll footer controls while adding approval actions", () => {
  const nativeRollButton = new EventTarget();
  nativeRollButton.dataset = {};
  const footer = {
    children: [nativeRollButton],
    append(...children) {
      this.children.push(...children);
    },
    querySelectorAll(selector) {
      if (selector === "button") {
        return this.children;
      }
      if (selector === "[data-mist-engine-addons-roll-decision]") {
        return this.children.filter(
          (child) => child.dataset?.mistEngineAddonsRollDecision === "true",
        );
      }
      return [];
    },
  };
  FakeDiceRollApp.element = {
    querySelector: (selector) =>
      selector === "footer.dialog-footer" ? footer : null,
  };
  const decisions = [];
  const mirror = openNarratorRollMirror({
    DiceRollApp: FakeDiceRollApp,
    runtime: {
      ...createRuntime(),
      document: {
        createElement: () => {
          const button = new EventTarget();
          button.dataset = {};
          button.remove = () => {
            footer.children = footer.children.filter(
              (child) => child !== button,
            );
          };
          return button;
        },
      },
    },
    request: createRequest(),
    actor: { id: "hero-1" },
    onDecision: (decision) => decisions.push(decision),
  });

  mirror.app.render();
  footer.children[2].dispatchEvent(new Event("click"));

  assert.equal(footer.children.length, 3);
  assert.equal(footer.children[0], nativeRollButton);
  assert.equal(nativeRollButton.disabled, true);
  assert.equal(nativeRollButton.hidden, true);
  assert.equal(decisions[0].mode, "approve");
  assert.equal(mirror.app.closeCalls, 1);
  FakeDiceRollApp.element = undefined;
});
