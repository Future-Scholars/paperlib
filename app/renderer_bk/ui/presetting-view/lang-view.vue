<script setup lang="ts">
const prefState = preferenceService.useState();

const onChangeLanguage = (language: string) => {
  preferenceService.set({ language: language });
};
</script>

<template>
  <div class="flex justify-between">
    <div class="font-bold text-lg my-auto">
      {{ $t("presetting.langintro") }}
    </div>

    <div class="my-auto">
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
        <option value="zh-TW">zh-TW</option>
        <option value="ar">ar</option>
      </select>
    </div>
  </div>
</template>
