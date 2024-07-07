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
      {{ $t("mainview.publication") }}
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
        class="hidden group-hover:block"
        v-if="(volume || pages || number || publisher) && !isExpanded"
        >»</span
      >
    </div>
    <div
      class="group text-xxs cursor-pointer space-x-3"
      v-if="isExpanded"
      @click="isExpanded = !isExpanded"
    >
      <span v-if="volume"
        ><span class="italic">volume: </span>{{ volume }}</span
      >
      <span v-if="pages"><span class="italic">pages: </span>{{ pages }}</span>
      <span v-if="number">
        <span class="italic">issue/number: </span>{{ number }}
      </span>
      <span v-if="publisher">
        <span class="italic">publisher: </span>{{ publisher }}
      </span>
      <span class="invisible group-hover:visible">«</span>
    </div>
  </div>
</template>
