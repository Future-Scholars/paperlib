<script setup lang="ts">
import { ObjectID } from "bson";
import { Ref, inject, ref, computed } from "vue";

import {
  Categorizer,
  CategorizerType,
  PaperFolder,
  PaperTag,
} from "@/models/categorizer";
import { PaperSmartFilter, PaperSmartFilterType } from "@/models/smart-filter";
import { ICategorizerCollection } from "@/repositories/db-repository/categorizer-repository";

import { disposable } from "@/base/dispose";
import {
  IPaperSmartFilterCollection,
  IPaperSmartFilterObject,
} from "@/repositories/db-repository/smartfilter-repository";
import TreeRoot from "./components/tree/tree-root.vue";
import ItemRow from "./components/tree/item-row.vue";
import Counter from "./components/counter.vue";
import Spinner from "@/renderer/ui/components/spinner.vue";

// ================================
// State
// ================================
const processingState = uiStateService.processingState.useState();
const prefState = preferenceService.useState();
const uiState = uiStateService.useState();
const paperState = paperService.useState();
const editingItemId = ref("");

// ================================
// Data
// ================================
const tags = inject<Ref<ICategorizerCollection>>("tags");
const tagsViewTree = computed(() => {
  return querySentenceService.parseViewTree(
    tags?.value || [],
    CategorizerType.PaperTag,
    prefState.sidebarSortBy,
    prefState.sidebarSortOrder
  );
});

const folders = inject<Ref<ICategorizerCollection>>("folders");
const foldersViewTree = computed(() => {
  const linked = prefState.pluginLinkedFolder;
  return querySentenceService.parseViewTree(
    folders?.value || [],
    CategorizerType.PaperFolder,
    prefState.sidebarSortBy,
    prefState.sidebarSortOrder
  );
});

const smartfilters = inject<Ref<IPaperSmartFilterCollection>>("smartfilters");
const smartfiltersViewTree = computed(() => {
  return querySentenceService.parseViewTree(
    smartfilters?.value || [],
    PaperSmartFilterType.smartfilter,
    prefState.sidebarSortBy,
    prefState.sidebarSortOrder
  );
});

// ================================
// Event Functions
// ================================
const onSelect = (payload: { _id: string; query: string }) => {
  uiState.selectedQuerySentenceId = payload._id;
  uiState.querySentenceSidebar = payload.query;
};

const onDroped = async (
  dropData: {
    type: string;
    value: any;
    dest: { _id: string };
  },
  type: CategorizerType
) => {
  const categorizer = (
    await categorizerService.loadByIds(type, [dropData.dest._id])
  )[0];

  if (dropData.type === "PaperEntity" && categorizer) {
    let dragingIds: (string | ObjectID)[] = [];
    if (uiState.selectedIds.includes(uiState.dragingIds[0])) {
      uiState.dragingIds = uiState.selectedIds;
      dragingIds = uiState.selectedIds;
    } else {
      dragingIds = uiState.dragingIds;
    }
    paperService.updateWithCategorizer(dragingIds, categorizer, type);
  } else if (dropData.type === "files" && categorizer) {
    paperService.createIntoCategorizer(dropData.value, categorizer, type);
  } else if (
    (dropData.type === CategorizerType.PaperTag ||
      dropData.type === CategorizerType.PaperFolder) &&
    categorizer
  ) {
    const sourceCategorizer = new (
      type === CategorizerType.PaperTag ? PaperTag : PaperFolder
    )((await categorizerService.loadByIds(type, [dropData.value]))[0], false);
    sourceCategorizer.name =
      sourceCategorizer.name.split("/").pop() || "untitled";

    categorizerService.update(type, sourceCategorizer, categorizer);
  }
};

const onUpdate = (
  type: CategorizerType | PaperSmartFilterType,
  patch: { parent_id?: string; name: string }
) => {
  editingItemId.value = "";
  if (type === PaperSmartFilterType.smartfilter) {
  } else {
    if (patch.parent_id) {
      categorizerService.update(
        type,
        new Categorizer(patch, false),
        new Categorizer({ _id: patch.parent_id }, false)
      );
    } else {
      categorizerService.update(type, new Categorizer(patch, false));
    }
  }
};

const onUpdateSmartFilter = async (
  type: CategorizerType | PaperSmartFilterType,
  patch: { parent_id?: string; name: string }
) => {
  editingItemId.value = "";
  if (type === PaperSmartFilterType.smartfilter) {
    let updatedSmartfilter: IPaperSmartFilterObject;
    if (patch.parent_id) {
      updatedSmartfilter = await smartFilterService.update(
        type,
        new PaperSmartFilter(patch, false),
        new PaperSmartFilter({ _id: patch.parent_id }, false)
      );
    } else {
      updatedSmartfilter = await smartFilterService.update(
        type,
        new PaperSmartFilter(patch, false)
      );
    }

    uiState.editingPaperSmartFilter = updatedSmartfilter;
    uiState.paperSmartFilterEditViewShown = true;
  }
};

const onContextMenu = (
  type: CategorizerType | PaperSmartFilterType,
  payload: { _id: string }
) => {
  PLMainAPI.contextMenuService.showSidebarMenu(payload._id, type);
};

// ================================
// Register Context Menu Callbacks
// ================================
disposable(
  PLMainAPI.contextMenuService.on(
    "sidebarContextMenuDeleteClicked",
    (newValue: { value: { data: string; type: PaperSmartFilterType } }) => {
      if (uiState.contentType === "library") {
        if (newValue.value.type === PaperSmartFilter.schema.name) {
          smartFilterService.delete(newValue.value.type, [newValue.value.data]);
        } else {
          categorizerService.delete(newValue.value.type as any, [
            newValue.value.data,
          ]);
        }
        uiState.selectedQuerySentenceId = "lib-all";
      }
    }
  )
);

disposable(
  PLMainAPI.contextMenuService.on(
    "sidebarContextMenuColorClicked",
    (newValue: {
      value: {
        data: string;
        type: PaperSmartFilterType | CategorizerType;
        color: string;
      };
    }) => {
      if (uiState.contentType === "library") {
        if (newValue.value.type === PaperSmartFilterType.smartfilter) {
          smartFilterService.colorize(
            newValue.value.data,
            newValue.value.color as any,
            newValue.value.type
          );
        } else {
          categorizerService.colorize(
            newValue.value.data,
            newValue.value.color as any,
            newValue.value.type
          );
        }
      }
    }
  )
);

disposable(
  PLMainAPI.contextMenuService.on(
    "sidebarContextMenuEditClicked",
    async (newValue: { value: { data: string; type: string } }) => {
      if (newValue.value.type === PaperSmartFilterType.smartfilter) {
        const smartfilter = (
          await smartFilterService.loadByIds([newValue.value.data])
        )[0];
        if (smartfilter) {
          uiState.editingPaperSmartFilter = smartfilter;
          uiState.paperSmartFilterEditViewShown = true;
        }
      } else {
        editingItemId.value = newValue.value.data;
      }
    }
  )
);
</script>

<template>
  <div>
    <div
      class="w-full flex rounded-md px-1 cursor-pointer group space-x-1"
      :class="{
        'h-6': prefState.isSidebarCompact,
        'h-7': !prefState.isSidebarCompact,
        'bg-neutral-300': uiState.selectedQuerySentenceId === 'lib-all',
      }"
      @click="onSelect({ _id: 'lib-all', query: '' })"
    >
      <div class="w-3 flex-none" />
      <ItemRow
        class="grow"
        :title="$t('mainview.allpapers')"
        :color="'blue'"
        :icon="'collection'"
        :indent="true"
      />
      <div class="my-auto flex space-x-2 flex-none">
        <Spinner class="m-auto" v-if="processingState.general > 0" />
        <Counter
          class="m-auto"
          :value="paperState.count"
          v-if="prefState.showSidebarCount"
        />
      </div>
    </div>

    <div
      class="w-full flex rounded-md px-1 cursor-pointer group space-x-1"
      :class="{
        'h-6': prefState.isSidebarCompact,
        'h-7': !prefState.isSidebarCompact,
        'bg-neutral-300': uiState.selectedQuerySentenceId === 'lib-flag',
      }"
      @click="onSelect({ _id: 'lib-flag', query: 'flag == true' })"
    >
      <div class="w-3 flex-none" />
      <ItemRow
        class="grow"
        :title="$t('mainview.flags')"
        :color="'blue'"
        :icon="'flag'"
        :indent="true"
      />
    </div>

    <TreeRoot
      :title="$t('mainview.smartfilters')"
      :addable="true"
      :children-addable="true"
      :view-tree="smartfiltersViewTree"
      :show-counter="prefState.showSidebarCount"
      :compact="prefState.isSidebarCompact"
      :with-spinner="false"
      :editing-item-id="editingItemId"
      :selected-item-id="uiState.selectedQuerySentenceId"
      @event:click="onSelect"
      @event:update="
        (value) => onUpdateSmartFilter(PaperSmartFilterType.smartfilter, value)
      "
      @event:contextmenu="
        (value) => onContextMenu(PaperSmartFilterType.smartfilter, value)
      "
      @event:blur="
        () => {
          editingItemId = '';
        }
      "
    />

    <TreeRoot
      :title="$t('mainview.tags')"
      :addable="true"
      :children-addable="false"
      :view-tree="tagsViewTree"
      :show-counter="prefState.showSidebarCount"
      :compact="prefState.isSidebarCompact"
      :with-spinner="false"
      :editing-item-id="editingItemId"
      :selected-item-id="uiState.selectedQuerySentenceId"
      @event:click="onSelect"
      @event:update="(value) => onUpdate(CategorizerType.PaperTag, value)"
      @event:contextmenu="
        (value) => onContextMenu(CategorizerType.PaperTag, value)
      "
      @event:blur="
        () => {
          editingItemId = '';
        }
      "
      @event:drop="(dropData) => onDroped(dropData, CategorizerType.PaperTag)"
    />

    <TreeRoot
      :title="$t('mainview.folders')"
      :addable="true"
      :children-addable="true"
      :view-tree="foldersViewTree"
      :show-counter="prefState.showSidebarCount"
      :compact="prefState.isSidebarCompact"
      :with-spinner="false"
      :editing-item-id="editingItemId"
      :selected-item-id="uiState.selectedQuerySentenceId"
      :item-draggable="true"
      @event:click="onSelect"
      @event:update="(value) => onUpdate(CategorizerType.PaperFolder, value)"
      @event:contextmenu="
        (value) => onContextMenu(CategorizerType.PaperFolder, value)
      "
      @event:blur="
        () => {
          editingItemId = '';
        }
      "
      @event:drop="
        (dropData) => onDroped(dropData, CategorizerType.PaperFolder)
      "
    />
  </div>
</template>
