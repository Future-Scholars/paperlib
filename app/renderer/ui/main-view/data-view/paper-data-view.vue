<script setup lang="ts">
import { Ref, computed, inject, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { disposable } from "@/base/dispose";
import { IPaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";

import ListView from "./components/list-view/list-view.vue";
import TablePreviewView from "./components/table-view/table-preview-view.vue";
import TableView from "./components/table-view/table-view.vue";

// ================================
// State
// ================================
const prefState = preferenceService.useState();
const uiState = uiStateService.useState();

const i18n = useI18n();

// ================================
// Data
// ================================
const paperEntities = inject<Ref<IPaperEntityResults>>("paperEntities")!;
const displayingURL = ref("");
const fieldEnable = computed(() => {
  return {
    pubTime: prefState.showMainYear,
    publication: prefState.showMainPublication,
    pubType: prefState.showMainPubType,
    rating: prefState.showMainRating,
    tags: prefState.showMainTags,
    folders: prefState.showMainFolders,
    flag: prefState.showMainFlag,
    note: prefState.showMainNote,
    addTime: prefState.showMainAddTime,
  };
});
const fieldLabel = computed(() => {
  const labels = {
    publication: i18n.t("mainview.publicationtitle"),
    pubTime: i18n.t("mainview.pubyear"),
    pubType: i18n.t("mainview.pubtype"),
    tags: i18n.t("mainview.tags"),
    folders: i18n.t("mainview.folders"),
    note: i18n.t("mainview.note"),
    rating: i18n.t("mainview.rating"),
    flag: i18n.t("mainview.flag"),
    addTime: i18n.t("mainview.addtime"),
  };

  const result: Record<string, string> = {};
  result.title = i18n.t("mainview.title");
  result.authors = i18n.t("mainview.authors");
  for (const [key, label] of Object.entries(labels)) {
    if (fieldEnable.value[key as keyof typeof fieldEnable.value]) {
      result[key] = label;
    }
  }

  return result;
});
const fieldWidth = ref({});

const calTableFieldWidth = (reset = false) => {
  if (reset) {
    preferenceService.set({
      mainTitleWidth: -1,
      mainAuthorsWidth: -1,
      mainPublicationWidth: -1,
      mainYearWidth: -1,
      mainPubTypeWidth: -1,
      mainTagsWidth: -1,
      mainFoldersWidth: -1,
      mainNoteWidth: -1,
      mainRatingWidth: -1,
      mainFlagWidth: -1,
      mainAddTimeWidth: -1,
    });
  }

  const keyPrefMap: Record<string, Record<string, string>> = {
    title: { widthKey: "mainTitleWidth", enableKey: "showMainTitle" },
    authors: { widthKey: "mainAuthorsWidth", enableKey: "showMainAuthors" },
    publication: {
      widthKey: "mainPublicationWidth",
      enableKey: "showMainPublication",
    },
    pubTime: { widthKey: "mainYearWidth", enableKey: "showMainYear" },
    pubType: { widthKey: "mainPubTypeWidth", enableKey: "showMainPubType" },
    tags: { widthKey: "mainTagsWidth", enableKey: "showMainTags" },
    folders: { widthKey: "mainFoldersWidth", enableKey: "showMainFolders" },
    note: { widthKey: "mainNoteWidth", enableKey: "showMainNote" },
    rating: { widthKey: "mainRatingWidth", enableKey: "showMainRating" },
    flag: { widthKey: "mainFlagWidth", enableKey: "showMainFlag" },
    addTime: { widthKey: "mainAddTimeWidth", enableKey: "showMainAddTime" },
  };
  const alwaysShowKeys = ["title", "authors"];

  let totalWidth = 0;
  let autoWidthNumber = 0;

  const fieldWidthBuffer: Record<string, number> = {};

  for (const [key, prefKey] of Object.entries(keyPrefMap)) {
    const prefWidth = prefState[prefKey.widthKey];
    const prefEnable =
      prefState[prefKey.enableKey] || alwaysShowKeys.includes(key);

    if (!prefEnable) {
      continue;
    }

    if (prefWidth !== -1) {
      fieldWidthBuffer[key] = prefWidth;
      totalWidth += prefWidth;
    } else {
      autoWidthNumber += 1;
    }
  }

  // Calculate the width percentage of each column
  const autoWidth = (100 - totalWidth) / autoWidthNumber;
  for (const [key, prefKey] of Object.entries(keyPrefMap)) {
    const prefWidth = prefState[prefKey.widthKey];
    const prefEnable =
      prefState[prefKey.enableKey] || alwaysShowKeys.includes(key);

    if (!prefEnable) {
      continue;
    }

    if (prefWidth === -1) {
      fieldWidthBuffer[key] = autoWidth;
    }
  }

  let restWidth = 0;
  for (const [key, width] of Object.entries(fieldWidthBuffer)) {
    restWidth += width;
  }
  restWidth = 100 - restWidth;
  fieldWidthBuffer.title += restWidth;

  fieldWidth.value = fieldWidthBuffer;
};

// ================================
// Event Handler
// ================================
const onItemClicked = async (selectedIndex: number[]) => {
  uiState.selectedIndex = selectedIndex;

  if (
    selectedIndex.length === 1 &&
    prefState.mainviewType === "tableandpreview"
  ) {
    const fileURL = await fileService.access(
      paperEntities.value[selectedIndex[0]].mainURL,
      true
    );
    if (
      uiState.commandBarMode === "fulltext" &&
      uiState.commandBarText !== ""
    ) {
      displayingURL.value = `../viewer/viewer.html?file=${fileURL}&search=${uiState.commandBarText}`;
    } else {
      displayingURL.value = `../viewer/viewer.html?file=${fileURL}`;
    }
  } else {
    displayingURL.value = "";
  }
};

const onItemRightClicked = (selectedIndex: number[]) => {
  onItemClicked(selectedIndex);

  PLMainAPI.contextMenuService.showPaperDataMenu(
    uiState.selectedIndex.length === 1
  );
};

const onItemDoubleClicked = async (selectedIndex: number[]) => {
  onItemClicked(selectedIndex);

  const fileURL = await fileService.access(
    paperEntities.value[selectedIndex[0]].mainURL,
    true
  );
  fileService.open(fileURL);
};

const onItemDraged = (selectedIndex: number[]) => {
  uiState.selectedIndex = selectedIndex;
  const draggingIds: string[] = [];
  for (const index of selectedIndex) {
    draggingIds.push(`${paperEntities.value[index].id}`);
  }
  uiState.dragingIds = draggingIds;
};

const onTableHeaderClicked = (key: string) => {
  if (key === "tags" || key === "folders") {
    return;
  }
  preferenceService.set({ mainviewSortBy: key });
  preferenceService.set({
    mainviewSortOrder: prefState.mainviewSortOrder === "asce" ? "desc" : "asce",
  });
};

const onTableHeaderWidthChanged = (
  changedWidths: { key: string; width: number }[]
) => {
  const keyPrefMap = {
    title: "mainTitleWidth",
    authors: "mainAuthorsWidth",
    publication: "mainPublicationWidth",
    pubTime: "mainYearWidth",
    pubType: "mainPubTypeWidth",
    tags: "mainTagsWidth",
    folders: "mainFoldersWidth",
    note: "mainNoteWidth",
    rating: "mainRatingWidth",
    flag: "mainFlagWidth",
    addTime: "mainAddTimeWidth",
  } as Record<string, string>;
  const patch = {};
  for (const changedWidth of changedWidths) {
    patch[keyPrefMap[changedWidth.key]] = changedWidth.width;
  }
  preferenceService.set(patch);
  calTableFieldWidth();
};

const onDropped = async (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();

  const files = e.dataTransfer?.files;
  if (!files) {
    return;
  }

  const filePaths: string[] = [];
  for (let i = 0; i < files.length; i++) {
    filePaths.push(`file://${files[i].path}`);
  }

  await paperService.create(filePaths);
};

disposable(
  preferenceService.onChanged(
    [
      "showMainYear",
      "showMainPublication",
      "showMainPubType",
      "showMainTags",
      "showMainFolders",
      "showMainNote",
      "showMainRating",
      "showMainFlag",
      "showMainAddTime",
    ],
    () => calTableFieldWidth(true)
  )
);

onMounted(() => {
  calTableFieldWidth();
});
</script>

<template>
  <div
    id="data-view"
    class="px-2"
    @drop.prevent="onDropped"
    @dragenter="(e) => e.preventDefault()"
    @dragover="(e) => e.preventDefault()"
  >
    <ListView
      id="list-data-view"
      class="w-full max-h-[calc(100vh-4rem)]"
      v-if="prefState.mainviewType === 'list'"
      :entities="paperEntities"
      :field-enable="fieldEnable"
      :selected-index="uiState.selectedIndex"
      :platform="uiState.os"
      :categorizer-sort-by="prefState.sidebarSortBy"
      :categorizer-sort-order="prefState.sidebarSortOrder"
      @event:click="onItemClicked"
      @event:contextmenu="onItemRightClicked"
      @event:dblclick="onItemDoubleClicked"
      @event:drag="onItemDraged"
    />
    <TableView
      id="table-data-view"
      class="w-full max-h-[calc(100vh-4rem)]"
      v-else-if="prefState.mainviewType === 'table'"
      :entities="paperEntities"
      :field-enable="fieldEnable"
      :field-label="fieldLabel"
      :field-width="fieldWidth"
      :selected-index="uiState.selectedIndex"
      :platform="uiState.os"
      :categorizer-sort-by="prefState.sidebarSortBy"
      :categorizer-sort-order="prefState.sidebarSortOrder"
      :entity-sort-by="prefState.mainviewSortBy"
      :entity-sort-order="prefState.mainviewSortOrder"
      @event:click="onItemClicked"
      @event:contextmenu="onItemRightClicked"
      @event:dblclick="onItemDoubleClicked"
      @event:drag="onItemDraged"
      @event:header-click="onTableHeaderClicked"
      @event:header-width-change="onTableHeaderWidthChanged"
    />
    <TablePreviewView
      id="table-preview-data-view"
      class="w-full max-h-[calc(100vh-4rem)]"
      v-else-if="prefState.mainviewType === 'tableandpreview'"
      :entities="paperEntities"
      :field-enable="fieldEnable"
      :field-label="fieldLabel"
      :field-width="fieldWidth"
      :selected-index="uiState.selectedIndex"
      :displayingURL="displayingURL"
      :platform="uiState.os"
      :categorizer-sort-by="prefState.sidebarSortBy"
      :categorizer-sort-order="prefState.sidebarSortOrder"
      :entity-sort-by="prefState.mainviewSortBy"
      :entity-sort-order="prefState.mainviewSortOrder"
      @event:click="onItemClicked"
      @event:contextmenu="onItemRightClicked"
      @event:dblclick="onItemDoubleClicked"
      @event:drag="onItemDraged"
      @event:header-click="onTableHeaderClicked"
      @event:header-width-change="onTableHeaderWidthChanged"
    />
  </div>
</template>
