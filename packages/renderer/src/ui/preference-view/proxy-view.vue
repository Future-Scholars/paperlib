<script setup lang="ts">
import { ref } from "vue";

import { PreferenceStore } from "../../../../preload/utils/preference";

const props = defineProps({
  preference: {
    type: Object as () => PreferenceStore,
    required: true,
  },
});

const httpproxy = ref(props.preference.httpproxy);
const httpsproxy = ref(props.preference.httpsproxy);

const onUpdate = (key: string, value: unknown) => {
  window.appInteractor.updatePreference(key, value);
};
</script>

<template>
  <div class="flex flex-col w-full text-neutral-800 dark:text-neutral-300">
    <div class="text-base font-semibold mb-1">Proxy</div>
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
