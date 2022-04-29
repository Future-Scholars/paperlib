<script setup lang="ts">
defineProps({
  placeholder: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: false,
  },
});
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
      :value="value"
      :name="placeholder"
      rows="4"
    />
  </div>
</template>
