<script setup lang="ts">
import { ref } from "vue";

import { PreferenceStore } from "../../../../preload/utils/preference";
import HotkeyOption from "./components/hotkey-options.vue";

const props = defineProps({
  preference: {
    type: Object as () => PreferenceStore,
    required: true,
  },
});

let existingShortcuts = {
  shortcutPlugin: props.preference.shortcutPlugin,
  shortcutPreview: props.preference.shortcutPreview,
  shortcutOpen: props.preference.shortcutOpen,
  shortcutCopy: props.preference.shortcutCopy,
  shortcutCopyKey: props.preference.shortcutCopyKey,
  shortcutScrape: props.preference.shortcutScrape,
  shortcutEdit: props.preference.shortcutEdit,
  shortcutFlag: props.preference.shortcutFlag,
};

const info = ref("");

const onUpdate = (key: string, value: string) => {
  const keyParts = value.split("+");
  const modifier1 = keyParts[0];
  const modifier2 = keyParts[1];
  const keyName = keyParts[2];

  if (keyName === "none") {
    window.appInteractor.updatePreference(key, "");
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
    window.appInteractor.updatePreference(key, newShortcut);
  }
};
</script>

<template>
  <div class="flex flex-col w-full text-neutral-800 dark:text-neutral-300">
    <div class="text-base font-semibold mb-2">Hotkeys</div>
    <div class="text-xs underline text-neutral-600 dark:text-neutral-500 mb-5">
      Please restart Paperlib to take effect.
    </div>
    <div class="flex flex-col space-y-2 mb-5">
      <HotkeyOption
        title="Open PDF"
        :choosed-key="preference.shortcutOpen"
        @update="(key) => onUpdate('shortcutOpen', key)"
      />
      <HotkeyOption
        title="Scrape Metadata"
        :choosed-key="preference.shortcutScrape"
        @update="(key) => onUpdate('shortcutScrape', key)"
      />
      <HotkeyOption
        title="Edit Metadata"
        :choosed-key="preference.shortcutEdit"
        @update="(key) => onUpdate('shortcutEdit', key)"
      />
      <HotkeyOption
        title="Flag"
        :choosed-key="preference.shortcutFlag"
        @update="(key) => onUpdate('shortcutFlag', key)"
      />
      <HotkeyOption
        title="Open Bibtex Insert Plugin"
        :choosed-key="preference.shortcutPlugin"
        @update="(key) => onUpdate('shortcutPlugin', key)"
      />
      <HotkeyOption
        title="Copy Bibtex to Clipboard"
        :choosed-key="preference.shortcutCopy"
        @update="(key) => onUpdate('shortcutCopy', key)"
      />
      <HotkeyOption
        title="Copy Bibtex Key to Clipboard"
        :choosed-key="preference.shortcutCopyKey"
        @update="(key) => onUpdate('shortcutCopyKey', key)"
      />
    </div>
    <div class="text-xs text-red-600 dark:text-red-500 mb-5">
      {{ info }}
    </div>
  </div>
</template>
