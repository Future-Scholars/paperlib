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
    <div class="text-base font-semibold mb-4">Sidebar Options</div>

    <Toggle
      class="mb-5"
      title="Display Count Number"
      info="Show the count badges in the sidebar."
      :enable="prefState.showSidebarCount"
      @update="(value) => updatePrefs('showSidebarCount', value)"
    />
    <Toggle
      class="mb-5"
      title="Compact Sidebar"
      info="Reduce the line height of the sidebar item."
      :enable="prefState.isSidebarCompact"
      @update="(value) => updatePrefs('isSidebarCompact', value)"
    />
    <Options
      class="mb-5"
      title="Sort By"
      info="Sort tags and folders in the sidebar by."
      :selected="prefState.sidebarSortBy"
      :options="{ name: 'Name', count: 'Count', color: 'Color' }"
      @update="
        (value) => {
          updatePrefs('sidebarSortBy', value);
        }
      "
    />
    <Options
      class="mb-8"
      title="Sort Order"
      info="The order of sorting tags and folders in the sidebar."
      :selected="prefState.sidebarSortOrder"
      :options="{ asce: 'Ascending', desc: 'Descending' }"
      @update="
        (value) => {
          updatePrefs('sidebarSortOrder', value);
        }
      "
    />
  </div>
</template>
