<script setup lang="ts">
import { onMounted, ref } from "vue";

const isShown = ref(false);

const onClick = () => {
  isShown.value = false;
  window.preference.set("alreadyShownVersionCheck", true);
};

const checkShouldShow = () => {
  let alreadyShownExist = window.preference.has("alreadyShownVersionCheck");
  let alreadyShown;
  if (alreadyShownExist) {
    alreadyShown = window.preference.get("alreadyShownVersionCheck");
  } else {
    alreadyShown = false;
  }

  if (alreadyShown) {
    isShown.value = false;
    return;
  }

  const scrapers = window.preference.get("scrapers");
  const isCustomScraperExist = Object.values(scrapers).some(
    (scraper) => scraper.custom
  );

  const downloaders = window.preference.get("downloaders");
  const isCustomDownloaderExist = Object.values(downloaders).some(
    (downloader) => downloader.custom
  );

  if (isCustomScraperExist || isCustomDownloaderExist) {
    isShown.value = true;
  } else {
    isShown.value = false;
  }
};

onMounted(() => {
  checkShouldShow();
});
</script>

<template>
  <div
    id="modal-view"
    class="absolute w-full h-full top-0 left-0"
    @click="onClick"
    v-if="isShown"
  >
    <div
      class="fixed top-0 right-0 left-0 z-50 w-screen h-screen bg-neutral-800 bg-opacity-50 dark:bg-neutral-900 dark:bg-opacity-80 dark:text-neutral-300"
      @click.stop="onClick"
    >
      <div class="flex flex-col justify-center items-center w-full h-full">
        <div
          class="m-auto flex flex-col justify-between px-8 pt-3 pb-4 border-[1px] dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 w-[400px] rounded-lg shadow-lg select-none space-y-5"
          @click.stop=""
        >
          <div class="text-center text-xl font-bold">Notification</div>
          <div>
            <p class="mb-2">
              Hi, we find that you are using custom scrapers or downloaders.
            </p>
            <p class="mb-2">
              <b
                >v2.2.9 is the last version that supports custom scrapers and
                downloaders</b
              >.
            </p>

            In v3.0.0, you can implement your own scrapers and downloaders by
            our exciting extension system, and share it with others by
            publishing it to the extension marketplace.
          </div>

          <div>
            The extension development document can be found on our
            <a
              class="text-accentlight"
              href="https://paperlib.app/en/extension-doc/"
              >official webpage</a
            >.
          </div>

          <div class="flex justify-center px-4">
            <div
              id="delete-confirm-btn"
              class="flex h-6 rounded-md bg-accentlight dark:bg-accentdark hover:shadow-sm w-20"
              @click="onClick"
            >
              <span class="m-auto text-xs text-white"> OK </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
