<script setup lang="ts">
import { MainRendererStateStore } from "@/state/renderer/appstate";

const emit = defineEmits(["close"]);

const prefState = MainRendererStateStore.usePreferenceState();

const onChangeLanguage = (language: string) => {
  preferenceService.set("language", language);
};

const onRestartClicked = () => {
  appService.forceClose();
};
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-75"
    enter-from-class="transform opacity-0"
    enter-to-class="transform opacity-100"
    leave-active-class="transition ease-in duration-75"
    leave-from-class="transform opacity-100"
    leave-to-class="transform opacity-0"
  >
    <div
      class="flex mx-auto bg-white dark:bg-neutral-800 z-50 overflow-auto dark:text-neutral-200"
    >
      <div class="m-auto space-y-5 w-[400px]">
        <div class="font-bold text-lg">{{ $t("presetting.langintro") }}</div>

        <div class="flex justify-between mb-5">
          <div class="flex flex-col max-w-[90%]">
            <div class="text-xs font-semibold">
              {{ $t("preference.language") }}
            </div>
            <div class="text-xxs text-red-500 dark:text-red-600">
              {{ $t("preference.pleaserestart") }}
            </div>
          </div>
          <div>
            <select
              id="language"
              class="my-auto bg-gray-50 border text-xxs border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-28 h-6 dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              v-model="prefState.language"
              @change="
                (e) => {
                  // @ts-ignore
                  onChangeLanguage(e.target.value);
                }
              "
            >
              <option value="en-GB">en-GB</option>
              <option value="zh-CN">zh-CN</option>
            </select>
          </div>
        </div>
        <div class="flex justify-end space-x-2">
          <div
            id="presetting-lang-continue-btn"
            class="flex h-6 rounded-md bg-neutral-300 dark:bg-neutral-600 hover:shadow-sm w-20"
            @click.stop="emit('close')"
          >
            <span class="m-auto text-xs cursor-pointer">
              {{ $t("presetting.continue") }}
            </span>
          </div>

          <div
            class="flex h-6 rounded-md bg-accentlight dark:bg-accentdark hover:shadow-sm px-2"
            @click.stop="onRestartClicked"
          >
            <span class="m-auto text-xs text-white cursor-pointer">
              {{ $t("presetting.restart") }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
