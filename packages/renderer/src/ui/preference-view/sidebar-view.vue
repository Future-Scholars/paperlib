<script setup lang="ts">
import Options from "./components/options.vue";
import Toggle from "./components/toggle.vue";

import { PreferenceStore } from "../../../../preload/utils/preference";

const props = defineProps({
  preference: {
    type: Object as () => PreferenceStore,
    required: true,
  },
});

const onUpdate = (key: string, value: unknown) => {
  window.appInteractor.updatePreference(key, value);
};
</script>

<template>
  <div class="flex flex-col w-full text-neutral-800 dark:text-neutral-300">
    <div class="text-base font-semibold mb-4">Sidebar Options</div>

    <Toggle
      class="mb-5"
      title="Display Count Number"
      info="Show the count badges in the sidebar."
      :enable="preference.showSidebarCount"
      @update="(value) => onUpdate('showSidebarCount', value)"
    />
    <Toggle
      class="mb-5"
      title="Compact Sidebar"
      info="Reduce the line height of the sidebar item."
      :enable="preference.isSidebarCompact"
      @update="(value) => onUpdate('isSidebarCompact', value)"
    />
    <Options
      class="mb-5"
      title="Sort By"
      info="Sort tags and folders in the sidebar by."
      :selected="preference.sidebarSortBy"
      :options="{ name: 'Name', count: 'Count', color: 'Color' }"
      @update="
        (value) => {
          onUpdate('sidebarSortBy', value);
        }
      "
    />
    <Options
      class="mb-8"
      title="Sort Order"
      info="The order of sorting tags and folders in the sidebar."
      :selected="preference.sidebarSortOrder"
      :options="{ asce: 'Ascending', desc: 'Descending' }"
      @update="
        (value) => {
          onUpdate('sidebarSortOrder', value);
        }
      "
    />
  </div>
</template>
