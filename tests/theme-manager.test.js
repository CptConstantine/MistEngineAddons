import assert from "node:assert/strict";
import test from "node:test";

import { STYLE_OVERRIDES } from "../scripts/constants.js";
import {
  applyStyleOverride,
  STYLE_OVERRIDE_DATASET_KEY,
  STYLE_OVERRIDE_LINK_ID,
} from "../scripts/theme-manager.js";

function createDocumentStub() {
  const links = [];

  return {
    documentElement: { dataset: {} },
    head: {
      append(link) {
        links.push(link);
      },
    },
    createElement(tagName) {
      const link = {
        tagName,
        remove() {
          const index = links.indexOf(link);
          if (index >= 0) {
            links.splice(index, 1);
          }
        },
      };
      return link;
    },
    getElementById(id) {
      return links.find((link) => link.id === id);
    },
    links,
  };
}

test("none leaves the document without a style override", () => {
  const document = createDocumentStub();

  assert.equal(
    applyStyleOverride({ theme: STYLE_OVERRIDES.NONE, document }),
    false,
  );
  assert.equal(document.links.length, 0);
  assert.equal(
    document.documentElement.dataset[STYLE_OVERRIDE_DATASET_KEY],
    undefined,
  );
});

test("a selected theme replaces the existing module stylesheet", () => {
  const document = createDocumentStub();

  assert.equal(
    applyStyleOverride({ theme: STYLE_OVERRIDES.CITY_OF_MIST, document }),
    true,
  );
  assert.equal(document.links.length, 1);
  assert.equal(document.links[0].id, STYLE_OVERRIDE_LINK_ID);
  assert.equal(document.links[0].rel, "stylesheet");
  assert.match(document.links[0].href, /styles\/city-of-mist\.css$/);
  assert.equal(
    document.documentElement.dataset[STYLE_OVERRIDE_DATASET_KEY],
    STYLE_OVERRIDES.CITY_OF_MIST,
  );

  assert.equal(
    applyStyleOverride({ theme: STYLE_OVERRIDES.OTHERSCAPE, document }),
    true,
  );
  assert.equal(document.links.length, 1);
  assert.match(document.links[0].href, /styles\/otherscape\.css$/);
  assert.equal(
    document.documentElement.dataset[STYLE_OVERRIDE_DATASET_KEY],
    STYLE_OVERRIDES.OTHERSCAPE,
  );

  assert.equal(
    applyStyleOverride({ theme: STYLE_OVERRIDES.NONE, document }),
    false,
  );
  assert.equal(document.links.length, 0);
  assert.equal(
    document.documentElement.dataset[STYLE_OVERRIDE_DATASET_KEY],
    undefined,
  );
});
