<script setup lang="ts">
import { Ref, inject, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { isEqual } from "lodash-es";

import { disposable } from "@/base/dispose";
import { IFeedEntityCollection } from "@/repositories/db-repository/feed-entity-repository";
import { FieldTemplate } from "@/renderer/types/data-view";

import TableView from "./components/table-view/table-view.vue";

// ================================
// State
// ================================
const prefState = preferenceService.useState();
const uiState = uiStateService.useState();

const i18n = useI18n();

const itemSize = ref(28);

// ================================
// Data
// ================================
const feedEntities = inject<Ref<IFeedEntityCollection>>("feedEntities")!;

// For Table View
const fieldTemplates: Ref<Map<string, FieldTemplate>> = ref(new Map());
const computeFieldTemplates = () => {
  fieldTemplates.value.clear();

  const fieldPrefs = prefState.feedFields;

  // 1. Calculate auto width.
  let totalWidth = 0;
  let autoWidthCount = 0;
  for (const fieldPref of fieldPrefs) {
    const width = fieldPref.width;
    const enable = fieldPref.enable;
    if (!enable) {
      continue;
    }
    if (width !== -1) {
      totalWidth += width;
    } else {
      autoWidthCount += 1;
    }
  }
  const autoWidth = (100 - totalWidth) / autoWidthCount;

  // 2. Compute field templates.
  const templateTypes = {
    title: "html-read",
  };

  // 3. Add rest width to the first field.
  let restWidth = 100;
  for (const fieldPref of fieldPrefs) {
    if (!fieldPref.enable) {
      fieldTemplates.value.delete(fieldPref.key);
      continue;
    }
    const template = {
      type: templateTypes[fieldPref.key] || "string",
      value: undefined,
      label: i18n.t(`mainview.${fieldPref.key}`),
      width: fieldPref.width === -1 ? autoWidth : fieldPref.width,
      short:
        fieldPref.key === "authors" ? prefState.mainviewShortAuthor : undefined,
    };

    restWidth -= template.width;

    fieldTemplates.value.set(fieldPref.key, template);
  }
  restWidth = Math.max(restWidth, 0);
  for (const [k, v] of fieldTemplates.value.entries()) {
    v.width += restWidth;
    break;
  }
};

// ================================
// Event Handler
// ================================
const onItemClicked = async (selectedIndex: number[]) => {
  if (isEqual(new Set(uiState.selectedIndex), new Set(selectedIndex))) {
    return;
  }

  uiState.selectedIndex = selectedIndex;
};

const onItemRightClicked = (selectedIndex: number[]) => {
  onItemClicked(selectedIndex);

  PLMainAPI.contextMenuService.showFeedDataMenu();
};

const onItemDoubleClicked = async (selectedIndex: number[]) => {
  onItemClicked(selectedIndex);

  const fileURL = feedEntities.value[selectedIndex[0]].mainURL;
  fileService.open(fileURL);
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

const onTableHeaderWidthChanged = (changedWidths: Record<string, number>) => {
  const feedFieldPrefs = prefState.feedFields;
  for (const feedFieldPref of feedFieldPrefs) {
    if (changedWidths[feedFieldPref.key]) {
      feedFieldPref.width = changedWidths[feedFieldPref.key];
    }
  }
  preferenceService.set({ feedFields: feedFieldPrefs });
};

const onFontSizeChanged = (fontSize: "normal" | "large" | "larger") => {
  itemSize.value = { normal: 28, large: 32, larger: 34 }[fontSize];
};

disposable(
  preferenceService.onChanged("fontsize", (newValue) => {
    onFontSizeChanged(newValue.value);
  })
);

disposable(
  preferenceService.onChanged(
    ["feedFields", "mainviewType", "mainviewShortAuthor"],
    () => {
      onFontSizeChanged(prefState.fontsize);
      computeFieldTemplates();
    }
  )
);

onMounted(() => {
  onFontSizeChanged(prefState.fontsize);
  computeFieldTemplates();
});
</script>

<template>
  <div id="feed-view" class="px-2">
    <TableView
      id="table-feed-view"
      class="w-full max-h-[calc(100vh-4rem)]"
      :entities="feedEntities"
      :candidates="{}"
      :field-templates="fieldTemplates"
      :selected-index="uiState.selectedIndex"
      :platform="uiState.os"
      :entity-sort-by="prefState.mainviewSortBy"
      :entity-sort-order="prefState.mainviewSortOrder"
      :item-size="itemSize"
      @event:click="onItemClicked"
      @event:contextmenu="onItemRightClicked"
      @event:dblclick="onItemDoubleClicked"
      @event:header-click="onTableHeaderClicked"
      @event:header-width-change="onTableHeaderWidthChanged"
    />
  </div>
</template>
