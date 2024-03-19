<script setup lang="ts">
import {
  BIconArrowClockwise,
  BIconDownload,
  BIconGear,
  BIconInfoCircle,
  BIconPatchCheckFill,
  BIconTrash3,
} from "bootstrap-icons-vue";
import Spinner from "../../components/spinner.vue";

const props = defineProps<{
  name: string;
  verified: boolean;
  version: string;
  author: string;
  description: string;
  homepage?: string;
  installed: boolean;
  installing: boolean;
  isMarketView: boolean;
}>();

const emits = defineEmits([
  "event:homepageclicked",
  "event:install",
  "event:uninstall",
  "event:reload",
  "event:setting",
]);

const onCardClick = () => {
  if (props.isMarketView && props.homepage) {
    emits("event:homepageclicked");
  } else {
    emits("event:setting");
  }
};
</script>

<template>
  <div
    class="bg-neutral-200 dark:bg-neutral-700 flex flex-col py-2 px-3 rounded-md justify-between transition-colors ease-in-out cursor-pointer duration-75"
    @click="onCardClick"
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
      <span
        class="text-xxs text-neutral-500 dark:text-neutral-400 truncate mb-1"
      >
        {{ version }} by {{ author }}
      </span>
      <span
        class="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-4 mb-1"
      >
        {{ description }}
      </span>
    </div>
    <div
      class="flex justify-end space-x-2 text-neutral-500 dark:text-neutral-400"
    >
      <Spinner class="my-auto" v-if="installing" />

      <BIconInfoCircle
        title="Homepage"
        class="my-auto text-xs transition ease-in-out hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
        v-if="homepage"
        @click.stop="emits('event:homepageclicked')"
      />

      <BIconDownload
        title="Install"
        class="my-auto text-xs transition ease-in-out hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
        v-if="!installed && !installing"
        @click.stop="emits('event:install')"
      />
      <BIconTrash3
        title="Uninstall"
        class="my-auto text-xs transition ease-in-out hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
        v-if="installed"
        @click.stop="emits('event:uninstall')"
      />
      <BIconArrowClockwise
        title="Reload"
        class="my-auto text-xs transition ease-in-out hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
        v-if="installed && !isMarketView"
        @click.stop="emits('event:reload')"
      />
      <BIconGear
        title="Settings"
        class="my-auto text-xs transition ease-in-out hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
        v-if="installed && !isMarketView"
        @click.stop="emits('event:setting')"
      />
    </div>
  </div>
</template>
