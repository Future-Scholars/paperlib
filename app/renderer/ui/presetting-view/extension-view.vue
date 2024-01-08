<script setup lang="ts">
import { Process } from "@/base/process-id";
import { BIconCircle, BIconCheckCircleFill } from "bootstrap-icons-vue";
import { Ref, nextTick, onMounted, onUnmounted, ref } from "vue";
import Spinner from "@/renderer/ui/components/spinner.vue";

const defaultExtensions = ref({
  "@future-scholars/paperlib-entry-scrape-extension": "f",
  "@future-scholars/paperlib-metadata-scrape-extension": "f",
  "@future-scholars/paperlib-paper-locate-extension": "f",
});

const recommandedExtensions = ref({
  "@future-scholars/paperlib-msword-extension": "f",
  "@future-scholars/paperlib-preview-extension": "f",
  "@future-scholars/paperlib-citation-count-extension": "f",
});

const installedExtensions = ref<{
  [id: string]: {
    id: string;
    name: string;
    version: string;
    author: string;
    verified: boolean;
    description: string;
    homepage?: string;
    preference: Map<
      string,
      {
        name: string;
        description: string;
        type: string;
        value: any;
        options?: Record<string, string>;
      }
    >;
  };
}>({});

const extManagementListenCallbacks: (() => void)[] = [];
const listenExtensionManagementStateChange = async () => {
  extManagementListenCallbacks.push(
    PLExtAPI.extensionManagementService.on(
      ["installed", "reloaded", "uninstalled"],
      async (newValue) => {
        installedExtensions.value =
          await PLExtAPI.extensionManagementService.installedExtensions();

        for (const [extID, installed] of Object.entries(
          defaultExtensions.value
        )) {
          if (installedExtensions.value[extID]) {
            defaultExtensions.value[extID] = "t";
          } else {
            defaultExtensions.value[extID] = "f";
          }
        }

        for (const [extID, installed] of Object.entries(
          recommandedExtensions.value
        )) {
          if (installedExtensions.value[extID]) {
            recommandedExtensions.value[extID] = "t";
          } else {
            recommandedExtensions.value[extID] = "f";
          }
        }
      }
    )
  );

  extManagementListenCallbacks.push(
    PLExtAPI.extensionManagementService.on(["installing"], async (newValue) => {
      if (defaultExtensions.value[newValue.value]) {
        defaultExtensions.value[newValue.value] = "p";
      } else if (recommandedExtensions.value[newValue.value]) {
        recommandedExtensions.value[newValue.value] = "p";
      }
    })
  );
};

const installExtension = async (id: string) => {
  try {
    await PLExtAPI.extensionManagementService.install(id);
  } catch (e) {
    logService.error(
      "Failed to install extension",
      e as Error,
      true,
      "Extension"
    );
  }
};

onMounted(() => {
  nextTick(async () => {
    const PLExtAPIExposed = await rendererRPCService.waitForAPI(
      Process.extension,
      "PLExtAPI",
      5000
    );

    if (!PLExtAPIExposed) {
      logService.warn("Extension process is not ready.", "", true, "UIPref");
      return;
    }

    installedExtensions.value =
      await PLExtAPI.extensionManagementService.installedExtensions();
    await listenExtensionManagementStateChange();
  });
});

onUnmounted(() => {
  extManagementListenCallbacks.forEach((cb) => {
    cb();
  });
});
</script>

<template>
  <div class="flex flex-col">
    <div class="font-bold text-lg mb-2">{{ $t("preference.extension") }}</div>

    <div class="text-xs text-neutral-600 dark:text-neutral-400 mb-8">
      {{ $t("presetting.extensionintro") }}
    </div>

    <div class="text-sm font-bold text-neutral-600 dark:text-neutral-300 mb-4">
      {{ $t("presetting.extensionscraper") }}
    </div>
    <div class="flex space-x-2 mb-4">
      <div class="bg-red-500 min-w-1 rounded-md"></div>
      <span class="text-xs text-red-500 my-auto">
        {{ $t("presetting.scraperintrosub") }}
      </span>
    </div>
    <div class="flex text-xs flex-col space-y-2 mb-8">
      <div
        class="flex space-x-4"
        v-for="[extID, installed] of Object.entries(defaultExtensions)"
      >
        <div
          class="text-xxs my-auto bg-neutral-200 dark:bg-neutral-700 w-14 text-center rounded cursor-none"
          v-if="installed === 't'"
        >
          {{ $t("preference.extensioninstalled") }}
        </div>
        <div
          class="text-xxs my-auto cursor-pointer bg-neutral-500 hover:bg-neutral-600 text-neutral-100 w-14 text-center rounded"
          v-else-if="installed === 'f'"
          @click="installExtension(extID)"
        >
          {{ $t("preference.extensioninstall") }}
        </div>
        <Spinner class="text-sm my-auto" v-else />
        <span class="my-auto font-mono">
          {{ extID.replaceAll("@future-scholars/", "") }}
        </span>
      </div>
    </div>

    <div class="text-sm font-bold text-neutral-600 dark:text-neutral-300 mb-4">
      {{ $t("presetting.extensionrecommend") }}
    </div>
    <div class="flex text-xs flex-col space-y-2">
      <div
        class="flex space-x-4"
        v-for="[extID, installed] of Object.entries(recommandedExtensions)"
      >
        <div
          class="text-xxs my-auto bg-neutral-200 dark:bg-neutral-700 w-14 text-center rounded cursor-none"
          v-if="installed === 't'"
        >
          {{ $t("preference.extensioninstalled") }}
        </div>
        <div
          class="text-xxs my-auto cursor-pointer bg-neutral-500 hover:bg-neutral-600 text-neutral-100 w-14 text-center rounded"
          v-else-if="installed === 'f'"
          @click="installExtension(extID)"
        >
          {{ $t("preference.extensioninstall") }}
        </div>
        <Spinner class="text-sm my-auto" v-else />
        <span class="my-auto font-mono">
          {{ extID.replaceAll("@future-scholars/", "") }}
        </span>
      </div>
    </div>
  </div>
</template>
