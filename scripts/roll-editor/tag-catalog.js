function getActorTags(actor) {
  const tags = [];
  if (!actor) {
    return tags;
  }

  for (const item of actor.items ?? []) {
    if (item.type === "themebook") {
      for (const [index, tag] of (item.system.powertags ?? []).entries()) {
        if (tag.name?.trim() && !tag.burned && !tag.toBurn) {
          tags.push({
            name: tag.name,
            positive: true,
            powerTag: true,
            toBurn: tag.toBurn,
            themebookId: item.id,
            source: null,
            index,
            selected: tag.selected === true,
          });
        }
      }
      for (const [index, tag] of (item.system.weaknesstags ?? []).entries()) {
        if (tag.name?.trim()) {
          tags.push({
            name: tag.name,
            positive: false,
            weakness: true,
            index,
            themebookId: item.id,
            source: null,
            selected: tag.selected === true,
          });
        }
      }
    }

    if (item.type === "rote" && item.name?.trim()) {
      tags.push({
        name: item.name,
        positive: true,
        roteId: item.id,
        source: "rote",
        selected: item.system.selected === true,
      });
    }

    if (item.type === "backpack") {
      for (const [index, tag] of (item.system.items ?? []).entries()) {
        if (tag.name?.trim() && !tag.expired && !tag.toBurn) {
          tags.push({
            name: tag.name,
            positive: true,
            index: index + 1,
            themebookId: tag.id,
            source: "backpack",
            toBurn: tag.toBurn,
            selected: tag.selected === true,
          });
        }
      }
    }
  }

  for (const [index, fellowship] of (
    actor.system.fellowships ?? []
  ).entries()) {
    if (fellowship.relationshipTag?.trim() && !fellowship.scratched) {
      tags.push({
        name: fellowship.relationshipTag,
        positive: true,
        fellowship: true,
        index: index + 1,
        source: "fellowship-relationship",
        selected: fellowship.selected === true,
      });
    }
  }

  const fellowshipThemecard =
    actor.sheet?.getActorFellowshipThemecard?.() ?? null;
  for (const [index, tag] of (
    fellowshipThemecard?.system.powertags ?? []
  ).entries()) {
    if (tag.name?.trim() && !tag.burned && !tag.toBurn) {
      tags.push({
        name: tag.name,
        positive: true,
        powerTag: true,
        index,
        source: "fellowship-themecard",
        toBurn: tag.toBurn,
        selected: tag.selected === true,
      });
    }
  }
  for (const [index, tag] of (
    fellowshipThemecard?.system.weaknesstags ?? []
  ).entries()) {
    if (tag.name?.trim()) {
      tags.push({
        name: tag.name,
        positive: false,
        weakness: true,
        index,
        source: "fellowship-themecard",
        selected: tag.selected === true,
      });
    }
  }

  for (const [index, tag] of (
    actor.system.floatingTagsAndStatuses ?? []
  ).entries()) {
    if (tag.name?.trim()) {
      tags.push({
        name: tag.name,
        positive: tag.positive,
        value: tag.value,
        isStatus: tag.value === undefined || tag.value > 0,
        index: index + 1,
        source: "floating-tag",
        might: tag.might,
        mightIcon: tag.mightIcon,
        selected: tag.selected === true,
      });
    }
  }

  return tags;
}

function getSceneTags(sceneApp) {
  const sceneDataItemId = sceneApp?.currentSceneDataItem?.id;
  return (sceneApp?.getSceneAndStoryTags?.() ?? [])
    .map((tag, index) => ({
      name: tag.name,
      positive: tag.positive,
      value: tag.value ?? 0,
      index,
      sceneDataItemId,
      source: "scene-and-story",
      might: tag.might,
      mightIcon: tag.mightIcon,
      selected: tag.selected === true,
    }))
    .filter((tag) => tag.name?.trim());
}

function getChallengeTags(sceneApp) {
  const combinedTags = sceneApp?.getCombinedSelectedNPCTags?.();
  if (combinedTags) {
    return combinedTags
      .filter((tag) => tag.name?.trim())
      .map((tag) => ({
        name: tag.name,
        positive: tag.positive,
        value: tag.value,
        index: tag.index,
        actorId: tag.actorId,
        source: "npc",
        might: tag.might,
        mightIcon: tag.mightIcon,
      }));
  }

  const actors = new Set(
    sceneApp
      ?.getCurrentScene?.()
      ?.tokens?.contents?.map((token) => token.actor)
      .filter((actor) => actor?.type === "litm-npc"),
  );
  const tags = [];

  for (const actor of actors) {
    for (const [index, tag] of (
      actor.system.floatingTagsAndStatuses ?? []
    ).entries()) {
      if (tag.name?.trim()) {
        tags.push({
          name: tag.name,
          positive: tag.positive,
          value: tag.value ?? 0,
          index,
          actorId: actor.id,
          source: "npc",
          might: tag.might,
          mightIcon: tag.mightIcon,
        });
      }
    }
  }

  return tags;
}

export function getRollActor({ actorId, actors, sceneApp }) {
  const sceneActor = sceneApp
    ?.getCurrentScene?.()
    ?.tokens?.contents?.map((token) => token.actor)
    .find((actor) => actor?.id === actorId);
  return sceneActor ?? actors.get(actorId);
}

export function buildTagCatalog({ actor, sceneApp }) {
  return {
    selectedTags: getActorTags(actor),
    selectedGmTags: (sceneApp?.getRollModifications?.() ?? [])
      .filter((tag) => tag.name?.trim())
      .map((tag) => ({ ...tag, source: "gm" })),
    selectedStoryTags: getSceneTags(sceneApp),
    challengeTags: getChallengeTags(sceneApp),
  };
}
