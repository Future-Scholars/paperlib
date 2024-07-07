<script setup lang="ts">
import { ref } from "vue";

import { IPreferenceStore } from "@/common/services/preference-service";

import Toggle from "./components/toggle.vue";

const prefState = preferenceService.useState();

const httpproxy = ref(prefState.httpproxy);
const httpsproxy = ref(prefState.httpsproxy);

const onUpdate = (key: keyof IPreferenceStore, value: unknown) => {
  preferenceService.set({ [key]: value });
};
</script>

<template>
  <div
    class="flex flex-col text-neutral-800 dark:text-neutral-300 w-[400px] md:w-[500px] lg:w-[700px]"
  >
    <div class="text-base font-semibold mb-1">{{ $t("preference.proxy") }}</div>

    <div class="text-xs underline text-neutral-600 dark:text-neutral-500 mb-5">
      ⚠️ {{ $t("preference.pleaserestart") }}
    </div>

    <Toggle
      class="mb-5"
      :title="$t('preference.allowproxy')"
      :info="$t('preference.allowproxyintro')"
      :enable="prefState.allowproxy"
      @event:change="(value) => onUpdate('allowproxy', value)"
    />

    <input
      class="p-2 rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none mb-2"
      type="text"
      placeholder="http://proxy_url:port"
      v-model="httpproxy"
      @input="(event) => onUpdate('httpproxy', httpproxy)"
    />

    <input
      class="p-2 rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none mb-2"
      type="text"
      placeholder="https://proxy_url:port"
      v-model="httpsproxy"
      @input="(event) => onUpdate('httpsproxy', httpsproxy)"
    />
  </div>
</template>
