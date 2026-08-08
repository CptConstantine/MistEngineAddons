import assert from "node:assert/strict";
import test from "node:test";

import {
  calculatePower,
  cloneRollSnapshot,
  validateEditedSnapshot,
  validateMightScale,
} from "../scripts/roll-editor/snapshot.js";

function createSnapshot() {
  return {
    selectedTags: [
      {
        name: "Fast",
        source: null,
        themebookId: "theme-1",
        index: 0,
        positive: true,
        toBurn: false,
      },
      {
        name: "Reckless",
        source: null,
        themebookId: "theme-1",
        index: 1,
        positive: false,
        toBurn: false,
      },
    ],
    selectedGmTags: [],
    selectedStoryTags: [],
    challengeTags: [],
    numModPositive: 1,
    numModNegative: 0,
    mightScale: 0,
  };
}

test("clones an editable roll snapshot without mutating the submitted snapshot", () => {
  const original = createSnapshot();
  const clone = cloneRollSnapshot(original);
  clone.selectedTags.pop();

  assert.equal(original.selectedTags.length, 2);
  assert.equal(clone.selectedTags.length, 1);
});

test("accepts removal of submitted tags and detailed Might values", () => {
  const original = createSnapshot();
  const edited = cloneRollSnapshot(original);
  edited.selectedTags.pop();
  edited.mightScale = 2;

  assert.deepEqual(validateEditedSnapshot(original, edited), {
    valid: true,
    reason: null,
  });
  assert.equal(calculatePower(edited), 4);
});

test("accepts an added tag only when it comes from the provided category catalog", () => {
  const original = createSnapshot();
  const edited = cloneRollSnapshot(original);
  const catalogTag = {
    name: "Prepared",
    source: "rote",
    roteId: "rote-1",
    index: 0,
    positive: true,
    toBurn: false,
  };
  edited.selectedTags.push(catalogTag);

  assert.equal(validateEditedSnapshot(original, edited).reason, "unknown-tag");
  assert.deepEqual(
    validateEditedSnapshot(original, edited, { selectedTags: [catalogTag] }),
    { valid: true, reason: null },
  );
});

test("rejects an unknown tag, duplicate tag, or changed roll properties", () => {
  const original = createSnapshot();

  const unknownTag = cloneRollSnapshot(original);
  unknownTag.selectedTags.push({ name: "Fabricated", positive: true });
  assert.equal(
    validateEditedSnapshot(original, unknownTag).reason,
    "unknown-tag",
  );

  const duplicateTag = cloneRollSnapshot(original);
  duplicateTag.selectedTags.push(duplicateTag.selectedTags[0]);
  assert.equal(
    validateEditedSnapshot(original, duplicateTag).reason,
    "duplicate-tag",
  );

  const burnedTag = cloneRollSnapshot(original);
  burnedTag.selectedTags[0].toBurn = true;
  assert.equal(validateEditedSnapshot(original, burnedTag).valid, false);

  const alteredStatus = cloneRollSnapshot(original);
  alteredStatus.selectedTags[0].value = 6;
  assert.equal(validateEditedSnapshot(original, alteredStatus).valid, false);
});

test("accepts live polarity changes for every tag category", () => {
  for (const category of [
    "selectedTags",
    "selectedGmTags",
    "selectedStoryTags",
    "challengeTags",
  ]) {
    for (const originalPolarity of [true, false]) {
      const original = createSnapshot();
      const tag = {
        name: `${category} status`,
        source: category,
        index: 0,
        positive: originalPolarity,
        value: 2,
      };
      original[category] = [tag];
      const edited = cloneRollSnapshot(original);
      edited[category][0].positive = !originalPolarity;

      assert.deepEqual(
        validateEditedSnapshot(original, edited, {
          [category]: [{ ...tag, positive: !originalPolarity }],
        }),
        { valid: true, reason: null },
        `${category}: ${originalPolarity}`,
      );
    }
  }
});

test("accepts native per-roll polarity inversions but rejects unmarked flips", () => {
  const original = createSnapshot();
  original.selectedTags[0].powerTag = true;

  const powerTag = cloneRollSnapshot(original);
  powerTag.selectedTags[0].positive = false;
  assert.equal(validateEditedSnapshot(original, powerTag).valid, false);
  powerTag.selectedTags[0].inverted = true;
  assert.equal(validateEditedSnapshot(original, powerTag).valid, true);

  original.selectedTags[1].weakness = true;
  const weaknessTag = cloneRollSnapshot(original);
  weaknessTag.selectedTags[1].positive = true;
  weaknessTag.selectedTags[1].inverted = true;
  assert.equal(validateEditedSnapshot(original, weaknessTag).valid, true);

  for (const category of ["selectedStoryTags", "challengeTags"]) {
    for (const originalPolarity of [true, false]) {
      const status = {
        name: `${category} status`,
        source: category,
        index: 0,
        positive: originalPolarity,
        value: 3,
      };
      original[category] = [status];
      const edited = cloneRollSnapshot(original);
      edited[category][0].positive = !originalPolarity;
      edited[category][0].challengeInverted = true;

      assert.equal(
        validateEditedSnapshot(original, edited).valid,
        true,
        `${category}: ${originalPolarity}`,
      );
    }
  }
});

test("accepts only whole-number Might values from -6 through +6", () => {
  for (const mightScale of [-6, -1, 0, 1, 6]) {
    assert.equal(validateMightScale(mightScale), true);
  }
  for (const mightScale of [-7, 6.5, 7, "1"]) {
    assert.equal(validateMightScale(mightScale), false);
  }
});

test("calculates power with Mist Engine's highest-status rule", () => {
  const snapshot = createSnapshot();
  snapshot.selectedTags.push({ name: "Status 2", positive: true, value: 2 });
  snapshot.selectedStoryTags.push({
    name: "Status 4",
    positive: true,
    value: 4,
  });
  snapshot.challengeTags.push({
    name: "Hindrance 3",
    positive: false,
    value: 3,
  });

  assert.equal(calculatePower(snapshot), 2);
});
