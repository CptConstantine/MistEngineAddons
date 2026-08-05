import assert from "node:assert/strict";
import test from "node:test";

import {
  getCompatibility,
  getCompatibilityMessageKey,
  getMajorVersion,
  getRuntimeCompatibility,
} from "../scripts/system-compatibility.js";

test("extracts the numeric major version", () => {
  assert.equal(getMajorVersion("14.65"), 14);
  assert.equal(getMajorVersion("v14"), null);
  assert.equal(getMajorVersion(undefined), null);
});

test("accepts Legend in the Mist on Foundry 14", () => {
  assert.deepEqual(
    getCompatibility({
      foundryVersion: "14.347",
      systemId: "litmv2",
      systemVersion: "14.65",
    }),
    { compatible: true, reason: null },
  );
});

test("rejects a different game system", () => {
  assert.deepEqual(
    getCompatibility({
      foundryVersion: "14.347",
      systemId: "dnd5e",
      systemVersion: "4.0.0",
    }),
    { compatible: false, reason: "wrong-system" },
  );
});

test("rejects unsupported Foundry or system majors", () => {
  assert.equal(
    getCompatibility({
      foundryVersion: "15.0.0",
      systemId: "litmv2",
      systemVersion: "14.65",
    }).reason,
    "wrong-foundry-version",
  );
  assert.equal(
    getCompatibility({
      foundryVersion: "14.347",
      systemId: "litmv2",
      systemVersion: "15.0.0",
    }).reason,
    "wrong-system-version",
  );
});

test("reads Foundry runtime fields without depending on global state", () => {
  assert.deepEqual(
    getRuntimeCompatibility({
      release: { generation: 14 },
      system: { id: "litmv2", version: "14.65" },
    }),
    { compatible: true, reason: null },
  );
});

test("maps compatibility reasons to localized message keys", () => {
  assert.equal(
    getCompatibilityMessageKey("wrong-system"),
    "MIST_ENGINE_ADDONS.Compatibility.WrongSystem",
  );
  assert.equal(
    getCompatibilityMessageKey("unexpected"),
    "MIST_ENGINE_ADDONS.Compatibility.Unknown",
  );
});
