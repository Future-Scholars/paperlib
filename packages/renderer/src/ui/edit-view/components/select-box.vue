<script setup lang="ts">
import "vue-select/dist/vue-select.css";

defineProps({
  placeholder: {
    type: String,
    required: true,
  },
  options: {
    type: Array as () => String[],
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["changed"]);

const onChanged = (value: string) => {
  emit("changed", value);
};
</script>

<style>
.vue-select .vs__dropdown-toggle {
  border: none;
  padding: 0;
  padding-left: 0.7rem;
  padding-right: 0.7rem;
}
.vue-select .vs__search {
  padding: 0;
  margin: 0;
  border: 0;
  font-size: 0.75rem;
  line-height: 1rem;
}

.vue-select .vs__actions {
  padding: 0;
  margin: 0;
  border: 0;
  font-size: 0.75rem;
  line-height: 1rem;
  cursor: pointer;
}

.vue-select .vs__dropdown-menu {
  --tw-drop-shadow: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07))
    drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast)
    var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate)
    var(--tw-sepia) var(--tw-drop-shadow);
  border-bottom-left-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
  background-color: rgb(229 229 229 / var(--tw-bg-opacity));
  border: 0;
}

.vue-select .vs__selected {
  padding: 0;
  margin: 0;
  max-height: 16px;
}

@media (prefers-color-scheme: dark) {
  .vue-select .vs__selected {
    --tw-text-opacity: 1;
    color: rgb(212 212 212 / var(--tw-text-opacity));
  }

  .vue-select .vs__open-indicator {
    fill: rgb(212 212 212 / var(--tw-text-opacity));
  }

  .vue-select .vs__dropdown-menu {
    background-color: rgb(64 64 64 / var(--tw-bg-opacity));
  }
}
</style>

<template>
  <div class="flex flex-col rounded-md py-1 bg-neutral-200 dark:bg-neutral-700">
    <label
      :for="placeholder"
      class="mx-3 text-xxs text-neutral-500 dark:text-neutral-400"
    >
      {{ placeholder }}
    </label>
    <v-select
      :options="options"
      v-model="value"
      class="vue-select text-xs dark:text-neutral-300"
      transition="none"
      :clearable="false"
      @option:selected="onChanged"
    ></v-select>
  </div>
</template>
