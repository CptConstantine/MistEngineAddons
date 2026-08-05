import { readFile } from "node:fs/promises";

import { FOUNDRY_MAJOR_VERSION, MODULE_ID, SYSTEM_ID } from "./constants.js";

const manifest = JSON.parse(
  await readFile(new URL("../module.json", import.meta.url), "utf8"),
);
const expectedVersion = process.env.RELEASE_VERSION;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(manifest.id === MODULE_ID, `Expected module id '${MODULE_ID}'.`);
assert(manifest.version, "A module version is required.");
assert(
  manifest.compatibility?.minimum === String(FOUNDRY_MAJOR_VERSION),
  `Expected Foundry minimum version ${FOUNDRY_MAJOR_VERSION}.`,
);
assert(
  manifest.relationships?.systems?.some((system) => system.id === SYSTEM_ID),
  `Expected '${SYSTEM_ID}' as a required system relationship.`,
);
assert(
  manifest.esmodules?.includes("scripts/main.js"),
  "Expected scripts/main.js ESM entry point.",
);
assert(
  manifest.manifest?.startsWith("https://"),
  "A public HTTPS manifest URL is required.",
);
assert(
  manifest.download?.startsWith("https://"),
  "A public HTTPS download URL is required.",
);

if (expectedVersion) {
  assert(
    manifest.version === expectedVersion,
    `Expected module version '${expectedVersion}'.`,
  );
}

console.log(`Validated ${manifest.id} v${manifest.version}.`);
