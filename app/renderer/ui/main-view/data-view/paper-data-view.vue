<script setup lang="ts">
// @ts-ignore
import dragDrop from "drag-drop";
import { Ref, inject, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { disposable } from "@/base/dispose";
import { IPaperEntityResults } from "@/repositories/db-repository/paper-entity-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import ListItem from "./components/list-item.vue";
import TableComponent from "./components/table/table-component.vue";

// ================================
// State
// ================================
const viewState = MainRendererStateStore.useViewState();
const selectionState = MainRendererStateStore.useSelectionState();
const prefState = preferenceService.useState();
const i18n = useI18n();

// ================================
// Data
// ================================
const paperEntities = inject<Ref<IPaperEntityResults>>("paperEntities");

const selectedIndex: Ref<number[]> = ref([]);
const selectedLastSingleIndex = ref(-1);

const tableTitleColumns: Ref<Record<string, { name: string; width: number }>> =
  ref({});

const resetTableTitleColumns = (reset = false) => {
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
      feedTitleWidth: -1,
      feedAuthorsWidth: -1,
      feedYearWidth: -1,
      feedPublicationWidth: -1,
      feedPubTypeWidth: -1,
      feedAddTimeWidth: -1,
    });
  }

  let totalWidth =
    (prefState.mainTitleWidth === -1 ? 0 : prefState.mainTitleWidth) +
    (prefState.mainAuthorsWidth === -1 ? 0 : prefState.mainAuthorsWidth);
  let emptyWidthCount =
    (prefState.mainTitleWidth === -1 ? 1 : 0) +
    (prefState.mainAuthorsWidth === -1 ? 1 : 0);

  var newTitleColumns = {
    title: { name: i18n.t("mainview.title"), width: prefState.mainTitleWidth },
    authors: {
      name: i18n.t("mainview.authors"),
      width: prefState.mainAuthorsWidth,
    },
  } as Record<string, { name: string; width: number }>;

  if (prefState.showMainPublication) {
    newTitleColumns["publication"] = {
      name: i18n.t("mainview.publicationtitle"),
      width: prefState.mainPublicationWidth,
    };
    totalWidth +=
      prefState.mainPublicationWidth === -1
        ? 0
        : prefState.mainPublicationWidth;
    emptyWidthCount += prefState.mainPublicationWidth === -1 ? 1 : 0;
  }
  if (prefState.showMainYear) {
    newTitleColumns["pubTime"] = {
      name: i18n.t("mainview.pubyear"),
      width: prefState.mainYearWidth,
    };
    totalWidth += prefState.mainYearWidth === -1 ? 0 : prefState.mainYearWidth;
    emptyWidthCount += prefState.mainYearWidth === -1 ? 1 : 0;
  }
  if (prefState.showMainPubType) {
    newTitleColumns["pubType"] = {
      name: i18n.t("mainview.pubtype"),
      width: prefState.mainPubTypeWidth,
    };
    totalWidth +=
      prefState.mainPubTypeWidth === -1 ? 0 : prefState.mainPubTypeWidth;
    emptyWidthCount += prefState.mainPubTypeWidth === -1 ? 1 : 0;
  }
  if (prefState.showMainTags) {
    newTitleColumns["tags"] = {
      name: i18n.t("mainview.tags"),
      width: prefState.mainTagsWidth,
    };
    totalWidth += prefState.mainTagsWidth === -1 ? 0 : prefState.mainTagsWidth;
    emptyWidthCount += prefState.mainTagsWidth === -1 ? 1 : 0;
  }
  if (prefState.showMainFolders) {
    newTitleColumns["folders"] = {
      name: i18n.t("mainview.folders"),
      width: prefState.mainFoldersWidth,
    };
    totalWidth +=
      prefState.mainFoldersWidth === -1 ? 0 : prefState.mainFoldersWidth;
    emptyWidthCount += prefState.mainFoldersWidth === -1 ? 1 : 0;
  }
  if (prefState.showMainNote) {
    newTitleColumns["note"] = {
      name: i18n.t("mainview.note"),
      width: prefState.mainNoteWidth,
    };
    totalWidth += prefState.mainNoteWidth === -1 ? 0 : prefState.mainNoteWidth;
    emptyWidthCount += prefState.mainNoteWidth === -1 ? 1 : 0;
  }
  if (prefState.showMainRating) {
    newTitleColumns["rating"] = {
      name: i18n.t("mainview.rating"),
      width: prefState.mainRatingWidth,
    };
    totalWidth +=
      prefState.mainRatingWidth === -1 ? 0 : prefState.mainRatingWidth;
    emptyWidthCount += prefState.mainRatingWidth === -1 ? 1 : 0;
  }
  if (prefState.showMainFlag) {
    newTitleColumns["flag"] = {
      name: i18n.t("mainview.flag"),
      width: prefState.mainFlagWidth,
    };
    totalWidth += prefState.mainFlagWidth === -1 ? 0 : prefState.mainFlagWidth;
    emptyWidthCount += prefState.mainFlagWidth === -1 ? 1 : 0;
  }
  if (prefState.showMainAddTime) {
    newTitleColumns["addTime"] = {
      name: i18n.t("mainview.addtime"),
      width: prefState.mainAddTimeWidth,
    };
    totalWidth +=
      prefState.mainAddTimeWidth === -1 ? 0 : prefState.mainAddTimeWidth;
    emptyWidthCount += prefState.mainAddTimeWidth === -1 ? 1 : 0;
  }

  // Calculate the width percentage of each column
  Object.keys(newTitleColumns).forEach((key) => {
    if (newTitleColumns[key].width === -1) {
      newTitleColumns[key].width = (100 - totalWidth) / emptyWidthCount;
    }
  });

  let remainingWidth = 0;
  Object.keys(newTitleColumns).forEach((key) => {
    remainingWidth += newTitleColumns[key].width;
  });
  remainingWidth = 100 - remainingWidth;

  if (remainingWidth !== 0) {
    newTitleColumns["title"].width += remainingWidth;
  }

  tableTitleColumns.value = newTitleColumns;
};

const onTableTitleClicked = (key: string) => {
  if (key === "tags" || key === "folders") {
    return;
  }
  preferenceService.set({ mainviewSortBy: key });
  preferenceService.set({
    mainviewSortOrder: prefState.mainviewSortOrder === "asce" ? "desc" : "asce",
  });
};

const onTableTitleWidthChanged = (
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
    tableTitleColumns.value[changedWidth.key].width = changedWidth.width;
    patch[keyPrefMap[changedWidth.key]] = changedWidth.width;
  }
  preferenceService.set(patch);
};

const onItemClicked = (event: MouseEvent, index: number) => {
  if (event.shiftKey) {
    const minIndex = Math.min(selectedLastSingleIndex.value, index);
    const maxIndex = Math.max(selectedLastSingleIndex.value, index);
    selectedIndex.value = [];
    for (let i = minIndex; i <= maxIndex; i++) {
      selectedIndex.value.push(i);
    }
  } else if (
    (event.ctrlKey && appService.platform() !== "darwin") ||
    (event.metaKey && appService.platform() === "darwin")
  ) {
    if (selectedIndex.value.indexOf(index) >= 0) {
      selectedIndex.value.splice(selectedIndex.value.indexOf(index), 1);
    } else {
      selectedIndex.value.push(index);
    }
  } else {
    selectedIndex.value = [index];
    selectedLastSingleIndex.value = index;
  }
  selectionState.selectedIndex = JSON.parse(
    JSON.stringify(selectedIndex.value)
  );
};

const onItemRightClicked = (event: MouseEvent, index: number) => {
  if (selectedIndex.value.indexOf(index) === -1) {
    onItemClicked(event, index);
  }
  window.appInteractor.showContextMenu(
    "show-data-context-menu",
    selectedIndex.value.length === 1
  );
};

const onItemDoubleClicked = (event: MouseEvent, index: number, url: string) => {
  selectedIndex.value = [index];
  selectionState.selectedIndex = selectedIndex.value;
  fileService.open(url);
};

const registerDropHandler = () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  dragDrop("#data-view", {
    // @ts-ignore
    onDrop: async (files, pos, fileList, directories) => {
      const filePaths: string[] = [];
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      files.forEach((file) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        filePaths.push(`file://${file.path as string}`);
      });
      await paperService.create(filePaths);
    },
  });
};

const dragHandler = (event: DragEvent) => {
  const el = event.target as HTMLElement;
  event.dataTransfer?.setDragImage(el, 0, 0);
  event.dataTransfer?.setData("text/plain", "paperlibEvent-drag-main-item");

  selectionState.dragedIds = [el.id];
};

const showingUrl = ref("");
const accessMainFile = async (index: number) => {
  const paperEntity = paperEntities?.value[index];
  if (paperEntity) {
    const url = await fileService.access(paperEntity!.mainURL, false);

    if (viewState.searchMode === "fulltext" && viewState.searchText !== "") {
      showingUrl.value = `../viewer/viewer.html?file=${url}&search=${viewState.searchText}`;
    } else {
      showingUrl.value = `../viewer/viewer.html?file=${url}`;
    }
  } else {
    showingUrl.value = "";
  }
};

watch(
  () => selectionState.selectedIndex,
  (newSelectedIndex) => {
    if (newSelectedIndex.length === 1 && selectedIndex.value.length === 1) {
      selectedLastSingleIndex.value = newSelectedIndex[0];
    }

    selectedIndex.value = newSelectedIndex;

    if (newSelectedIndex.length === 0) {
      selectedIndex.value = [];
    }

    if (prefState.mainviewType === "tableandpreview") {
      accessMainFile(newSelectedIndex[0]);
    }
  }
);

disposable(
  preferenceService.onChanged("mainviewType", (newMainviewType) => {
    if (newMainviewType.value === "tableandpreview") {
      if (selectionState.selectedIndex.length === 1) {
        accessMainFile(selectionState.selectedIndex[0]);
      }
    }
  })
);

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
    () => resetTableTitleColumns(true)
  )
);

onMounted(() => {
  registerDropHandler();
  resetTableTitleColumns();
});
</script>

<template>
  <div id="data-view" class="px-2">
    <RecycleScroller
      id="list-data-view"
      class="scroller max-h-[calc(100vh-3rem)]"
      :items="paperEntities"
      :item-size="64"
      key-field="id"
      v-slot="{ item, index }"
      :buffer="500"
      v-if="prefState.mainviewType === 'list'"
    >
      <ListItem
        :id="item.id"
        :item="item"
        :active="selectedIndex.indexOf(index) >= 0"
        :showPubTime="prefState.showMainYear"
        :showPublication="prefState.showMainPublication"
        :showRating="prefState.showMainRating"
        :showPubType="prefState.showMainPubType"
        :showTags="prefState.showMainTags"
        :showFolders="prefState.showMainFolders"
        :showNote="prefState.showMainNote"
        :showFlag="prefState.showMainFlag"
        :read="true"
        @click="(e: MouseEvent) => {onItemClicked(e, index)}"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, index)}"
        @dblclick="(e: MouseEvent) => {onItemDoubleClicked(e, index, item.mainURL)}"
        draggable="true"
        v-on:dragstart="dragHandler"
      />
    </RecycleScroller>

    <splitpanes
      horizontal
      class="max-h-[calc(100vh-4rem)]"
      v-if="
        prefState.mainviewType === 'table' ||
        prefState.mainviewType === 'tableandpreview'
      "
    >
      <pane :key="1" min-size="12">
        <TableComponent
          id="table-data-view"
          :title-columns="tableTitleColumns"
          :data-rows="paperEntities || []"
          @title-clicked="onTableTitleClicked"
          @title-width-changed="onTableTitleWidthChanged"
          @row-dragged="dragHandler"
          @row-clicked="onItemClicked"
          @row-right-clicked="onItemRightClicked"
          @row-double-clicked="onItemDoubleClicked"
        />
      </pane>
      <pane
        id="table-reader-data-view"
        :key="1"
        min-size="12"
        v-if="
          prefState.mainviewType === 'tableandpreview' &&
          selectedIndex.length === 1
        "
      >
        <div class="w-full h-full">
          <iframe class="w-full h-full rounded-lg" :src="showingUrl" />
        </div>
      </pane>
    </splitpanes>
  </div>
</template>
@/renderer/services/preference-service
