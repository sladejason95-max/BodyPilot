import type { Preset } from "@/lib/types";

const PRESET_KEY = "bodypilot-presets-v1";
const LEGACY_PRESET_KEY = "stage-prep-presets-v1";

export function loadPresets(): Preset[] {
  try {
    const raw = window.localStorage.getItem(PRESET_KEY) ?? window.localStorage.getItem(LEGACY_PRESET_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Failed to load presets", e);
    return [];
  }
}

export function savePresets(presets: Preset[]) {
  try {
    window.localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
  } catch (e) {
    console.warn("Failed to save presets", e);
  }
}

export function upsertPreset(presets: Preset[], preset: Preset, limit = 12): Preset[] {
  return [preset, ...presets.filter((p) => p.name !== preset.name)].slice(0, limit);
}

export function removePreset(presets: Preset[], name: string): Preset[] {
  return presets.filter((p) => p.name !== name);
}
