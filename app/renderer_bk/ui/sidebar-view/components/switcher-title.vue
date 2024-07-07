<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  titles: {
    type: Object as () => Array<String>,
    required: true,
  },
});

const emits = defineEmits(["changed"]);

const selected = ref(0);
</script>

<template>
  <div class="flex px-6">
    <div
      class="my-auto text-xxs font-bold text-neutral-400 dark:text-neutral-500 select-none flex space-x-2"
    >
      <div
        class="cursor-pointer transition ease-in-out hover:text-neutral-500 dark:hover:text-neutral-300"
        :class="
          titles.indexOf(title) === selected
            ? 'text-neutral-500 hover:text-neutral-600 dark:text-neutral-400 dark:hover:text-neutral-200'
            : ''
        "
        v-for="title of titles"
        @click="
          () => {
            selected = titles.indexOf(title);
            emits('changed', selected);
          }
        "
      >
        {{ title }}
      </div>
    </div>
  </div>
</template>
