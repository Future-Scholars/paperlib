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

const btnIcons = {
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
    class="flex w-7 h-6 rounded-md hover:bg-neutral-200 has-tooltip"
    :disabled="disabled"
    @click="emit('click')"
  >
    <component
      :is="btnIcons[btnName]"
      class="text-sm m-auto"
      :class="disabled ? 'text-neutral-300' : 'text-neutral-700'"
    />
    <span
      class="tooltip top-10 bg-neutral-200 p-1 rounded-md"
      v-if="withTooltip"
    >
      {{ btnName }}
    </span>
  </button>
</template>
