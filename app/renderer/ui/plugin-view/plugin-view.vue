<script setup lang="ts">
import {
  BIconArrowReturnLeft,
  BIconCommand,
  BIconLink,
  BIconShift,
} from "bootstrap-icons-vue";
import { Ref, onMounted, ref } from "vue";

import { PaperEntity } from "@/models/paper-entity";
import { PluginRendererStateStore } from "@/state/renderer/appstate";
import { debounce } from "@/utils/misc";

import PluginTableItem from "./components/table-item.vue";

const selectionState = PluginRendererStateStore.useSelectionState();

const searchInput = ref(null);

const exportMode = ref("BibTex");
const searchText = ref("");
const searchDebounce = ref(300);
const selectedIndex: Ref<number> = ref(0);

const entities: Ref<PaperEntity[]> = ref([]);

const onSearchTextChanged = debounce(async () => {
  if (searchText.value) {
    const results = await window.pluginSideInteractor.search(searchText.value);
    entities.value = results;
    // @ts-ignore
    entities.value.push({
      id: "search-in-google-scholar",
      title: "Search in Google Scholar...",
    });
  } else {
    window.pluginSideInteractor.resize();
    entities.value = [];
  }
}, searchDebounce.value);

const onInput = (payload: Event) => {
  onSearchTextChanged();
};

const exportSelectedEntity = (shiftKey: boolean, ctrlOrCmdKey: boolean) => {
  const selectedEntity = entities.value[selectedIndex.value];
  if (selectedEntity && selectedEntity.id === "search-in-google-scholar") {
    window.pluginSideInteractor.open(
      `https://scholar.google.com/scholar?q=${searchText.value}`
    );
  } else {
    if (shiftKey) {
      window.pluginSideInteractor.export(
        JSON.stringify([selectedEntity]),
        "BibTex-Key"
      );
    } else if (ctrlOrCmdKey) {
      if (exportMode.value === "BibTex") {
        window.pluginSideInteractor.export(
          JSON.stringify([selectedEntity]),
          "BibTex-In-Folder"
        );
      } else if (exportMode.value === "PlainText") {
        window.pluginSideInteractor.export(
          JSON.stringify([selectedEntity]),
          "PlainText-In-Folder"
        );
      }
    } else {
      window.pluginSideInteractor.export(
        JSON.stringify([selectedEntity]),
        exportMode.value
      );
    }
  }
  searchText.value = "";
  entities.value = [];
  window.pluginSideInteractor.hide();
};

function shortcutHandler(event: KeyboardEvent) {
  if (event.code === "ArrowDown") {
    event.preventDefault();
    selectedIndex.value = Math.min(
      entities.value.length - 1,
      selectedIndex.value + 1
    );
  } else if (event.code === "ArrowUp") {
    event.preventDefault();
    selectedIndex.value = Math.max(0, selectedIndex.value - 1);
  } else if (event.code === "Enter") {
    event.preventDefault();
    exportSelectedEntity(event.shiftKey, event.ctrlKey || event.metaKey);
  } else if (event.code === "Escape") {
    event.preventDefault();
    searchText.value = "";
    entities.value = [];
    window.pluginSideInteractor.hide();
  } else if (event.code === "Tab") {
    event.preventDefault();
    exportMode.value = exportMode.value === "BibTex" ? "PlainText" : "BibTex";
  } else if (event.code === "Space") {
    event.stopPropagation();
  }

  // @ts-ignore
  searchInput.value.focus();
}
window.addEventListener("keydown", shortcutHandler, true);

const onLinkClicked = async () => {
  await window.pluginSideInteractor.showFolderList();
  // @ts-ignore
  searchInput.value.focus();
};

const onUnlinkClicked = () => {
  window.pluginSideInteractor.pluginUnlinkFolder();
  // @ts-ignore
  searchInput.value.focus();
};

const checkLinkedFolder = () => {
  selectionState.pluginLinkedFolder =
    window.pluginSideInteractor.linkedFolder();
};

window.pluginSideInteractor.registerMainSignal("plugin-gain-focus", () => {
  checkLinkedFolder();
});

onMounted(() => {
  checkLinkedFolder();
});
</script>

<template>
  <div class="w-full text-neutral-700 dark:text-neutral-200">
    <div class="flex">
      <input
        ref="searchInput"
        class="w-full h-12 text-sm px-3 bg-transparent focus:outline-none grow"
        type="text"
        autofocus
        :placeholder="$t('plugin.searchinpaperlib')"
        v-model="searchText"
        @input="onInput"
      />
      <div
        class="flex space-x-2 mr-2 text-xxs my-auto select-none text-neutral-400 border-[1px] border-neutral-400 dark:border-neutral-500 rounded-md px-2 py-1 hover:dark:border-neutral-200 hover:dark:text-neutral-200 hover:border-neutral-600 hover:text-neutral-600 transition-colors"
        @click="exportMode = exportMode === 'BibTex' ? 'PlainText' : 'BibTex'"
      >
        {{ exportMode }}
      </div>
    </div>

    <hr class="border-neutral-300 dark:border-neutral-700 mx-2" />

    <div class="w-full px-2">
      <RecycleScroller
        class="scroller"
        :class="'max-h-[calc(100vh-4.8em)]'"
        :items="entities"
        :item-size="28"
        key-field="id"
        v-slot="{ item, index }"
      >
        <PluginTableItem
          :title="item.title"
          :authors="item.authors"
          :year="item.pubTime"
          :publication="item.publication"
          :active="selectedIndex == index"
          @click="
            () => {
              selectedIndex = index;
              exportSelectedEntity(false, false);
            }
          "
        />
      </RecycleScroller>
    </div>

    <div
      class="h-[24px] p-2 text-xxs text-neutral-400 flex justify-between fixed bottom-[6px]"
    >
      <div
        class="flex my-auto space-x-4 ml-1 hover:text-neutral-600 hover:dark:text-neutral-300 transition-colors"
      >
        <div
          class="flex space-x-1"
          @click="onLinkClicked"
          v-if="selectionState.pluginLinkedFolder === ''"
        >
          <BIconLink class="my-auto text-base" />
          <span class="my-auto mr-1 select-none">{{
            $t("plugin.linkfolder")
          }}</span>
        </div>
        <div
          class="flex space-x-1"
          @click="onUnlinkClicked"
          v-if="selectionState.pluginLinkedFolder !== ''"
          :class="
            selectionState.pluginLinkedFolder !== ''
              ? 'text-neutral-600 dark:text-neutral-300'
              : 'text-neutral-400'
          "
        >
          <BIconLink class="my-auto text-base" />
          <span class="my-auto mr-1 select-none">{{
            selectionState.pluginLinkedFolder
          }}</span>
        </div>
      </div>

      <div class="flex my-auto space-x-4 right-2 fixed">
        <div class="flex">
          <span class="my-auto mr-1 select-none">{{
            $t("plugin.citekey")
          }}</span>
          <div class="flex space-x-1">
            <BIconShift class="my-auto" /><BIconArrowReturnLeft
              class="my-auto"
            />
          </div>
        </div>
        <div class="flex" v-if="selectionState.pluginLinkedFolder !== ''">
          <span class="my-auto mr-1 select-none">{{
            $t("plugin.allref")
          }}</span>
          <div class="flex space-x-1">
            <BIconCommand class="my-auto" />
            <BIconArrowReturnLeft class="my-auto" />
          </div>
        </div>
        <div class="flex">
          <span class="my-auto mr-1 select-none">{{
            $t("plugin.singleref")
          }}</span>
          <div class="flex space-x-1">
            <BIconArrowReturnLeft class="my-auto" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
