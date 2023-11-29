<script setup lang="ts">
import {
  BIconArrowClockwise,
  BIconDownload,
  BIconPatchCheckFill,
  BIconTrash3,
} from "bootstrap-icons-vue";

defineProps<{
  name: string;
  verified: boolean;
  version: string;
  author: string;
  description: string;
  installed: boolean;
}>();

defineEmits(["install", "uninstall", "reload"]);
</script>

<template>
  <div class="h-34 bg-neutral-200 flex flex-col py-2 px-3 rounded-md shadow-sm">
    <div class="flex space-x-2">
      <span class="font-semibold text-sm truncate my-auto"> {{ name }} </span>
      <BIconPatchCheckFill class="my-auto text-sm" v-if="verified" />
    </div>
    <span class="text-xxs text-neutral-500 truncate mb-1">
      {{ version }} by {{ author }}
    </span>
    <span class="text-xs text-neutral-600 line-clamp-4 mb-1">
      {{ description }}
    </span>

    <div
      class="flex justify-end space-x-2 text-neutral-400 dark:text-neutral-500"
    >
      <BIconDownload
        title="Install"
        class="my-auto text-xs transition ease-in-out hover:text-neutral-500 dark:hover:text-neutral-300 cursor-pointer"
        v-if="!installed"
        @click="$emit('install')"
      />
      <BIconTrash3
        title="Uninstall"
        class="my-auto text-xs transition ease-in-out hover:text-neutral-500 dark:hover:text-neutral-300 cursor-pointer"
        v-if="installed"
        @click="$emit('uninstall')"
      />
      <BIconArrowClockwise
        title="Reload"
        class="my-auto text-xs transition ease-in-out hover:text-neutral-500 dark:hover:text-neutral-300 cursor-pointer"
        v-if="installed"
        @click="$emit('reload')"
      />
    </div>
  </div>
</template>
