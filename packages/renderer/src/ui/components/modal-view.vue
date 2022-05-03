<script setup lang="ts">
const props = defineProps({
  title: String,
  info: String,
  cancelBtn: Boolean,
  okBtn: Boolean,
});

const emit = defineEmits(["confirm", "cancel"]);
</script>

<template>
  <div
    class="fixed top-0 right-0 left-0 z-50 w-screen h-screen bg-neutral-800 bg-opacity-50 dark:bg-neutral-900 dark:bg-opacity-80 dark:text-neutral-300"
  >
    <div class="flex flex-col justify-center items-center w-full h-full">
      <div
        class="m-auto flex flex-col justify-between px-3 pt-3 pb-4 border-[1px] dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 w-64 rounded-lg shadow-lg select-none space-y-5"
      >
        <div>
          <img class="mx-auto mt-2 w-16 h-16" src="../../assets/icon.png" />
          <div class="mt-1 text-center text-sm font-semibold">
            {{ title }}
          </div>
          <div class="text-xxs mt-4 px-2 text-center">
            {{ info }}
          </div>
        </div>

        <div class="flex justify-between px-2">
          <div
            class="flex h-8 rounded-lg bg-neutral-300 dark:bg-neutral-600 hover:shadow-sm"
            :class="okBtn ? 'w-24' : 'w-full'"
            @click="emit('cancel')"
            v-if="cancelBtn"
          >
            <span class="m-auto text-xs">Cancel</span>
          </div>
          <div
            class="flex h-8 rounded-lg bg-accentlight dark:bg-accentdark hover:shadow-sm"
            :class="cancelBtn ? 'w-24' : 'w-full'"
            @click="emit('confirm')"
            v-if="okBtn"
          >
            <span class="m-auto text-xs text-white">OK</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
