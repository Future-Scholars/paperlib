<script setup lang="ts">
import {
  BIconFolder,
  BIconFolderSymlink,
  BIconTag,
  BIconFlag,
  BIconCollection,
  BIconFunnel,
} from "bootstrap-icons-vue";
import { computed, ref } from "vue";

const props = defineProps({
  title: String,
  color: {
    type: String,
    default: "blue",
  },
  icon: {
    type: String,
    default: "",
  },
  isRoot: {
    type: Boolean,
    default: false,
  },
  indent: {
    type: Boolean,
    default: true,
  },
  editing: {
    type: Boolean,
    default: false,
  },
});

const selfName = computed(() => props.title?.split("/").pop());

const emits = defineEmits([
  "event:blur-name-editing",
  "event:submit-name-editing",
]);

const onEditSubmit = (e: Event) => {
  e.preventDefault();
  e.stopPropagation();
  const value = (e.target as HTMLInputElement).value;

  if (!value) {
    emits("event:blur-name-editing");
  } else {
    emits("event:submit-name-editing", value);
  }
};

let updateViewLevelDisposeHandler: () => void;

const onFocused = () => {
  updateViewLevelDisposeHandler = shortcutService.updateViewLevel(
    shortcutService.viewLevel.INPUT
  );
};

const onBlured = () => {
  emits("event:blur-name-editing");
  updateViewLevelDisposeHandler?.();
};
</script>

<template>
  <div class="flex space-x-2 truncate">
    <div
      class="text-sm my-auto flex-none w-3.5"
      :class="`text-${color || 'blue'}-500`"
      v-if="!isRoot"
    >
      <BIconTag class="w-3.5" v-if="icon === 'tag'" />
      <BIconFolder class="w-3.5" v-else-if="icon === 'folder'" />
      <BIconFolderSymlink class="w-3.5" v-else-if="icon === 'folder-link'" />
      <BIconFlag class="w-3.5" v-else-if="icon === 'flag'" />
      <BIconCollection class="w-3.5" v-else-if="icon === 'collection'" />
      <BIconFunnel class="w-3.5" v-else-if="icon === 'funnel'" />
    </div>
    <div
      class="my-auto select-none truncate grow"
      :class="isRoot ? 'text-neutral-400 font-bold text-xxs' : 'text-xs'"
      v-if="!editing"
    >
      {{ title?.split("/").pop() }}
    </div>
    <input
      class="my-auto text-xs bg-transparent grow whitespace-nowrap border-2 rounded-md px-1 border-accentlight dark:border-accentdark truncate"
      size="1"
      type="text"
      autofocus
      :value="selfName"
      v-else
      @focus="onFocused"
      @blur="onBlured"
      @keydown.enter="onEditSubmit"
      @click.stop
    />
  </div>
</template>
