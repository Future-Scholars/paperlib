<script setup lang="ts">
import { onMounted, ref } from "vue";

import ExtensionCard from "./components/extension-card.vue";

const installedExtensions = ref<{
  [id: string]: {
    id: string;
    name: string;
    version: string;
    author: string;
    verified: boolean;
    description: string;
  };
}>({});

const reloadExtension = async (id: string) => {
  await PLExtAPI.extensionManagementService.reload(id);
  installedExtensions.value =
    await PLExtAPI.extensionManagementService.installedExtensions();
};

const uninstallExtension = async (id: string) => {
  await PLExtAPI.extensionManagementService.uninstall(id);
  installedExtensions.value =
    await PLExtAPI.extensionManagementService.installedExtensions();
};

onMounted(async () => {
  installedExtensions.value =
    await PLExtAPI.extensionManagementService.installedExtensions();
});
</script>

<template>
  <div
    class="flex flex-col text-neutral-800 dark:text-neutral-300 w-[400px] md:w-[500px] lg:w-[700px]"
  >
    <div class="flex justify-between items-end mb-4 flex-none">
      <div class="text-base font-semibold">Extension</div>
      <div
        class="flex text-xs space-x-4 text-neutral-400 dark:text-neutral-500 cursor-pointer"
      >
        <div
          class="transition ease-in-out hover:text-neutral-500 dark:hover:text-neutral-300"
        >
          Installed
        </div>
        <div
          class="transition ease-in-out hover:text-neutral-500 dark:hover:text-neutral-300"
        >
          Marketplace
        </div>
      </div>
    </div>
    <div class="grid grid-cols-3 p-2 gap-2">
      <ExtensionCard
        v-for="extension in installedExtensions"
        :name="extension.name"
        :verified="extension.verified"
        :version="extension.version"
        :author="extension.author"
        :description="extension.description"
        installed
        @reload="reloadExtension(extension.id)"
        @uninstall="uninstallExtension(extension.id)"
      />
    </div>
  </div>
</template>
