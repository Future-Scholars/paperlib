<script setup lang="ts">
import { IPreferenceStore } from "@/common/services/preference-service";

import Options from "./components/options.vue";
import Toggle from "./components/toggle.vue";

const prefState = preferenceService.useState();

const updatePref = (key: keyof IPreferenceStore, value: unknown) => {
  preferenceService.set({ [key]: value });
};
</script>

<template>
  <div
    class="flex flex-col text-neutral-800 dark:text-neutral-300 w-[400px] md:w-[500px] lg:w-[700px]"
  >
    <div class="text-base font-semibold mb-4">
      {{ $t("preference.sidebar") }}
    </div>

    <Toggle
      class="mb-5"
      :title="$t('preference.displaycountnumber')"
      :info="$t('preference.displaycountnumberintro')"
      :enable="prefState.showSidebarCount"
      @update="(value) => updatePref('showSidebarCount', value)"
    />
    <Toggle
      class="mb-5"
      :title="$t('preference.compactsidebar')"
      :info="$t('preference.compactsidebarintro')"
      :enable="prefState.isSidebarCompact"
      @update="(value) => updatePref('isSidebarCompact', value)"
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
          updatePref('sidebarSortBy', value);
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
          updatePref('sidebarSortOrder', value);
        }
      "
    />
  </div>
</template>
