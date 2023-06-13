<script setup lang="ts">
import { ref } from "vue";

import { IPreferenceStore } from "@/services/preference-service";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import HotkeyOption from "./components/hotkey-options.vue";

const prefState = preferenceService.useState();

let existingShortcuts = {
  shortcutPlugin: prefState.shortcutPlugin,
  shortcutPreview: prefState.shortcutPreview,
  shortcutOpen: prefState.shortcutOpen,
  shortcutCopy: prefState.shortcutCopy,
  shortcutCopyKey: prefState.shortcutCopyKey,
  shortcutScrape: prefState.shortcutScrape,
  shortcutEdit: prefState.shortcutEdit,
  shortcutFlag: prefState.shortcutFlag,
};

const info = ref("");

const onUpdate = (key: keyof IPreferenceStore, value: string) => {
  const keyParts = value.split("+");
  const modifier1 = keyParts[0];
  const modifier2 = keyParts[1];
  const keyName = keyParts[2];

  if (keyName === "none") {
    preferenceService.set(key, "");
  } else if (modifier2 === "Shift" && modifier1 === "none") {
    return;
  } else if (
    modifier1 === "none" &&
    modifier2 === "none" &&
    keyName !== "Enter" &&
    keyName !== "Space"
  ) {
    info.value = "Cannot use single key.";
    return;
  } else {
    const newShortcut = [modifier1, modifier2, keyName]
      .filter((v) => v !== "none")
      .join("+");

    // Check if the shortcut is already used by others
    if (
      Object.values(existingShortcuts).includes(newShortcut) &&
      // @ts-ignore
      newShortcut !== existingShortcuts[key]
    ) {
      info.value = "This shortcut is already used by another shortcut.";
      return;
    }
    info.value = "";
    preferenceService.set(key, newShortcut);
  }
};
</script>

<template>
  <div class="flex flex-col w-full text-neutral-800 dark:text-neutral-300">
    <div class="text-base font-semibold mb-2">
      {{ $t("preference.hotkeys") }}
    </div>
    <div class="text-xs underline text-neutral-600 dark:text-neutral-500 mb-5">
      ⚠️ {{ $t("preference.pleaserestart") }}
    </div>
    <div class="flex flex-col space-y-2 mb-5">
      <HotkeyOption
        title="Open PDF"
        :choosed-key="prefState.shortcutOpen"
        @update="(key) => onUpdate('shortcutOpen', key)"
      />
      <HotkeyOption
        title="Scrape Metadata"
        :choosed-key="prefState.shortcutScrape"
        @update="(key) => onUpdate('shortcutScrape', key)"
      />
      <HotkeyOption
        title="Edit Metadata"
        :choosed-key="prefState.shortcutEdit"
        @update="(key) => onUpdate('shortcutEdit', key)"
      />
      <HotkeyOption
        title="Flag"
        :choosed-key="prefState.shortcutFlag"
        @update="(key) => onUpdate('shortcutFlag', key)"
      />
      <HotkeyOption
        title="Open Quick Reference Plugin"
        :choosed-key="prefState.shortcutPlugin"
        @update="(key) => onUpdate('shortcutPlugin', key)"
      />
      <HotkeyOption
        title="Copy Bibtex to Clipboard"
        :choosed-key="prefState.shortcutCopy"
        @update="(key) => onUpdate('shortcutCopy', key)"
      />
      <HotkeyOption
        title="Copy Bibtex Key to Clipboard"
        :choosed-key="prefState.shortcutCopyKey"
        @update="(key) => onUpdate('shortcutCopyKey', key)"
      />
    </div>
    <div class="text-xs text-red-600 dark:text-red-500 mb-5">
      {{ info }}
    </div>
  </div>
</template>
