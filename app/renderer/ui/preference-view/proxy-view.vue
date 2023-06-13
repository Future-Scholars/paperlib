<script setup lang="ts">
import { ref } from "vue";

import { MainRendererStateStore } from "@/state/renderer/appstate";

import Toggle from "./components/toggle.vue";

const prefState = MainRendererStateStore.usePreferenceState();

const httpproxy = ref(prefState.httpproxy);
const httpsproxy = ref(prefState.httpsproxy);

const onUpdate = (key: string, value: unknown) => {
  preferenceService.set(key, value);
};
</script>

<template>
  <div
    class="flex flex-col w-full text-neutral-800 dark:text-neutral-300 max-w-xl"
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
      @update="(value) => onUpdate('allowproxy', value)"
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
