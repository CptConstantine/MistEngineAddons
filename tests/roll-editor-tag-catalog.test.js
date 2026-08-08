import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTagCatalog,
  getRollActor,
} from "../scripts/roll-editor/tag-catalog.js";

test("builds document-free narrator catalogs and excludes burned additions", () => {
  const actor = {
    id: "hero-1",
    items: [
      {
        type: "themebook",
        id: "theme-1",
        system: {
          powertags: [
            { name: "Prepared", selected: true },
            { name: "Burned", burned: true },
          ],
          weaknesstags: [{ name: "Reckless", selected: false }],
        },
      },
    ],
    system: { fellowships: [], floatingTagsAndStatuses: [] },
    sheet: {
      getActorFellowshipThemecard: () => ({
        system: {
          powertags: [{ name: "A Trusted Ally", selected: true }],
          weaknesstags: [],
        },
      }),
    },
  };
  const sceneApp = {
    currentSceneDataItem: { id: "scene-data-1" },
    getRollModifications: () => [{ name: "Darkness", positive: false }],
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

  const catalog = buildTagCatalog({ actor, sceneApp });

  assert.deepEqual(
    catalog.selectedTags.map((tag) => tag.name),
    ["Prepared", "Reckless", "A Trusted Ally"],
  );
  assert.deepEqual(
    catalog.selectedTags.map((tag) => tag.selected),
    [true, false, true],
  );
  assert.equal(catalog.selectedGmTags[0].toBurn, undefined);
  assert.equal(catalog.selectedStoryTags[0].sceneDataItemId, "scene-data-1");
  assert.equal(catalog.selectedStoryTags[0].selected, true);
  assert.equal(catalog.selectedStoryTags[0].positive, false);
  assert.equal(catalog.selectedStoryTags[0].toBurn, undefined);
  assert.equal(catalog.selectedStoryTags[0].isStatus, undefined);
});

test("preserves the native positive property for floating tags", () => {
  const actor = {
    items: [],
    system: {
      fellowships: [],
      floatingTagsAndStatuses: [{ name: "Shell shocked", value: 2 }],
    },
  };

  const catalog = buildTagCatalog({ actor });

  assert.equal(catalog.selectedTags[0].positive, undefined);
  assert.equal(catalog.selectedTags[0].toBurn, undefined);
  assert.equal(catalog.selectedTags[0].value, 2);
  assert.equal(catalog.selectedTags[0].isStatus, true);
});

test("builds challenge statuses from the native combined tag API", () => {
  const sceneApp = {
    getCombinedSelectedNPCTags: () => [
      {
        name: "Exposed",
        positive: false,
        value: 3,
        isStatus: true,
        index: 2,
        actorId: "synthetic-challenge-1",
        source: "litm-npc",
        selected: true,
      },
    ],
  };

  const catalog = buildTagCatalog({ sceneApp });

  assert.deepEqual(catalog.challengeTags, [
    {
      name: "Exposed",
      positive: false,
      value: 3,
      index: 2,
      actorId: "synthetic-challenge-1",
      source: "npc",
      might: undefined,
      mightIcon: undefined,
    },
  ]);
});

test("uses the current scene token actor for a roll", () => {
  const worldActor = { id: "hero-1", name: "World actor" };
  const tokenActor = { id: "hero-1", name: "Token actor" };
  const sceneApp = {
    getCurrentScene: () => ({ tokens: { contents: [{ actor: tokenActor }] } }),
  };

  const actor = getRollActor({
    actorId: "hero-1",
    actors: { get: () => worldActor },
    sceneApp,
  });

  assert.equal(actor, tokenActor);
});
