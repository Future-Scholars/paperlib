<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";

import { Process } from "@/base/process-id";

// ================================
// Data
// ================================
const installedExtensions = ref<{
  [id: string]: {
    id: string;
    name: string;
    version: string;
    author: string;
    verified: boolean;
    description: string;
    preference: {
      [key: string]: any;
    };
  };
}>({});
const selectedExtensionID = ref<string>("");

// ================================
// Event Handler
// ================================
const reloadExtension = async (id: string) => {
  await PLExtAPI.extensionManagementService.reload(id);
  installedExtensions.value =
    await PLExtAPI.extensionManagementService.installedExtensions();
};

const refrenExtensions = async () => {
  installedExtensions.value =
    await PLExtAPI.extensionManagementService.installedExtensions();
};

const emits = defineEmits([
  "event:reload-all",
  "event:remove-all",
  "event:add-dummy",
  "event:add-from-file",
  "event:add-from-files",
  "event:print",
  "event:notify-info",
  "event:notify-warn",
  "event:notify-error",
  "event:notify-progress",
]);

onMounted(async () => {
  nextTick(async () => {
    const extAPIExposed = await PLUIAPILocal.rendererRPCService.waitForAPI(
      Process.extension,
      "PLExtAPI",
      5000
    );

    if (!extAPIExposed) {
      installedExtensions.value =
        await PLExtAPI.extensionManagementService.installedExtensions();
    }
  });
});
</script>

<template>
  <div
    id="dev-btn-bar"
    class="fixed right-2 bottom-2 text-xs bg-neutral-200 dark:bg-neutral-900 rounded-md py-2 px-4 z-50"
  >
    <div class="mb-1 font-semibold">DATA TEST</div>
    <div class="grid grid-cols-5 gap-1 mb-4">
      <button
        class="bg-neutral-100 dark:bg-neutral-700 p-1 rounded-md"
        @click="emits('event:reload-all')"
      >
        Reload all
      </button>
      <button
        id="dev-delete-all-btn"
        class="bg-neutral-100 dark:bg-neutral-700 p-1 rounded-md flex flex-col"
        @click="emits('event:remove-all')"
      >
        <span class="mx-auto"> Remove all </span>
        <span class="mx-auto"> (click 5 times) </span>
      </button>
      <button
        class="bg-neutral-100 dark:bg-neutral-700 p-1 rounded-md flex flex-col"
        @click="emits('event:add-dummy')"
      >
        <span class="mx-auto"> Add dummy </span>
        <span class="mx-auto"> (100 papers) </span>
      </button>
      <button
        id="dev-add-test-data-btn"
        class="bg-neutral-100 dark:bg-neutral-700 p-1 rounded-md"
        @click="emits('event:add-from-file')"
      >
        Add from file
      </button>
      <button
        id="dev-add-two-test-data-btn"
        class="bg-neutral-100 dark:bg-neutral-700 p-1 rounded-md"
        @click="emits('event:add-from-files')"
      >
        Add from files
      </button>
    </div>
    <div class="mb-1 font-semibold">LOG TEST</div>
    <div class="grid grid-cols-5 gap-1 mb-4">
      <button
        class="bg-neutral-100 dark:bg-neutral-700 p-1 rounded-md"
        @click="emits('event:print')"
      >
        Print
      </button>
      <button
        class="bg-neutral-100 dark:bg-neutral-700 p-1 rounded-md"
        @click="emits('event:notify-info')"
      >
        Notify info
      </button>
      <button
        class="bg-neutral-100 dark:bg-neutral-700 p-1 rounded-md"
        @click="emits('event:notify-warn')"
      >
        Notify warn
      </button>
      <button
        class="bg-neutral-100 dark:bg-neutral-700 p-1 rounded-md"
        @click="emits('event:notify-error')"
      >
        Notify error
      </button>
      <button
        class="bg-neutral-100 dark:bg-neutral-700 p-1 rounded-md"
        @click="emits('event:notify-progress')"
      >
        Notify progress
      </button>
    </div>

    <div class="mb-1 font-semibold">EXTENSION</div>
    <div class="flex space-x-1">
      <select
        id="countries"
        class="my-auto bg-gray-50 border text-xxs border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-28 h-6 dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        v-model="selectedExtensionID"
      >
        <option v-for="ext in installedExtensions" :value="ext.id">
          {{ ext.name }}
        </option>
      </select>

      <button
        class="bg-neutral-100 dark:bg-neutral-700 p-1 rounded-md"
        @click="reloadExtension(selectedExtensionID)"
        :disabled="!selectedExtensionID"
      >
        Reload
      </button>

      <button
        class="bg-neutral-100 dark:bg-neutral-700 p-1 rounded-md"
        @click="refrenExtensions"
      >
        Refresh List
      </button>
    </div>
  </div>
</template>
