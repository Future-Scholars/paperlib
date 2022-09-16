<script setup lang="ts">
import { MainRendererStateStore } from "@/state/renderer/appstate";

import Options from "./components/options.vue";
import Toggle from "./components/toggle.vue";

const prefState = MainRendererStateStore.usePreferenceState();

const updatePrefs = (key: string, value: unknown) => {
  window.appInteractor.setPreference(key, value);
};
</script>

<template>
  <div class="flex flex-col w-full text-neutral-800 dark:text-neutral-300">
    <div class="text-base font-semibold mb-4">
      {{ $t("preference.sidebar") }}
    </div>

    <Toggle
      class="mb-5"
      :title="$t('preference.displaycountnumber')"
      :info="$t('preference.displaycountnumberintro')"
      :enable="prefState.showSidebarCount"
      @update="(value) => updatePrefs('showSidebarCount', value)"
    />
    <Toggle
      class="mb-5"
      :title="$t('preference.compactsidebar')"
      :info="$t('preference.compactsidebarintro')"
      :enable="prefState.isSidebarCompact"
      @update="(value) => updatePrefs('isSidebarCompact', value)"
    />
    <Options
      class="mb-5"
      :title="$t('preference.sortby')"
      :info="$t('preference.sortbyintro')"
      :selected="prefState.sidebarSortBy"
      :options="{
        name: $t('preference.name'),
        count: $t('preference.count'),
        color: $t('preference.color'),
      }"
      @update="
        (value) => {
          updatePrefs('sidebarSortBy', value);
        }
      "
    />
    <Options
      class="mb-8"
      :title="$t('preference.sortorder')"
      :info="$t('preference.sortorderintro')"
      :selected="prefState.sidebarSortOrder"
      :options="{ asce: $t('preference.asc'), desc: $t('preference.desc') }"
      @update="
        (value) => {
          updatePrefs('sidebarSortOrder', value);
        }
      "
    />
  </div>
</template>
