<script setup lang="ts">
import { ObjectId } from "bson";
import { Ref, onMounted, ref } from "vue";

import { disposable } from "@/base/dispose";
import { PaperFolder, PaperTag } from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import PaperListItem from "@/renderer/ui/main-view/data-view/components/list-view/components/paper-list-item.vue";
import TableItem from "@/renderer/ui/main-view/data-view/components/table-view/components/table-item.vue";
import { FieldTemplate } from "@/renderer/types/data-view";

import Toggle from "./components/toggle.vue";
import MainField from "./components/main-field.vue";
import { IPreferenceStore } from "@/common/services/preference-service";

const prefState = preferenceService.useState();

const item = ref(new PaperEntity({}));
// @ts-ignore
item.value.initialize({
  id: `${new ObjectId()}`,
  _id: `${new ObjectId()}`,
  arxiv: "xxx.xxx",
  doi: "xxx.xxx",
  addTime: new Date(),
  title: "Deep Residual Learning for Image Recognition",
  authors: "Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun",
  publication: "Computer Vision and Pattern Recognition (CVPR)",
  pubTime: "2016",
  pubType: 1,
  flag: true,
  rating: 4,
  tags: [new PaperTag({ name: "architecture" })],
  folders: [new PaperFolder({ name: "Computer-Vision" })],
  note: "ResNet, proposed a residual architecture to train very deep models.",
  mainURL: "pdf.pdf",
  supURLs: ["sup.pdf"],
  codes: [""],
  pages: "1",
  volume: "2",
  number: "3",
  publisher: "IEEE",
  _partition: "",
});

const fieldEnable = ref({});
const fieldTemplates: Ref<Map<string, FieldTemplate>> = ref(new Map());

const computeFieldTemplates = () => {
  fieldTemplates.value.clear();
  const fieldPrefs = prefState.mainTableFields;

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
    title: "html",
    rating: "rating",
    flag: "flag",
    mainURL: "file",
    codes: "code",
    supURLs: "file",
  };

  // 3. Add rest width to the first field.
  let restWidth = 100;
  for (const fieldPref of fieldPrefs) {
    if (!fieldPref.enable) {
      fieldTemplates.value.delete(fieldPref.key);
      fieldEnable.value[fieldPref.key] = false;
      continue;
    }
    const template = {
      type: templateTypes[fieldPref.key] || "string",
      value: undefined,
      width: fieldPref.width === -1 ? autoWidth : fieldPref.width,
      label: fieldPref.key,
      sortBy: ["tags", "folders"].includes(fieldPref.key)
        ? prefState.sidebarSortBy
        : undefined,
      sortOrder: ["tags", "folders"].includes(fieldPref.key)
        ? prefState.sidebarSortOrder
        : undefined,
      short:
        fieldPref.key === "authors" ? prefState.mainviewShortAuthor : undefined,
    };

    restWidth -= template.width;

    fieldTemplates.value.set(fieldPref.key, template);
    fieldEnable.value[fieldPref.key] = true;
  }
  restWidth = Math.max(restWidth, 0);
  for (const [k, v] of fieldTemplates.value.entries()) {
    v.width += restWidth;
    break;
  }
};

const toggleField = (index: number, isMain = true) => {
  const mainFieldPrefs = isMain ? prefState.mainTableFields : prefState.feedFields;
  mainFieldPrefs[index].enable = !mainFieldPrefs[index].enable;
  mainFieldPrefs.forEach((fieldPref) => {
    fieldPref.width = -1;
  });

  if (isMain) {
    preferenceService.set({ mainTableFields: mainFieldPrefs });
  } else {
    preferenceService.set({ feedFields: mainFieldPrefs });
  }
};

const onMovePreClicked = (index: number, isMain = true) => {
  const mainFieldPrefs = isMain ? prefState.mainTableFields : prefState.feedFields;
  const fieldPref = mainFieldPrefs[index];
  mainFieldPrefs.splice(index, 1);
  mainFieldPrefs.splice(index - 1, 0, fieldPref);

  if (isMain) {
    preferenceService.set({ mainTableFields: mainFieldPrefs });
  } else {
    preferenceService.set({ feedFields: mainFieldPrefs });
  }
};

const onMoveNextClicked = (index: number, isMain = true) => {
  const mainFieldPrefs = isMain ? prefState.mainTableFields : prefState.feedFields;
  const fieldPref = mainFieldPrefs[index];
  mainFieldPrefs.splice(index, 1);
  mainFieldPrefs.splice(index + 1, 0, fieldPref);

  if (isMain) {
    preferenceService.set({ mainTableFields: mainFieldPrefs });
  } else {
    preferenceService.set({ feedFields: mainFieldPrefs });
  }
};

disposable(
  preferenceService.onChanged(
    ["mainTableFields", "mainviewShortAuthor"],
    () => {
      computeFieldTemplates();
    }
  )
);

onMounted(() => {
  computeFieldTemplates();
});

const updatePref = (key: keyof IPreferenceStore, value: unknown) => {
  preferenceService.set({ [key]: value });
};
</script>

<template>
  <div
    class="flex flex-col text-neutral-800 dark:text-neutral-300 w-[400px] md:w-[500px] lg:w-[700px]"
  >
    <div class="text-base font-semibold mb-4">
      {{ $t("preference.mainview") + " " + $t("mainview.preview") }}
    </div>
    <PaperListItem
      class="bg-neutral-200 dark:bg-neutral-700 cursor-default mb-2"
      :item="item"
      :field-enables="fieldEnable"
      :active="false"
      :categorizer-sort-by="prefState.sidebarSortBy"
      :categorizer-sort-order="prefState.sidebarSortOrder"
      :height="{ normal: 64, large: 72, larger: 78 }[prefState.fontsize]"
    />

    <TableItem
      class="bg-neutral-200 dark:bg-neutral-700 cursor-default"
      :item="item"
      :field-templates="fieldTemplates"
      :categorizer-sort-by="prefState.sidebarSortBy"
      :categorizer-sort-order="prefState.sidebarSortOrder"
      :active="false"
      :striped="false"
    />

    <div class="grid mt-6 lg:grid-cols-6 grid-cols-4 gap-1">
      <MainField
        v-for="(field, index) in prefState.mainTableFields"
        :description="$t(`mainview.${field.key}`)"
        :enable="field.enable"
        @event:click="toggleField(index)"
        @event:pre-click="onMovePreClicked(index)"
        @event:next-click="onMoveNextClicked(index)"
      />
    </div>

    <Toggle
      class="mt-5"
      :title="$t('preference.mainviewshortauthor')"
      :info="$t('preference.mainviewshortauthor')"
      :enable="prefState.mainviewShortAuthor"
      @event:change="(value) => updatePref('mainviewShortAuthor', value)"
    />

    <br />

    <div class="text-base font-semibold mt-4">
      {{ $t("mainview.feeds") }}
    </div>

    <div class="grid mt-2 lg:grid-cols-6 grid-cols-4 gap-1">
      <MainField
        v-for="(field, index) in prefState.feedFields"
        :description="$t(`mainview.${field.key}`)"
        :enable="field.enable"
        @event:click="toggleField(index, false)"
        @event:pre-click="onMovePreClicked(index, false)"
        @event:next-click="onMoveNextClicked(index, false)"
      />
    </div>

  </div>
</template>
