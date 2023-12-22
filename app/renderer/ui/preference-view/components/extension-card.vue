<script setup lang="ts">
import {
  BIconArrowClockwise,
  BIconDownload,
  BIconGear,
  BIconPatchCheckFill,
  BIconTrash3,
} from "bootstrap-icons-vue";
import Spinner from "../../components/spinner.vue";

defineProps<{
  name: string;
  verified: boolean;
  version: string;
  author: string;
  description: string;
  installed: boolean;
  installing: boolean;
}>();

defineEmits(["install", "uninstall", "reload", "setting"]);
</script>

<template>
  <div
    class="bg-neutral-200 flex flex-col py-2 px-3 rounded-md shadow-sm justify-between"
  >
    <div class="flex flex-col">
      <div class="flex space-x-2">
        <BIconPatchCheckFill
          class="my-auto text-sm flex-none w-4"
          v-if="verified"
        />
        <span class="font-semibold text-sm truncate my-auto grow">
          {{ name }}
        </span>
      </div>
      <span class="text-xxs text-neutral-500 truncate mb-1">
        {{ version }} by {{ author }}
      </span>
      <span class="text-xs text-neutral-600 line-clamp-4 mb-1">
        {{ description }}
      </span>
    </div>
    <div
      class="flex justify-end space-x-2 text-neutral-400 dark:text-neutral-500"
    >
      <Spinner class="my-auto" v-if="installing" />
      <BIconDownload
        title="Install"
        class="my-auto text-xs transition ease-in-out hover:text-neutral-500 dark:hover:text-neutral-300 cursor-pointer"
        v-if="!installed && !installing"
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
      <BIconGear
        title="Settings"
        class="my-auto text-xs transition ease-in-out hover:text-neutral-500 dark:hover:text-neutral-300 cursor-pointer"
        v-if="installed"
        @click="$emit('setting')"
      />
    </div>
  </div>
</template>
