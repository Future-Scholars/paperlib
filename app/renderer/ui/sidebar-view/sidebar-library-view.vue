<script setup lang="ts">
import {
  BIconCollection,
  BIconFlag,
  BIconFolder,
  BIconFolderSymlink,
  BIconTag,
} from "bootstrap-icons-vue";
import { Ref, inject, ref, watch } from "vue";

import { Categorizer, CategorizerType } from "@/models/categorizer";
import { CategorizerResults } from "@/repositories/db-repository/categorizer-repository";
import { MainRendererStateStore } from "@/state/renderer/appstate";

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
const viewState = MainRendererStateStore.useViewState();
const selectionState = MainRendererStateStore.useSelectionState();
const prefState = MainRendererStateStore.usePreferenceState();

const isSpinnerShown = ref(false);

// ================================
// Data
// ================================
const tags = inject<Ref<CategorizerResults>>("tags");
const folders = inject<Ref<CategorizerResults>>("folders");

// ================================
// Event Functions
// ================================
const onSelectCategorizer = (categorizer: string) => {
  selectionState.selectedCategorizer = categorizer;
};

const onItemRightClicked = (
  event: MouseEvent,
  categorizer: Categorizer,
  type: CategorizerType
) => {
  window.appInteractor.showContextMenu("show-sidebar-context-menu", {
    data: categorizer.name,
    type: type,
  });
};

const onFileDroped = (
  categorizer: Categorizer,
  type: CategorizerType,
  filePaths: string[]
) => {
  window.entityInteractor.createIntoCategorizer(filePaths, categorizer, type);
};

const onItemDroped = (categorizer: Categorizer, type: CategorizerType) => {
  let dragedIds = [];
  if (selectionState.selectedIds.includes(selectionState.dragedIds[0])) {
    selectionState.dragedIds = selectionState.selectedIds;
    dragedIds = selectionState.selectedIds;
  } else {
    dragedIds = selectionState.dragedIds;
  }
  window.entityInteractor.updateWithCategorizer(dragedIds, categorizer, type);
};

const onCategorizerNameChanged = (name: string) => {
  if (
    selectionState.editingCategorizer &&
    selectionState.editingCategorizer
      .replace("folder-", "")
      .replace("tag-", "") !== name &&
    viewState.contentType === "library"
  ) {
    window.entityInteractor.renameCategorizer(
      selectionState.editingCategorizer
        .replace("folder-", "")
        .replace("tag-", ""),
      name,
      selectionState.editingCategorizer.startsWith("tag-")
        ? "PaperTag"
        : "PaperFolder"
    );
  }
  selectionState.editingCategorizer = "";
};

const onCategorizerNameInputBlured = () => {
  selectionState.editingCategorizer = "";
};

// ================================
// Register Context Menu Callbacks
// ================================
window.appInteractor.registerMainSignal(
  "sidebar-context-menu-delete",
  (args) => {
    if (viewState.contentType === "library") {
      window.entityInteractor.deleteCategorizer(args[1], args[0]);
      selectionState.selectedCategorizer = "lib-all";
    }
  }
);

window.appInteractor.registerMainSignal(
  "sidebar-context-menu-color",
  (args) => {
    if (viewState.contentType === "library") {
      window.entityInteractor.colorizeCategorizer(args[2], args[1], args[0]);
    }
  }
);

window.appInteractor.registerMainSignal("sidebar-context-menu-edit", (args) => {
  if (viewState.contentType === "library") {
    selectionState.editingCategorizer = `${
      { PaperTag: "tag", PaperFolder: "folder" }[args[1] as string]
    }-${args[0]}`;
  }
});

watch(
  () => viewState.processingQueueCount,
  (value) => {
    if (value > 0) {
      isSpinnerShown.value = true;
    } else {
      isSpinnerShown.value = false;
    }
  }
);

watch(
  () => selectionState.editingCategorizer,
  (value) => {
    if (value) {
      selectionState.selectedCategorizer = value;
    }
  }
);
</script>

<template>
  <div>
    <SectionItem
      id="sidebar-library-section"
      :name="$t('mainview.allpapers')"
      :count="viewState.entitiesCount"
      :with-counter="prefState.showSidebarCount"
      :with-spinner="isSpinnerShown"
      :compact="prefState.isSidebarCompact"
      :active="selectionState.selectedCategorizer === 'lib-all'"
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
      :active="selectionState.selectedCategorizer === 'lib-flaged'"
      @click="onSelectCategorizer('lib-flaged')"
    >
      <BIconFlag class="text-sm my-auto text-blue-500 min-w-[1em]" />
    </SectionItem>

    <CollopseGroup :title="$t('mainview.tags')">
      <SectionItem
        class="sidebar-tag-item"
        :name="tag.name"
        :count="tag.count"
        :with-counter="prefState.showSidebarCount"
        :with-spinner="false"
        :compact="prefState.isSidebarCompact"
        :editing="selectionState.editingCategorizer === `tag-${tag.name}`"
        v-for="tag in tags"
        :active="selectionState.selectedCategorizer === `tag-${tag.name}`"
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
        :editing="selectionState.editingCategorizer === `folder-${folder.name}`"
        v-for="folder in folders"
        :active="selectionState.selectedCategorizer === `folder-${folder.name}`"
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
          v-if="folder.name !== selectionState.pluginLinkedFolder"
        />
        <BIconFolderSymlink
          class="text-sm my-auto min-w-[1em]"
          :class="{
            'text-blue-500': folder.color === 'blue' || folder.color === null,
            'text-red-500': folder.color === 'red',
            'text-green-500': folder.color === 'green',
            'text-yellow-500': folder.color === 'yellow',
          }"
          v-if="folder.name === selectionState.pluginLinkedFolder"
        />
      </SectionItem>
    </CollopseGroup>
  </div>
</template>
