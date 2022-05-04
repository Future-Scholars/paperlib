<script setup lang="ts">
import "vue-select/dist/vue-select.css";

const props = defineProps({
  placeholder: {
    type: String,
    required: true,
  },
  options: {
    type: Array as () => String[],
    required: true,
  },
  values: {
    type: Array as () => String[],
    required: true,
  },
});

const emit = defineEmits(["changed"]);

const onSelected = (value: string) => {
  emit("changed", value);
};

const onDeselected = (value: string) => {
  emit(
    "changed",
    props.values.filter((v) => v !== value)
  );
};
</script>

<style>
.vue-multiselect .vs__dropdown-toggle {
  border: none;
  padding: 0;
  padding-left: 0.7rem;
  padding-right: 0.7rem;
}
.vue-multiselect .vs__search {
  padding: 0;
  margin: 0;
  border: 0;
  font-size: 0.75rem;
  line-height: 1rem;
}

.vue-multiselect .vs__actions {
  padding: 0;
  margin: 0;
  border: 0;
  font-size: 0.75rem;
  line-height: 1rem;
  cursor: pointer;
}

.vue-multiselect .vs__dropdown-menu {
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

.vue-multiselect .vs__selected {
  padding: 0;
  margin: 0;
  margin-top: 0.1rem;
  margin-right: 0.2rem;
  padding-left: 0.3rem;
  border: none;
  background-color: rgb(212 212 212 / var(--tw-text-opacity));
}

.vue-multiselect .vs__deselect {
  margin-left: 0;
}

@media (prefers-color-scheme: dark) {
  .vue-multiselect .vs__selected {
    --tw-text-opacity: 1;
    color: rgb(212 212 212 / var(--tw-text-opacity));
    background-color: rgb(115 115 115 / var(--tw-text-opacity));
  }

  .vue-multiselect .vs__open-indicator {
    fill: rgb(212 212 212 / var(--tw-text-opacity));
  }

  .vue-multiselect .vs__dropdown-menu {
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
      v-model="values"
      class="vue-multiselect text-xs drop dark:text-neutral-300"
      transition="none"
      multiple
      taggable
      :clearable="false"
      @option:selected="onSelected"
      @option:deselected="onDeselected"
    ></v-select>
  </div>
</template>
