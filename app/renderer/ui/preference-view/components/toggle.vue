<script setup lang="ts">
import { Switch } from "@headlessui/vue";
import { toRef, watch } from "vue";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  info: {
    type: String,
    required: true,
  },
  enable: {
    type: Boolean,
    required: true,
  },
});

const emits = defineEmits(["event:change"]);

const enabled = toRef(props.enable);

watch(props, (value) => {
  enabled.value = value.enable;
});
</script>

<template>
  <div class="flex justify-between">
    <div class="flex flex-col max-w-[90%]">
      <div class="text-xs font-semibold">{{ title }}</div>
      <div class="text-xxs text-neutral-600 dark:text-neutral-500">
        {{ info }}
      </div>
    </div>
    <div>
      <slot></slot>
    </div>
    <Switch
      v-model="enabled"
      :class="
        enabled
          ? 'bg-neutral-500 dark:bg-neutral-400'
          : 'bg-neutral-300 dark:bg-neutral-700'
      "
      class="my-auto relative inline-flex h-5 w-10 items-center rounded-full min-w-10"
      @update:model-value="emits('event:change', enabled)"
    >
      <span
        :class="enabled ? 'translate-x-5.5' : 'translate-x-0.5'"
        class="inline-block h-4 w-4 transform rounded-full bg-neutral-100 dark:bg-neutral-800 transition ease-in-out"
      />
    </Switch>
  </div>
</template>
