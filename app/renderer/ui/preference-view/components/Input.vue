<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  info: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: false,
    default: "password",
  },
  placeholder: {
    type: String,
    required: true,
  },
  showSavingStatus: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const emits = defineEmits(["event:change", "event:submit"]);

const value = ref(props.value);

const savingStatus = ref(0);
</script>

<template>
  <div class="flex flex-col space-y-1">
    <div class="flex flex-col">
      <div class="text-xs font-semibold">{{ title }}</div>
      <div class="text-xxs text-neutral-600 dark:text-neutral-500">
        {{ info }}
      </div>
    </div>
    <input
      class="p-2 rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none grow"
      :type="type"
      :placeholder="placeholder"
      v-model="value"
      @input="
        () => {
          savingStatus = 1;
          emits('event:change', value);
        }
      "
      @change="
        () => {
          savingStatus = 2;
          emits('event:submit', value);
        }
      "
    />
    <div class="text-xs justify-end flex text-red-500" v-if="showSavingStatus">
      <span v-if="savingStatus === 1">press Enter to save</span>
      <span v-if="savingStatus === 2">saved</span>
    </div>
  </div>
</template>
