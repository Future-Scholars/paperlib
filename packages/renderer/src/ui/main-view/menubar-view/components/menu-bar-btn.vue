<script setup lang="ts">
import { ref } from "vue";
import {
  BIconArrowCounterclockwise,
  BIconTrash,
  BIconPencilSquare,
  BIconFlag,
  BIconListUl,
  BIconGrid3x2,
  BIconGear,
} from "bootstrap-icons-vue";

defineProps({
  btnName: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  withTooltip: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["click"]);

const btnIcons: Record<string, any> = {
  Rescrape: BIconArrowCounterclockwise,
  Delete: BIconTrash,
  Edit: BIconPencilSquare,
  Flag: BIconFlag,
  ListView: BIconListUl,
  TableView: BIconGrid3x2,
  Preference: BIconGear,
};
</script>

<template>
  <button
    class="flex w-7 h-6 rounded-md hover:bg-neutral-200 hover:dark:bg-neutral-700 has-tooltip"
    :disabled="disabled"
    @click="emit('click')"
  >
    <component
      :is="btnIcons[btnName as string]"
      class="text-sm m-auto"
      :class="
        disabled
          ? 'text-neutral-300 dark:text-neutral-600'
          : 'text-neutral-700 dark:text-neutral-300'
      "
    />
    <span
      class="tooltip top-10 bg-neutral-200 p-1 rounded-md"
      v-if="withTooltip"
    >
      {{ btnName }}
    </span>
  </button>
</template>
