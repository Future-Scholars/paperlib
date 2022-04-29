<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  placeholder: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: false,
  },
});
const emit = defineEmits(["changed"]);

const value = ref(props.value);

const onInput = (payload: Event) => {
  emit("changed", value.value);
};
</script>

<template>
  <div class="flex flex-col rounded-md px-3 py-1 bg-neutral-200">
    <label :for="placeholder" class="text-xxs text-neutral-500">
      {{ placeholder }}
    </label>
    <textarea
      class="text-xs bg-transparent focus:outline-none resize-none"
      type="text"
      placeholder=" "
      v-model="value"
      :name="placeholder"
      rows="4"
      @input="onInput"
    />
  </div>
</template>
