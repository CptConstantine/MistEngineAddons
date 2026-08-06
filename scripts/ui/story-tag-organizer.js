const UNTHEMED_GROUP = "Unthemed";

const STORY_TAGS_SELECTOR = ".litm-sto-story .litm-sto-tags";
const STORY_TAG_CLASS = "litm-sto-tag";
const GROUP_CLASS = "mist-engine-addons-theme-group";
const HEADING_CLASS = "mist-engine-addons-theme-heading";
const ORGANIZED_CLASS = "mist-engine-addons-organized";
const ORGANIZED_DATA_ATTRIBUTE = "mistEngineAddonsOrganized";

export function groupStoryTagsByTheme(storyTags, getTheme) {
  const groups = new Map();

  for (const storyTag of storyTags) {
    const theme = getTheme(storyTag)?.trim() || UNTHEMED_GROUP;
    const group = groups.get(theme) ?? [];
    group.push(storyTag);
    groups.set(theme, group);
  }

  return [...groups].map(([theme, tags]) => ({ theme, tags }));
}

export function organizeStoryTagOverlay(html) {
  const root = html?.querySelector ? html : html?.[0];
  const storyTagsContainer = root?.querySelector?.(STORY_TAGS_SELECTOR);
  if (
    !storyTagsContainer ||
    storyTagsContainer.dataset[ORGANIZED_DATA_ATTRIBUTE] === "true"
  ) {
    return false;
  }

  const storyTags = [...storyTagsContainer.children].filter((element) =>
    element.classList.contains(STORY_TAG_CLASS),
  );
  if (storyTags.length === 0) {
    return false;
  }

  const document = storyTagsContainer.ownerDocument;
  const themeGroups = groupStoryTagsByTheme(storyTags, (storyTag) =>
    storyTag.getAttribute("title"),
  );
  const fragment = document.createDocumentFragment();

  for (const { theme, tags } of themeGroups) {
    const group = document.createElement("div");
    group.classList.add(GROUP_CLASS);
    group.dataset.theme = theme;

    const heading = document.createElement("span");
    heading.classList.add(HEADING_CLASS);
    heading.textContent = theme;
    group.append(heading, ...tags);
    fragment.append(group);
  }

  storyTagsContainer.replaceChildren(fragment);
  storyTagsContainer.classList.add(ORGANIZED_CLASS);
  storyTagsContainer.dataset[ORGANIZED_DATA_ATTRIBUTE] = "true";
  return true;
}
