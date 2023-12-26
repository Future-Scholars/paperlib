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
import { Ref, inject, ref } from "vue";

import { Categorizer, CategorizerType } from "@/models/categorizer";
import { PaperSmartFilter, PaperSmartFilterType } from "@/models/smart-filter";
import { ICategorizerCollection } from "@/repositories/db-repository/categorizer-repository";

import { disposable } from "@/base/dispose";
import { IPaperSmartFilterCollection } from "@/repositories/db-repository/smartfilter-repository";
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
const paperState = paperService.useState();
const editingCategorizerDraft = ref("");

// ================================
// Data
// ================================
const tags = inject<Ref<ICategorizerCollection>>("tags");
const folders = inject<Ref<ICategorizerCollection>>("folders");
const smartfilters = inject<Ref<IPaperSmartFilterCollection>>("smartfilters");

// ================================
// Event Functions
// ================================
const onSelectCategorizer = (categorizer: string) => {
  if (categorizer === "lib-all") {
    uiState.commandBarSearchMode = "general";
    uiState.commandBarText = "";
  }
  uiState.selectedCategorizer = categorizer;
};

const onSelectSmartFilter = (smartfilter: PaperSmartFilter) => {
  uiState.selectedCategorizer = `smartfilter-${smartfilter.name}`;
  uiState.commandBarSearchMode = "advanced";
  uiState.commandBarText = smartfilter.filter;
};

const onItemRightClicked = (
  event: MouseEvent,
  categorizer: Categorizer | PaperSmartFilter,
  type: CategorizerType | PaperSmartFilterType
) => {
  PLMainAPI.contextMenuService.showSidebarMenu(`${categorizer._id}`, type);
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
    editingCategorizerDraft.value &&
    editingCategorizerDraft.value.replace("folder-", "").replace("tag-", "") !==
      name &&
    uiState.contentType === "library"
  ) {
    categorizerService.rename(
      editingCategorizerDraft.value.replace("folder-", "").replace("tag-", ""),
      name,
      editingCategorizerDraft.value.startsWith("tag-")
        ? CategorizerType.PaperTag
        : CategorizerType.PaperFolder
    );
  }
  editingCategorizerDraft.value = "";
};

const onCategorizerNameInputBlured = () => {
  editingCategorizerDraft.value = "";
};

const onAddNewPaperSmartFilterClicked = () => {
  uiState.paperSmartFilterEditViewShown = true;
};

// ================================
// Register Context Menu Callbacks
// ================================
disposable(
  PLMainAPI.contextMenuService.on(
    "sidebarContextMenuDeleteClicked",
    (newValue: { value: { data: string; type: string } }) => {
      if (uiState.contentType === "library") {
        if (newValue.value.type === "PaperPaperSmartFilter") {
          smartFilterService.delete(newValue.value.type, [newValue.value.data]);
        } else {
          categorizerService.delete(newValue.value.type as any, [
            newValue.value.data,
          ]);
        }
        uiState.selectedCategorizer = "lib-all";
      }
    }
  )
);

disposable(
  PLMainAPI.contextMenuService.on(
    "sidebarContextMenuColorClicked",
    (newValue: { value: { data: string; type: string; color: string } }) => {
      if (uiState.contentType === "library") {
        if (newValue.value.type === "PaperPaperSmartFilter") {
          smartFilterService.colorize(
            newValue.value.color as any,
            newValue.value.type,
            newValue.value.data
          );
        } else {
          categorizerService.colorize(
            newValue.value.color as any,
            newValue.value.type as any,
            newValue.value.data
          );
        }
      }
    }
  )
);

disposable(
  PLMainAPI.contextMenuService.on(
    "sidebarContextMenuEditClicked",
    (newValue: { value: { data: string; type: string } }) => {
      if (uiState.contentType === "library") {
        editingCategorizerDraft.value = `${
          { PaperTag: "tag", PaperFolder: "folder" }[
            newValue.value.type as string
          ]
        }-${newValue.value.data}`;
      }
    }
  )
);
</script>

<template>
  <div>
    <SectionItem
      id="sidebar-library-section"
      :name="$t('mainview.allpapers')"
      :count="paperState.count"
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
      @event:add-click="onAddNewPaperSmartFilterClicked"
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
        :editing="editingCategorizerDraft === `tag-${tag.name}`"
        v-for="tag in tags"
        :active="uiState.selectedCategorizer === `tag-${tag.name}`"
        @click="onSelectCategorizer(`tag-${tag.name}`)"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, tag, CategorizerType.PaperTag)}"
        @event:drop="
          (filePaths) => {
            onFileDroped(tag, CategorizerType.PaperTag, filePaths);
          }
        "
        @event:item-drop="
          () => {
            onItemDroped(tag, CategorizerType.PaperTag);
          }
        "
        @event:name-change="
          (name) => {
            onCategorizerNameChanged(name);
          }
        "
        @event:name-input-blur="onCategorizerNameInputBlured"
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
        :editing="editingCategorizerDraft === `folder-${folder.name}`"
        v-for="folder in folders"
        :active="uiState.selectedCategorizer === `folder-${folder.name}`"
        @click="onSelectCategorizer(`folder-${folder.name}`)"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, folder, CategorizerType.PaperFolder)}"
        @event:drop="
          (filePaths) => {
            onFileDroped(folder, CategorizerType.PaperFolder, filePaths);
          }
        "
        @event:item-drop="
          () => {
            onItemDroped(folder, CategorizerType.PaperFolder);
          }
        "
        @event:name-change="
          (name) => {
            onCategorizerNameChanged(name);
          }
        "
        @event:name-input-blur="onCategorizerNameInputBlured"
      >
        <BIconFolder
          class="text-sm my-auto min-w-[1em]"
          :class="{
            'text-blue-500': folder.color === 'blue' || folder.color === null,
            'text-red-500': folder.color === 'red',
            'text-green-500': folder.color === 'green',
            'text-yellow-500': folder.color === 'yellow',
          }"
          v-if="folder.name !== prefState.pluginLinkedFolder"
        />
        <BIconFolderSymlink
          class="text-sm my-auto min-w-[1em]"
          :class="{
            'text-blue-500': folder.color === 'blue' || folder.color === null,
            'text-red-500': folder.color === 'red',
            'text-green-500': folder.color === 'green',
            'text-yellow-500': folder.color === 'yellow',
          }"
          v-if="folder.name === prefState.pluginLinkedFolder"
        />
      </SectionItem>
    </CollopseGroup>
  </div>
</template>
