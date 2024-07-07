<script setup lang="ts">
import { PaperEntity } from "@/models/paper-entity";
import { ref } from "vue";

const uiState = uiStateService.useState();
const currentGuide = ref(0);

const onClicked = (e: MouseEvent) => {
  currentGuide.value += 1;

  if (currentGuide.value === 1) {
    selectAPaper();
  }

  if (currentGuide.value === 6) {
    preferenceService.set({ showGuide: false });
  }
};


const selectAPaper = async () => {
  const papers = await paperService.load("", "addTime", "desc", undefined);

  if (papers.length === 0) {
    await paperService.update(
      [
        new PaperEntity({
          title: "Welcome to PaperLib!",
          authors: "Future Scholars, Geoffrey Chen",
          publication: "Github, https://paperlib.app",
          pubTime: "2020",
          note: "<md>\n# Welcome to PaperLib!\n\nThis is a guide to help you get started with PaperLib.\n\n",
        }),
      ],
      false,
      false
    );
  }
  uiState.selectedIndex = [0];
};
</script>

<template>
  <div
    id="guide-view"
    class="fixed top-0 right-0 left-0 z-40 w-screen h-screen"
    @click="onClicked"
  >

      <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
    <div
      id="import-guide-view"
      class="w-full h-full select-none"
      v-if="currentGuide === 0"
    >
      <div class="text-white left-1/2 top-1/2 relative">
        <span class="p-2 flex">
          <div
            class="w-4 h-4 mt-[-6px] bg-neutral-600 drop-shadow-lg rounded-sm"
          />
          <span
            class="ml-[-10px] my-auto bg-neutral-100 rounded-md py-2 px-2 text-neutral-800 drop-shadow-lg flex flex-col w-64"
          >
            <span class="text-sm font-semibold">{{ $t("guide.import1title") }}</span>
            <span class="text-xs pl-3">
              {{ $t("guide.import1info1") }}
            </span>

            <span class="text-xs pl-3 mt-4">
              {{ $t("guide.import1info2") }}
            </span>
          </span>
        </span>
      </div>

      <div class="text-white left-12 top-36 relative">
        <span class="p-2 flex">
          <div
            class="w-4 h-4 mt-[-6px] bg-neutral-600 drop-shadow-lg rounded-sm"
          />
          <span
            class="ml-[-10px] my-auto bg-neutral-100 rounded-md py-2 px-2 text-neutral-800 drop-shadow-lg flex flex-col w-64"
          >
            <span class="text-sm font-semibold">{{ $t("guide.import2title") }}</span>
            <span class="text-xs pl-3">
              {{ $t("guide.import2info1") }}
            </span>
          </span>
        </span>
      </div>
    </div>
    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >

    <div
      id="supp-guide-view"
      class="w-full h-full select-none"
      v-if="currentGuide === 1"
    >
      <div class="text-white right-[60px] bottom-[20px] fixed">
        <span class="p-2 flex items-end">
          <span
            class="ml-[-10px] my-auto bg-neutral-100 rounded-md py-2 px-2 text-neutral-800 drop-shadow-lg flex flex-col w-64"
          >
            <span class="text-sm font-semibold">{{ $t("guide.supp1title") }}</span>
            <span class="text-xs">
              {{ $t("guide.supp1info1") }}
            </span>

            <span class="text-xs mt-4">
              {{ $t("guide.supp1info2") }}
            </span>
          </span>
          <div
            class="w-4 h-4 mb-[-6px] ml-[-10px] bg-neutral-600 drop-shadow-lg rounded-sm -z-10"
          />
        </span>
      </div>
    </div>

    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >

    <div
      id="search-guide-view"
      class="w-full h-full select-none"
      v-if="currentGuide === 2"
    >
      <div class="text-white left-1/2 top-6 fixed">
        <span class="p-2 flex">
          <div
            class="w-4 h-4 mt-[-6px] bg-neutral-600 drop-shadow-lg rounded-sm"
          />
          <span
            class="ml-[-10px] my-auto bg-neutral-100 rounded-md py-2 px-3 text-neutral-800 drop-shadow-lg flex flex-col w-64"
          >
            <span class="text-sm font-semibold">{{ $t("guide.search1title") }}</span>
            <span class="text-xs">
              {{ $t("guide.search1info1") }}
            </span>
            <span class="text-xs mt-4">
              {{ $t("guide.search1info2") }}
            </span>
          </span>
        </span>
      </div>
    </div>

    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
    <div
      id="viewmode-guide-view"
      class="w-full h-full select-none"
      v-if="currentGuide === 3"
    >
      <div class="text-white right-[150px] top-6 fixed">
        <span class="p-2 flex">
          <span
            class="my-auto bg-neutral-100 rounded-md py-2 px-3 text-neutral-800 drop-shadow-lg flex flex-col w-64"
          >
            <span class="text-sm font-semibold">{{ $t("guide.viewmode1title") }}</span>
            <span class="text-xs">
              {{ $t("guide.viewmode1info1") }}
            </span>
            <span class="text-xs mt-4">
              {{ $t("guide.viewmode1info2") }}
            </span>
          </span>
          <div
            class="w-4 h-4 mt-[-6px] ml-[-10px] bg-neutral-600 drop-shadow-lg rounded-sm -z-10"
          />
        </span>
      </div>
    </div>

    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >

    <div
      id="quickpaste-guide-view"
      class="w-full h-full select-none"
      v-if="currentGuide === 4"
    >
      <div class="text-white left-1/2 top-1/2 fixed">
        <span class="p-2 flex">
          <div
            class="w-4 h-4 mt-[-6px] bg-neutral-600 drop-shadow-lg rounded-sm"
          />
          <span
            class="ml-[-10px] my-auto bg-neutral-100 rounded-md py-2 px-2 text-neutral-800 drop-shadow-lg flex flex-col w-64"
          >
            <span class="text-sm font-semibold">{{ $t("guide.quickpaste1title") }}</span>
            <span class="text-xs">
              {{ $t("guide.quickpaste1info1") }}
            </span>
            <span class="text-xs mt-4">
              {{ $t("guide.quickpaste1info2") }}
            </span>
          </span>
        </span>
      </div>
    </div>

    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >

    <div
      id="more-guide-view"
      class="w-full h-full select-none"
      v-if="currentGuide === 5"
    >
      <div class="text-white left-1/2 top-1/2 fixed">
        <span class="p-2 flex">
          <div
            class="w-4 h-4 mt-[-6px] bg-neutral-600 drop-shadow-lg rounded-sm"
          />
          <span
            class="ml-[-10px] my-auto bg-neutral-100 rounded-md py-2 px-2 text-neutral-800 drop-shadow-lg flex flex-col w-64"
          >
            <span class="text-sm font-semibold">{{ $t("guide.more1title") }}</span>
            <span class="text-xs">
              {{ $t("guide.more1info1") }}
            </span>
            <a
              class="text-xs mt-4 underline"
              href="https://paperlib.app/en/doc/getting-started.html"
            >
              {{ $t("guide.more1info2") }}
            </a>
          </span>
        </span>
      </div>
    </div>

    </Transition>
  </div>
</template>
