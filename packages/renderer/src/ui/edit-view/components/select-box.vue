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
  value: {
    type: String,
    required: true,
  },
});
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
  --tw-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000),
    var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);

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
</style>

<template>
  <div class="flex flex-col rounded-md py-1 bg-neutral-200">
    <label :for="placeholder" class="mx-3 text-xxs text-neutral-500">
      {{ placeholder }}
    </label>
    <v-select
      :options="options"
      v-model="value"
      class="vue-select text-xs"
      transition="none"
      :clearable="false"
    ></v-select>
  </div>
</template>
