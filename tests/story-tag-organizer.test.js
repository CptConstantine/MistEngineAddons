import assert from "node:assert/strict";
import test from "node:test";

import { groupStoryTagsByTheme } from "../scripts/ui/story-tag-organizer.js";

test("groups story tags by theme in first-seen order", () => {
  const storyTags = [
    { name: "Firebreathing", theme: "Dragonborn" },
    { name: "Keen Senses", theme: "Elven" },
    { name: "Heat Resistance", theme: "Dragonborn" },
  ];

  assert.deepEqual(
    groupStoryTagsByTheme(storyTags, (storyTag) => storyTag.theme),
    [
      {
        theme: "Dragonborn",
        tags: [storyTags[0], storyTags[2]],
      },
      {
        theme: "Elven",
        tags: [storyTags[1]],
      },
    ],
  );
});

test("places tags without a theme in a final untitled group", () => {
  const storyTags = [
    { name: "Firebreathing", theme: "Dragonborn" },
    { name: "Unusual Circumstance", theme: "" },
  ];

  assert.deepEqual(
    groupStoryTagsByTheme(storyTags, (storyTag) => storyTag.theme),
    [
      {
        theme: "Dragonborn",
        tags: [storyTags[0]],
      },
      {
        theme: "Unthemed",
        tags: [storyTags[1]],
      },
    ],
  );
});
