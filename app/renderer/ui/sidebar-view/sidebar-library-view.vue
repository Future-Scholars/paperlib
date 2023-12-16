<script setup lang="ts">
import {
  BIconCollection,
  BIconFlag,
  BIconFolder,
  BIconFolderSymlink,
  BIconFunnel,
  BIconTag,
} from "bootstrap-icons-vue";
import { ObjectID } from "bson";
import { Ref, inject } from "vue";

import { disposable } from "@/base/dispose";
import { Categorizer, CategorizerType } from "@/models/categorizer";
import { PaperSmartFilter, PaperSmartFilterType } from "@/models/smart-filter";
import { ICategorizerResults } from "@/repositories/db-repository/categorizer-repository";
import { IPaperSmartFilterResults } from "@/repositories/db-repository/smartfilter-repository";

import CollopseGroup from "./components/collopse-group.vue";
import SectionItem from "./components/section-item.vue";

const colorClass = (color?: string) => {
  switch (color) {
    case "blue":
    case null:
    case undefined:
      return "text-blue-500";
    case "red":
      return "text-red-500";
    case "green":
      return "text-green-500";
    case "yellow":
      return "text-yellow-500";
    case "purple":
      return "text-purple-500";
    case "pink":
      return "text-pink-500";
    case "orange":
      return "text-orange-500";
    case "cyan":
      return "text-cyan-500";
  }
};

// ================================
// State
// ================================
const processingState = uiStateService.processingState.useState();
const prefState = preferenceService.useState();
const uiState = uiStateService.useState();

// ================================
// Data
// ================================
const tags = inject<Ref<ICategorizerResults>>("tags");
const folders = inject<Ref<ICategorizerResults>>("folders");
const smartfilters = inject<Ref<IPaperSmartFilterResults>>("smartfilters");

// ================================
// Event Functions
// ================================
const onSelectCategorizer = (categorizer: string) => {
  if (categorizer === "lib-all") {
    uiState.commandBarMode = "general";
    uiState.commandBarText = "";
  }
  uiState.selectedCategorizer = categorizer;
};

const onSelectSmartFilter = (smartfilter: PaperSmartFilter) => {
  uiState.selectedCategorizer = `smartfilter-${smartfilter.name}`;
  uiState.commandBarMode = "advanced";
  uiState.commandBarText = smartfilter.filter;
};

const onItemRightClicked = (
  event: MouseEvent,
  categorizer: Categorizer | PaperSmartFilter,
  type: CategorizerType | PaperSmartFilterType
) => {
  PLMainAPI.contextMenuService.showSidebarMenu(categorizer.name, type);
};

const onFileDroped = (
  categorizer: Categorizer,
  type: CategorizerType,
  filePaths: string[]
) => {
  paperService.createIntoCategorizer(filePaths, categorizer, type);
};

const onItemDroped = (categorizer: Categorizer, type: CategorizerType) => {
  let dragingIds: (string | ObjectID)[] = [];
  if (uiState.selectedIds.includes(uiState.dragingIds[0])) {
    uiState.dragingIds = uiState.selectedIds;
    dragingIds = uiState.selectedIds;
  } else {
    dragingIds = uiState.dragingIds;
  }
  paperService.updateWithCategorizer(dragingIds, categorizer, type);
};

const onCategorizerNameChanged = (name: string) => {
  if (
    uiState.editingCategorizerDraft &&
    uiState.editingCategorizerDraft
      .replace("folder-", "")
      .replace("tag-", "") !== name &&
    uiState.contentType === "library"
  ) {
    categorizerService.rename(
      uiState.editingCategorizerDraft
        .replace("folder-", "")
        .replace("tag-", ""),
      name,
      uiState.editingCategorizerDraft.startsWith("tag-")
        ? "PaperTag"
        : "PaperFolder"
    );
  }
  uiState.editingCategorizerDraft = "";
};

const onCategorizerNameInputBlured = () => {
  uiState.editingCategorizerDraft = "";
};

const onAddNewPaperSmartFilterClicked = () => {
  const smartfilterDraft = new PaperSmartFilter("", "");
  uiState.editingPaperSmartFilterDraft = smartfilterDraft;
  uiState.isPaperSmartFilterEditViewShown = true;
};

// ================================
// Register Context Menu Callbacks
// ================================
PLMainAPI.contextMenuService.on(
  "sidebarContextMenuDeleteClicked",
  (payload: { data: string; type: string }) => {
    if (uiState.contentType === "library") {
      if (payload.type === "PaperPaperSmartFilter") {
        smartFilterService.delete(payload.type, payload.data);
      } else {
        categorizerService.delete(payload.type as any, payload.data);
      }
      uiState.selectedCategorizer = "lib-all";
    }
  }
);

PLMainAPI.contextMenuService.on(
  "sidebarContextMenuColorClicked",
  (payload: { data: string; type: string; color: string }) => {
    if (uiState.contentType === "library") {
      if (payload.type === "PaperPaperSmartFilter") {
        // TODO: check here
        smartFilterService.colorize(
          payload.color as any,
          payload.type,
          payload.data
        );
      } else {
        categorizerService.colorize(
          payload.color as any,
          payload.type as any,
          payload.data
        );
      }
    }
  }
);

PLMainAPI.contextMenuService.on(
  "sidebarContextMenuEditClicked",
  (payload: { data: ""; type: "" }) => {
    if (uiState.contentType === "library") {
      uiState.editingCategorizerDraft = `${
        { PaperTag: "tag", PaperFolder: "folder" }[payload.type as string]
      }-${payload.data}`;
    }
  }
);

disposable(
  uiStateService.onChanged("editingCategorizerDraft", (value) => {
    if (value) {
      uiState.selectedCategorizer = value.value;
    }
  })
);
</script>

<template>
  <div>
    <SectionItem
      id="sidebar-library-section"
      :name="$t('mainview.allpapers')"
      :count="uiState.entitiesCount"
      :with-counter="prefState.showSidebarCount"
      :with-spinner="processingState.general > 0"
      :compact="prefState.isSidebarCompact"
      :active="uiState.selectedCategorizer === 'lib-all'"
      @click="onSelectCategorizer('lib-all')"
    >
      <BIconCollection class="text-sm my-auto text-blue-500 min-w-[1em]" />
    </SectionItem>
    <SectionItem
      id="sidebar-flag-section"
      :name="$t('mainview.flags')"
      :with-counter="false"
      :with-spinner="false"
      :compact="prefState.isSidebarCompact"
      :active="uiState.selectedCategorizer === 'lib-flaged'"
      @click="onSelectCategorizer('lib-flaged')"
    >
      <BIconFlag class="text-sm my-auto text-blue-500 min-w-[1em]" />
    </SectionItem>

    <CollopseGroup
      :title="$t('mainview.smartfilters')"
      :with-add="true"
      @add="onAddNewPaperSmartFilterClicked"
    >
      <SectionItem
        class="sidebar-smartfilter-item"
        :name="smartfilter.name"
        :with-counter="false"
        :with-spinner="false"
        :compact="prefState.isSidebarCompact"
        :editing="false"
        v-for="smartfilter in smartfilters"
        :active="
          uiState.selectedCategorizer === `smartfilter-${smartfilter.name}`
        "
        @click="onSelectSmartFilter(smartfilter)"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, smartfilter, 'PaperPaperSmartFilter')}"
      >
        <BIconFunnel
          class="text-sm my-auto min-w-[1em]"
          :class="colorClass(smartfilter.color)"
        />
      </SectionItem>
    </CollopseGroup>

    <CollopseGroup :title="$t('mainview.tags')">
      <SectionItem
        class="sidebar-tag-item"
        :name="tag.name"
        :count="tag.count"
        :with-counter="prefState.showSidebarCount"
        :with-spinner="false"
        :compact="prefState.isSidebarCompact"
        :editing="uiState.editingCategorizerDraft === `tag-${tag.name}`"
        v-for="tag in tags"
        :active="uiState.selectedCategorizer === `tag-${tag.name}`"
        @click="onSelectCategorizer(`tag-${tag.name}`)"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, tag, 'PaperTag')}"
        @droped="
          (filePaths) => {
            onFileDroped(tag, 'PaperTag', filePaths);
          }
        "
        @item-droped="
          () => {
            onItemDroped(tag, 'PaperTag');
          }
        "
        @name-changed="
          (name) => {
            onCategorizerNameChanged(name);
          }
        "
        @name-input-blured="onCategorizerNameInputBlured"
      >
        <BIconTag
          class="text-sm my-auto min-w-[1em]"
          :class="colorClass(tag.color)"
        />
      </SectionItem>
    </CollopseGroup>

    <CollopseGroup :title="$t('mainview.folders')">
      <SectionItem
        class="sidebar-folder-item"
        :name="folder.name"
        :count="folder.count"
        :with-counter="prefState.showSidebarCount"
        :with-spinner="false"
        :compact="prefState.isSidebarCompact"
        :editing="uiState.editingCategorizerDraft === `folder-${folder.name}`"
        v-for="folder in folders"
        :active="uiState.selectedCategorizer === `folder-${folder.name}`"
        @click="onSelectCategorizer(`folder-${folder.name}`)"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, folder, 'PaperFolder')}"
        @droped="
          (filePaths) => {
            onFileDroped(folder, 'PaperFolder', filePaths);
          }
        "
        @item-droped="
          () => {
            onItemDroped(folder, 'PaperFolder');
          }
        "
        @name-changed="
          (name) => {
            onCategorizerNameChanged(name);
          }
        "
        @name-input-blured="onCategorizerNameInputBlured"
      >
        <BIconFolder
          class="text-sm my-auto min-w-[1em]"
          :class="{
            'text-blue-500': folder.color === 'blue' || folder.color === null,
            'text-red-500': folder.color === 'red',
            'text-green-500': folder.color === 'green',
            'text-yellow-500': folder.color === 'yellow',
          }"
          v-if="folder.name !== uiState.pluginLinkedFolder"
        />
        <BIconFolderSymlink
          class="text-sm my-auto min-w-[1em]"
          :class="{
            'text-blue-500': folder.color === 'blue' || folder.color === null,
            'text-red-500': folder.color === 'red',
            'text-green-500': folder.color === 'green',
            'text-yellow-500': folder.color === 'yellow',
          }"
          v-if="folder.name === uiState.pluginLinkedFolder"
        />
      </SectionItem>
    </CollopseGroup>
  </div>
</template>
