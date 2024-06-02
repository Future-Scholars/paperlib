<script setup lang="ts">
import { ref, provide } from "vue";
import TreeNode from "./tree-node.vue";
import { watch } from "vue";

const props = defineProps({
  title: String,
  addable: Boolean,
  childrenAddable: {
    type: Boolean,
    default: false,
  },
  viewTree: {
    type: Object,
    required: true,
    default: () => {},
  },
  showCounter: {
    type: Boolean,
    default: false,
  },
  compact: {
    type: Boolean,
    default: false,
  },
  withSpinner: {
    type: Boolean,
    default: false,
  },
  editingItemId: {
    type: String,
    default: "",
  },
  selectedItemId: {
    type: Array<String>,
    default: [],
  },
  itemDraggable: {
    type: Boolean,
    default: false,
  },
  rootDropable: {
    type: Boolean,
    default: false,
  },
});

// ====================
// Deep events
const emits = defineEmits([
  "event:click",
  "event:update",
  "event:contextmenu",
  "event:blur",
  "event:drop",
]);

const clickEvent = ref({});
provide("clickEvent", clickEvent);
watch(
  () => clickEvent,
  (newVal) => {
    if (newVal) {
      emits("event:click", newVal.value);
    }
  },
  {
    deep: true,
  }
);

const updateEvent = ref({});
provide("updateEvent", updateEvent);
watch(
  () => updateEvent,
  (newVal) => {
    if (newVal) {
      emits("event:update", newVal.value);
    }
  },
  {
    deep: true,
  }
);

const contextmenuEvent = ref({});
provide("contextmenuEvent", contextmenuEvent);
watch(
  () => contextmenuEvent,
  (newVal) => {
    if (newVal) {
      emits("event:contextmenu", newVal.value);
    }
  },
  {
    deep: true,
  }
);

const _editingItemId = ref("");
provide("editingItemId", _editingItemId);
watch(
  () => props.editingItemId,
  (newVal) => {
    _editingItemId.value = newVal;
  }
);

const blurEvent = ref(0);
provide("blurEvent", blurEvent);
watch(
  () => blurEvent,
  (newVal) => {
    emits("event:blur", newVal.value);
  },
  {
    deep: true,
  }
);

const _selectedItemId = ref(props.selectedItemId);
provide("selectedItemId", _selectedItemId);
watch(
  () => props.selectedItemId,
  (newVal) => {
    _selectedItemId.value = newVal;
  }
);

const dropEvent = ref({});
provide("dropEvent", dropEvent);
watch(
  () => dropEvent,
  (newVal) => {
    if (newVal) {
      emits("event:drop", newVal.value);
    }
  },
  {
    deep: true,
  }
);
</script>

<template>
  <TreeNode
    :parent_id="viewTree.parent_id"
    :id="`${viewTree._id}`"
    :title="title"
    :query="viewTree.query"
    :type="viewTree.type"
    :addable="addable"
    :child-addable="childrenAddable"
    :children="viewTree.children"
    :is-root="true"
    :default-collopsed="false"
    :show-counter="showCounter"
    :compact="compact"
    :icon="viewTree.icon"
    :count="viewTree.count"
    :with-spinner="withSpinner"
    :item-draggable="itemDraggable"
    :root-dropable="rootDropable"
  >
  </TreeNode>
</template>
