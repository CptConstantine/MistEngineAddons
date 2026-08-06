# Mist Engine Addons

Optional, opt-in quality-of-life and UI enhancements for the Legend in the Mist Foundry VTT system.

## Requirements

- Foundry Virtual Tabletop 14
- [Mist Engine](https://github.com/MrTheBino/mist-engine-fvtt) (`mist-engine-fvtt`) version 14

The module disables its features when the active game system or major version is unsupported.

## Installation

In Foundry's **Add-on Modules** tab, select **Install Module** and paste:

```
https://github.com/CptConstantine/MistEngineAddons/releases/latest/download/module.json
```

Enable **Mist Engine Addons** in a Legend in the Mist world. Enable **Organize story tags by theme** in **Configure Settings > Module Settings** to group the story-tag bar by theme on your client.

## Development

Install development dependencies and run the automated checks:

```powershell
npm install
npm run check
npm test
npm run validate:manifest
```

For local testing on Windows, identify the user-data folder configured in Foundry and create a directory junction in its `modules` directory:

```powershell
$foundryData = "C:\Path\To\FoundryVTT\Data"
cmd /c mklink /J "$foundryData\modules\mist-engine-addons" "$PWD"
```

Restart Foundry after changing JavaScript files. Use the module in a Foundry 14 world running the official `mist-engine-fvtt` system.

## Extension Policy

The module uses standard Foundry lifecycle hooks for additive behavior. New UI features should be opt-in, scoped under a module-owned `data-mist-engine-addons` attribute, and tolerate missing or changed system UI. The story-tag organizer runs after `renderMistSceneTagsOverlay`, preserving the system's existing tag elements while arranging them under theme labels. Prefer documented `game.mistenginefvtt` and `CONFIG.MIST_ENGINE` surfaces when a feature needs system data; do not replace system classes or mutate `ui.litmSceneTags` unless a feature specifically requires it and its compatibility impact is documented.

## Releases

Update the version in `module.json` and `package.json`, then push a matching semantic version tag such as `v0.1.0`. The release workflow validates the version, packages runtime files, and uploads the zip and `module.json` to GitHub Releases. If a tag push does not start a run, open the **Release** workflow in GitHub Actions, select **Run workflow**, and enter the existing tag.
