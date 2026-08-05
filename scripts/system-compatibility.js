import { FOUNDRY_MAJOR_VERSION, SYSTEM_ID } from "./constants.js";

export function getMajorVersion(version) {
  const match = /^(\d+)/.exec(String(version ?? ""));
  return match ? Number(match[1]) : null;
}

export function getCompatibility({ foundryVersion, systemId, systemVersion }) {
  const foundryMajor = getMajorVersion(foundryVersion);
  const systemMajor = getMajorVersion(systemVersion);

  if (systemId !== SYSTEM_ID) {
    return { compatible: false, reason: "wrong-system" };
  }

  if (foundryMajor !== FOUNDRY_MAJOR_VERSION) {
    return { compatible: false, reason: "wrong-foundry-version" };
  }

  if (systemMajor !== FOUNDRY_MAJOR_VERSION) {
    return { compatible: false, reason: "wrong-system-version" };
  }

  return { compatible: true, reason: null };
}

export function getRuntimeCompatibility(runtime) {
  return getCompatibility({
    foundryVersion: runtime.release?.generation ?? runtime.version,
    systemId: runtime.system?.id,
    systemVersion: runtime.system?.version,
  });
}

export function getCompatibilityMessageKey(reason) {
  const messages = {
    "wrong-system": "MIST_ENGINE_ADDONS.Compatibility.WrongSystem",
    "wrong-foundry-version":
      "MIST_ENGINE_ADDONS.Compatibility.WrongFoundryVersion",
    "wrong-system-version":
      "MIST_ENGINE_ADDONS.Compatibility.WrongSystemVersion",
  };

  return messages[reason] ?? "MIST_ENGINE_ADDONS.Compatibility.Unknown";
}
