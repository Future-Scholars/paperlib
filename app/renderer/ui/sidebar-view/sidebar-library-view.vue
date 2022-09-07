<script setup lang="ts">
import { inject, Ref, ref, watch } from "vue";

import {
  BIconCollection,
  BIconFlag,
  BIconTag,
  BIconFolder,
  BIconFolderSymlink,
} from "bootstrap-icons-vue";

import SectionItem from "./components/section-item.vue";
import CollopseGroup from "./components/collopse-group.vue";

import { Categorizer, CategorizerType } from "@/models/categorizer";

import { MainRendererStateStore } from "@/state/renderer/appstate";
import { CategorizerResults } from "@/repositories/db-repository/categorizer-repository";

// ================================
// State
// ================================
const viewState = MainRendererStateStore.useViewState();
const selectionState = MainRendererStateStore.useSelectionState();

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

// TODO: uncomment this
const onFileDroped = (
  categorizerName: string,
  categorizerType: CategorizerType,
  filePaths: string[]
) => {
  // window.entityInteractor.addToCategorizer(
  //   filePaths,
  //   categorizerName,
  //   categorizerType
  // );
};

const onItemDroped = (
  categorizerName: string,
  categorizerType: CategorizerType
) => {
  // if (selectionState.selectedIds.includes(selectionState.dragedIds[0])) {
  //   selectionState.dragedIds = selectionState.selectedIds;
  // }
  // window.entityInteractor.updateWithCategorizer(
  //   JSON.parse(JSON.stringify(selectionState.dragedIds)) as string[],
  //   categorizerName,
  //   categorizerType
  // );
};

const onCategorizerNameChanged = (name: string) => {
  if (
    selectionState.editingCategorizer &&
    selectionState.editingCategorizer
      .replace("folder-", "")
      .replace("tag-", "") !== name
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
    window.entityInteractor.deleteCategorizer(args[1], args[0]);
  }
);

window.appInteractor.registerMainSignal(
  "sidebar-context-menu-color",
  (args) => {
    window.entityInteractor.colorizeCategorizers(args[2], args[1], args[0]);
  }
);

window.appInteractor.registerMainSignal("sidebar-context-menu-edit", (args) => {
  selectionState.editingCategorizer = `${
    { PaperTag: "tag", PaperFolder: "folder" }[args[1] as string]
  }-${args[0]}`;

  console.log(selectionState.editingCategorizer);
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
      name="All Papers"
      :count="viewState.entitiesCount"
      :with-counter="viewState.sidebarShowCount"
      :with-spinner="isSpinnerShown"
      :compact="viewState.sidebarCompact"
      :active="selectionState.selectedCategorizer === 'lib-all'"
      @click="onSelectCategorizer('lib-all')"
    >
      <BIconCollection class="text-sm my-auto text-blue-500 min-w-[1em]" />
    </SectionItem>
    <SectionItem
      name="Flags"
      :with-counter="false"
      :with-spinner="false"
      :compact="viewState.sidebarCompact"
      :active="selectionState.selectedCategorizer === 'lib-flaged'"
      @click="onSelectCategorizer('lib-flaged')"
    >
      <BIconFlag class="text-sm my-auto text-blue-500 min-w-[1em]" />
    </SectionItem>

    <CollopseGroup title="Tags">
      <SectionItem
        :name="tag.name"
        :count="tag.count"
        :with-counter="viewState.sidebarShowCount"
        :with-spinner="false"
        :compact="viewState.sidebarCompact"
        :editing="selectionState.editingCategorizer === `tag-${tag.name}`"
        v-for="tag in tags"
        :active="selectionState.selectedCategorizer === `tag-${tag.name}`"
        @click="onSelectCategorizer(`tag-${tag.name}`)"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, tag, 'PaperTag')}"
        @droped="
          (filePaths) => {
            onFileDroped(tag.name, 'PaperTag', filePaths);
          }
        "
        @item-droped="
          () => {
            onItemDroped(tag.name, 'PaperTag');
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
          :class="{
            'text-blue-500': tag.color === 'blue' || tag.color === null,
            'text-red-500': tag.color === 'red',
            'text-green-500': tag.color === 'green',
            'text-yellow-500': tag.color === 'yellow',
          }"
        />
      </SectionItem>
    </CollopseGroup>

    <CollopseGroup title="Folders">
      <SectionItem
        :name="folder.name"
        :count="folder.count"
        :with-counter="viewState.sidebarShowCount"
        :with-spinner="false"
        :compact="viewState.sidebarCompact"
        :editing="selectionState.editingCategorizer === `folder-${folder.name}`"
        v-for="folder in folders"
        :active="selectionState.selectedCategorizer === `folder-${folder.name}`"
        @click="onSelectCategorizer(`folder-${folder.name}`)"
        @contextmenu="(e: MouseEvent) => {onItemRightClicked(e, folder, 'PaperFolder')}"
        @droped="
          (filePaths) => {
            onFileDroped(folder.name, 'PaperFolder', filePaths);
          }
        "
        @item-droped="
          () => {
            onItemDroped(folder.name, 'PaperFolder');
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
