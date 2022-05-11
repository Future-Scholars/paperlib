<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  publication: String,
  volume: String,
  pages: String,
  number: String,
  publisher: String,
});

const isExpanded = ref(false);
</script>

<template>
  <div class="pt-3">
    <div class="text-xxs text-neutral-400 dark:text-neutral-500 select-none">
      Publication
    </div>
    <div
      class="group text-xxs cursor-pointer"
      @click="
        () => {
          if (volume || pages || number || publisher) {
            isExpanded = !isExpanded;
          }
        }
      "
    >
      {{ publication }}
      <span
        class="invisible group-hover:visible"
        v-if="volume || pages || number || publisher"
        >»</span
      >
    </div>
    <div
      class="group text-xxs cursor-pointer space-x-1"
      v-if="isExpanded"
      @click="isExpanded = !isExpanded"
    >
      <span v-if="volume">volume: {{ volume }}</span>
      <span v-if="pages">pages: {{ pages }}</span>
      <span v-if="number">number: {{ number }}</span>
      <span v-if="publisher">publisher: {{ publisher }}</span>
      <span class="invisible group-hover:visible">«</span>
    </div>
  </div>
</template>
