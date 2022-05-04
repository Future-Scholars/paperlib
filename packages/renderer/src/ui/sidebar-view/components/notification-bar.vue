<script setup lang="ts">
import { ref } from "vue";

const processInformation = ref("Notification...");
const isShown = ref(false);

window.appInteractor.registerState(
  "viewState.processingQueueCount",
  (value) => {
    const processingQueueCount = JSON.parse(value as string) as number;
    if (processingQueueCount > 0) {
      isShown.value = true;
    } else {
      isShown.value = false;
    }
  }
);

window.appInteractor.registerState("viewState.processInformation", (value) => {
  processInformation.value = value as string;
});
</script>

<template>
  <div class="flex w-full h-8">
    <span
      class="m-auto w-4/5 truncate text-center text-xxs text-neutral-500"
      v-show="isShown"
    >
      {{ processInformation }}
    </span>
  </div>
</template>
