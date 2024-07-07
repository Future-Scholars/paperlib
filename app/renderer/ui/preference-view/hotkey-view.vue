<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { IPreferenceStore } from "@/main/services/preference-service";

import HotkeyOption from "./components/hotkey-options.vue";

const i18n = useI18n();
const prefState = preferenceService.useState();
const PRIMARY_KEYS = ["Control", "Command"];
const SECONDARY_KEYS = ["Alt", "Shift", "Command"];

const info = ref("");

const onUpdate = (key: keyof IPreferenceStore, value: string) => {
  const newShortcut = value.trim();
  if (value.trim().length === 0) {
    preferenceService.set({ [key]: "" });
    return;
  }

  const keyParts = value.trim().split("+");
  const keysLength = keyParts.length;

  if (keysLength === 1) {
    const keyName = keyParts[0];
    if (
      keyName !== "Enter" &&
      keyName !== "Space" &&
      keyName !== "Delete" &&
      keyName !== "Backspace" &&
      !keyName.match(/F\d+/)
    ) {
      const warningInfo = i18n.t("preference.hotkeysInvalidSingleKeyInfo");
      info.value = warningInfo;
      PLAPI.logService.warn(warningInfo, "", true, "ShortcutUI");
      return;
    }
  } else if (keysLength === 2) {
    const modifier1 = keyParts[0];
    const keyName = keyParts[1];
    const isModifier1Valid = PRIMARY_KEYS.includes(modifier1);
    const isKeyNameValid =
      !SECONDARY_KEYS.includes(keyName) && keyName !== "Meta";
    if (!isModifier1Valid || !isKeyNameValid) {
      const warningInfo = i18n.t("preference.hotkeysInvalidMultipleKeysInfo");
      info.value = warningInfo;
      PLAPI.logService.warn(warningInfo, "", true, "ShortcutUI");
      return;
    }
  } else if (keysLength === 3) {
    const modifier1 = keyParts[0];
    const modifier2 = keyParts[1];
    const keyName = keyParts[2];

    const isModifier1Valid = PRIMARY_KEYS.includes(modifier1);
    const isModifier2Valid = SECONDARY_KEYS.includes(modifier2);
    const isKeyNameValid = ![...PRIMARY_KEYS, ...SECONDARY_KEYS].includes(
      keyName
    );
    if (!isModifier1Valid || !isModifier2Valid || !isKeyNameValid) {
      const warningInfo = i18n.t("preference.hotkeysInvalidMultipleKeysInfo");
      info.value = warningInfo;
      PLAPI.logService.warn(warningInfo, "", true, "ShortcutUI");
      return;
    }
  }
  let existingShortcuts = {
    shortcutPlugin: prefState.shortcutPlugin,
    shortcutPreview: prefState.shortcutPreview,
    shortcutOpen: prefState.shortcutOpen,
    shortcutCopy: prefState.shortcutCopy,
    shortcutCopyKey: prefState.shortcutCopyKey,
    shortcutScrape: prefState.shortcutScrape,
    shortcutEdit: prefState.shortcutEdit,
    shortcutFlag: prefState.shortcutFlag,
    shortcutDelete: prefState.shortcutDelete,
  };

  // Check if the shortcut is already used by others
  if (
    Object.values(existingShortcuts).includes(newShortcut) &&
    // @ts-ignore
    newShortcut !== existingShortcuts[key]
  ) {
    const warningInfo = i18n.t("preference.hotkeysDuplicateKeysInfo");
    info.value = warningInfo;
    PLAPI.logService.warn(warningInfo, "", true, "ShortcutUI");
    return;
  }
  info.value = "";
  preferenceService.set({ [key]: newShortcut });
};
const onGlobalShortcutChange=(key:string)=>{
  onUpdate('shortcutPlugin', key)
  PLMainAPI.menuService.disableGlobalShortcuts();
  PLMainAPI.menuService.enableGlobalShortcuts();
}
</script>

<template>
  <div
    class="flex flex-col text-neutral-800 dark:text-neutral-300 w-[400px] md:w-[500px] lg:w-[700px]"
  >
    <div class="text-base font-semibold mb-2">
      {{ $t("preference.hotkeys") }}
    </div>
    <div class="flex flex-col space-y-2 mb-5">
      <HotkeyOption
        :title="$t('preference.hotkeysOpenPDFLabel')"
        :choosed-key="prefState.shortcutOpen"
        @event:change="(key) => onUpdate('shortcutOpen', key)"
      />
      <HotkeyOption
        :title="$t('menu.rescrape')"
        :choosed-key="prefState.shortcutScrape"
        @event:change="(key) => onUpdate('shortcutScrape', key)"
      />
      <HotkeyOption
        :title="$t('preference.hotkeysEditLabel')"
        :choosed-key="prefState.shortcutEdit"
        @event:change="(key) => onUpdate('shortcutEdit', key)"
      />
      <HotkeyOption
        :title="$t('menu.flag')"
        :choosed-key="prefState.shortcutFlag"
        @event:change="(key) => onUpdate('shortcutFlag', key)"
      />
      <HotkeyOption
        :title="$t('preference.hotkeysPluginLabel')"
        :choosed-key="prefState.shortcutPlugin"
        @event:change="onGlobalShortcutChange"
      />
      <HotkeyOption
        :title="$t('menu.copybibtext')"
        :choosed-key="prefState.shortcutCopy"
        @event:change="(key) => onUpdate('shortcutCopy', key)"
      />
      <HotkeyOption
        :title="$t('menu.copybibtextkey')"
        :choosed-key="prefState.shortcutCopyKey"
        @event:change="(key) => onUpdate('shortcutCopyKey', key)"
      />

      <HotkeyOption
        :title="$t('menu.delete')"
        :choosed-key="prefState.shortcutDelete"
        @event:change="(key) => onUpdate('shortcutDelete', key)"
      />
    </div>
    <div class="text-xs text-red-600 dark:text-red-500 mb-5">
      {{ info }}
    </div>
  </div>
</template>
