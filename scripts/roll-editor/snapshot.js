export const ROLL_TAG_CATEGORIES = Object.freeze([
  "selectedTags",
  "selectedGmTags",
  "selectedStoryTags",
  "challengeTags",
]);

export const MIGHT_RANGE = Object.freeze({ minimum: -6, maximum: 6 });

export function getTagIdentity(tag) {
  return [
    tag.source ?? "",
    tag.themebookId ?? "",
    tag.roteId ?? "",
    tag.actorId ?? "",
    tag.sceneDataItemId ?? "",
    tag.ownerId ?? "",
    tag.index ?? "",
    tag.weakness === true ? "weakness" : "power",
    tag.name ?? "",
  ].join("|");
}

function hasAllowedPolarity(tag, sourceTag, category) {
  if (tag.positive === sourceTag.positive) {
    return true;
  }

  const isOpposite = tag.positive === !sourceTag.positive;
  if (!isOpposite) {
    return false;
  }

  if (category === "selectedTags") {
    return (
      tag.inverted === true &&
      (sourceTag.powerTag === true || sourceTag.weakness === true) &&
      tag.toBurn !== true
    );
  }

  return (
    (category === "selectedStoryTags" || category === "challengeTags") &&
    tag.challengeInverted === true
  );
}

function hasMatchingRollProperties(tag, sourceTag, category) {
  return (
    hasAllowedPolarity(tag, sourceTag, category) &&
    (tag.value ?? 0) === (sourceTag.value ?? 0) &&
    tag.toBurn === sourceTag.toBurn &&
    Boolean(tag.powerTag) === Boolean(sourceTag.powerTag) &&
    Boolean(tag.weakness) === Boolean(sourceTag.weakness) &&
    Boolean(tag.fellowship) === Boolean(sourceTag.fellowship) &&
    Boolean(tag.isStatus) === Boolean(sourceTag.isStatus) &&
    (tag.might ?? null) === (sourceTag.might ?? null)
  );
}

export function cloneRollSnapshot(snapshot) {
  return structuredClone({
    selectedTags: snapshot.selectedTags ?? [],
    selectedGmTags: snapshot.selectedGmTags ?? [],
    selectedStoryTags: snapshot.selectedStoryTags ?? [],
    challengeTags: snapshot.challengeTags ?? [],
    numModPositive: snapshot.numModPositive ?? 0,
    numModNegative: snapshot.numModNegative ?? 0,
    mightScale: snapshot.mightScale ?? 0,
  });
}

export function validateMightScale(mightScale) {
  return (
    Number.isInteger(mightScale) &&
    mightScale >= MIGHT_RANGE.minimum &&
    mightScale <= MIGHT_RANGE.maximum
  );
}

export function validateEditedSnapshot(
  originalSnapshot,
  editedSnapshot,
  availableTagsByCategory = {},
) {
  if (!validateMightScale(editedSnapshot.mightScale)) {
    return { valid: false, reason: "invalid-might" };
  }

  for (const category of ROLL_TAG_CATEGORIES) {
    const originals = new Map(
      (originalSnapshot[category] ?? []).map((tag) => [
        getTagIdentity(tag),
        tag,
      ]),
    );
    const availableTags = new Map(
      (availableTagsByCategory[category] ?? []).map((tag) => [
        getTagIdentity(tag),
        tag,
      ]),
    );
    const seen = new Set();

    for (const tag of editedSnapshot[category] ?? []) {
      const identity = getTagIdentity(tag);
      const sourceTag = availableTags.get(identity) ?? originals.get(identity);
      if (!sourceTag) {
        return { valid: false, reason: "unknown-tag", category, identity };
      }
      if (seen.has(identity)) {
        return { valid: false, reason: "duplicate-tag", category, identity };
      }
      if (!hasMatchingRollProperties(tag, sourceTag, category)) {
        return {
          valid: false,
          reason: "tag-properties-changed",
          category,
          identity,
        };
      }
      seen.add(identity);
    }
  }

  return { valid: true, reason: null };
}

export function calculatePower(snapshot) {
  const tags = ROLL_TAG_CATEGORIES.flatMap(
    (category) => snapshot[category] ?? [],
  );
  let positivePower = 0;
  let negativePower = 0;
  let burnedTagUsed = false;
  const statuses = [];

  for (const tag of tags) {
    if (tag.value && tag.value > 0) {
      statuses.push(tag);
    } else if (tag.positive === false) {
      negativePower += 1;
    } else if (tag.toBurn && !burnedTagUsed) {
      positivePower += 3;
      burnedTagUsed = true;
    } else {
      positivePower += 1;
    }
  }

  const positiveStatus = statuses
    .filter((tag) => tag.positive !== false)
    .reduce((highest, tag) => Math.max(highest, tag.value), 0);
  const negativeStatus = statuses
    .filter((tag) => tag.positive === false)
    .reduce((highest, tag) => Math.max(highest, tag.value), 0);
  const modifiers =
    (snapshot.numModPositive ?? 0) - (snapshot.numModNegative ?? 0);
  return Math.max(
    1,
    positivePower -
      negativePower +
      positiveStatus -
      negativeStatus +
      (snapshot.mightScale ?? 0) +
      modifiers,
  );
}
