<script setup lang="ts">
import { BIconQuestionCircle } from "bootstrap-icons-vue";
import { Ref, inject, onMounted, ref } from "vue";

import {
  CategorizerType,
  PaperTag,
  ICategorizerCollection,
} from "@/models/categorizer";
import { Entity } from "@/models/entity";
import { disposable } from "@/base/dispose";
import { getPublicationString, getPublicationKey } from "@/base/string";

import CodesInput from "./components/codes-input.vue";
import InputBox from "./components/input-box.vue";
import MultiselectBox from "./components/multiselect-box.vue";
import SelectBox from "./components/select-box.vue";
import InputField from "./components/text-field.vue";

// ==============================
// State
// ==============================
const wideMode = ref(true);
const editingPaperEntityDraft = ref(new Entity({}));

// ==============================
// Data
// ==============================
const editableBasicFields = {
  title: {
    type: "string",
    width: "col-span-2",
  },
  authors: {
    type: "string",
    width: "col-span-2",
  },
  publication: {
    type: "string",
    width: "col-span-2",
  },
  year: {
    type: "string",
    width: "",
  },
  type: {
    type: "select",
    width: "",
    options: {
      article: "article",
      book: "book",
      inproceedings: "inproceedings",
      proceedings: "proceedings",
      manual: "manual",
      mastersthesis: "mastersthesis",
      phdthesis: "phdthesis",
      techreport: "techreport",
      booklet: "booklet",
      inbook: "inbook",
      incollection: "incollection",
      misc: "misc",
    },
  },
  doi: {
    type: "string",
    width: "",
  },
  arxiv: {
    type: "string",
    width: "",
  },
};

const editableMoreFields = {
  journal: {
    type: "string",
    width: "",
  },
  booktitle: {
    type: "string",
    width: "",
  },
  issn: {
    type: "string",
    width: "",
  },
  isbn: {
    type: "string",
    width: "",
  },
  month: {
    type: "string",
    width: "",
  },
  volume: {
    type: "string",
    width: "",
  },
  number: {
    type: "string",
    width: "",
  },
  pages: {
    type: "string",
    width: "",
  },
  publisher: {
    type: "string",
    width: "",
  },
  series: {
    type: "string",
    width: "",
  },
  edition: {
    type: "string",
    width: "",
  },
  editor: {
    type: "string",
    width: "",
  },
  howpublished: {
    type: "string",
    width: "",
  },
  organization: {
    type: "string",
    width: "",
  },
  institution: {
    type: "string",
    width: "",
  },
  address: {
    type: "string",
    width: "",
  },
};

const tags = inject<Ref<ICategorizerCollection>>("tags");

const onCategorizerUpdated = (names: string[], type: CategorizerType) => {
  if (type === CategorizerType.PaperTag) {
    const existingTagNames = editingPaperEntityDraft.value.tags.map(
      (tag) => tag.name
    );
    const newTagNames = names.filter(
      (name) => !existingTagNames.includes(name)
    );
    const discardedTagNames = existingTagNames.filter(
      (name) => !names.includes(name)
    );
    editingPaperEntityDraft.value.tags =
      editingPaperEntityDraft.value.tags.filter(
        (tag) => !discardedTagNames.includes(tag.name)
      );
    const newTags = newTagNames.map((name) => new PaperTag({ name }, true));
    editingPaperEntityDraft.value.tags.push(...newTags);
  }
};

const onCloseClicked = () => {
  PLUIAPILocal.uiStateService.setUIState({ editViewShown: false });
};

const onSaveClicked = async () => {
  PLAPI.paperService.update(
    [new Entity(editingPaperEntityDraft.value)],
    false,
    true
  );
  onCloseClicked();
};

const onSaveAndScrapeClicked = async () => {
  const savedPaperEntityDraft = await PLAPI.paperService.update(
    [new Entity(editingPaperEntityDraft.value)],
    false,
    true
  );
  PLAPI.paperService.scrape(savedPaperEntityDraft);
};

disposable(
  PLUIAPILocal.shortcutService.updateWorkingViewScope(
    PLUIAPILocal.shortcutService.viewScope.OVERLAY
  )
);

disposable(
  PLUIAPILocal.shortcutService.register(
    "Escape",
    onCloseClicked,
    true,
    true,
    PLUIAPILocal.shortcutService.viewScope.GLOBAL
  )
);
if (PLUIAPILocal.uiStateService.getUIState("os") === "darwin") {
  disposable(
    PLUIAPILocal.shortcutService.register(
      "Command+S",
      onSaveClicked,
      true,
      true,
      PLUIAPILocal.shortcutService.viewScope.GLOBAL
    )
  );
} else {
  disposable(
    PLUIAPILocal.shortcutService.register(
      "Control+S",
      onSaveClicked,
      true,
      true,
      PLUIAPILocal.shortcutService.viewScope.GLOBAL
    )
  );
}

onMounted(() => {
  editingPaperEntityDraft.value.initialize(
    PLUIAPILocal.uiStateService.getUIState("selectedPaperEntities")[0]
  );
});
</script>

<template>
  <div
    id="paper-edit-view"
    class="fixed top-0 right-0 left-0 z-50 w-screen h-screen bg-neutral-800 dark:bg-neutral-900 bg-opacity-50 dark:bg-opacity-80"
  >
    <div class="flex flex-col justify-center items-center w-full h-full">
      <div
        class="m-auto flex flex-col p-2 border-[1px] dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 rounded-lg shadow-lg select-none space-y-2"
        :class="wideMode ? 'w-[800px]' : 'w-[500px]'"
      >
        <div class="flex space-x-3">
          <div
            class="grid grid-cols-2 gap-2"
            :class="wideMode ? 'w-1/2' : 'w-full'"
          >
            <div
              :class="config.width"
              v-for="([key, config], index) of Object.entries(
                editableBasicFields
              )"
            >
              <InputBox
                :id="`paper-edit-view-${key}-input`"
                :placeholder="$t(`mainview.${key}`)"
                :value="
                  key === 'publication'
                    ? getPublicationString(editingPaperEntityDraft)
                    : editingPaperEntityDraft[key]
                "
                @event:change="(value: string) => (key === 'publication' ? editingPaperEntityDraft[getPublicationKey(editingPaperEntityDraft)] = value : editingPaperEntityDraft[key] = value)"
                v-if="config.type === 'string'"
              />
              <SelectBox
                :id="`paper-edit-view-${key}-select`"
                :placeholder="$t(`mainview.${key}`)"
                :options="config['options']"
                :value="editingPaperEntityDraft[key]"
                @event:change="
                  (value: any) => {
                    editingPaperEntityDraft[key] = parseInt(value);
                  }
                "
                v-if="config.type === 'select'"
              />
            </div>
            <MultiselectBox
              id="paper-edit-view-tags-input"
              class="col-span-2"
              :placeholder="$t('mainview.tags')"
              :model-value="editingPaperEntityDraft.tags.map((tag) => tag.name)"
              :options="
                (tags ? tags : [])
                  .map((tag) => tag.name)
                  .filter((name) => name !== 'Tags')
              "
              :invalid-values="['Tags']"
              @event:change="(values: string[]) => onCategorizerUpdated(values, CategorizerType.PaperTag)"
            />
            <InputField
              :placeholder="
                $t('mainview.note') + ' (start with `<md> to use markdown`)'
              "
              class="h-44 col-span-2"
              :value="editingPaperEntityDraft.note"
              :is-expanded="false"
              :can-expand="false"
              @event:change="(value: string) => (editingPaperEntityDraft.note = value)"
            />
          </div>

          <div class="h-full w-1/2 flex flex-col justify-between" v-if="wideMode">
            <div class="grid grid-cols-2 gap-2">
              <div
                :class="config.width"
                v-for="([key, config], index) of Object.entries(
                  editableMoreFields
                )"
              >
                <InputBox
                  :id="`paper-edit-view-${key}-input`"
                  :placeholder="key"
                  :value="editingPaperEntityDraft[key]"
                  @event:change="(value: string) => (editingPaperEntityDraft[key] = value)"
                />
              </div>
            </div>

            <div class="flex justify-between space-x-2">
              <div class="flex space-x-2">
                <div
                  class="flex w-20 h-6 rounded-md bg-neutral-300 dark:bg-neutral-500 dark:text-neutral-300 hover:shadow-sm my-auto"
                  @click="wideMode = !wideMode"
                >
                  <span class="m-auto text-xs">{{ $t("menu.advanced") }}</span>
                </div>

                <div
                  class="flex w-20 h-6 rounded-md bg-neutral-300 dark:bg-neutral-500 dark:text-neutral-300 hover:shadow-sm my-auto"
                  @click="onSaveAndScrapeClicked"
                >
                  <span class="m-auto text-xs">{{ $t("menu.rescrape") }}</span>
                </div>
                <div
                  title="Try to fillin one of the missing title, DOI, or arXiv ID to re-scrape the metadata of the paper if Paperlib cannot process it correctly."
                  class="my-auto"
                >
                  <BIconQuestionCircle
                    class="text-neutral-300 dark:text-neutral-600 hover:text-neutral-800 hover:dark:text-neutral-300 cursor-pointer"
                  />
                </div>
              </div>
              <div class="flex space-x-2">
                <div
                  class="flex w-20 h-6 rounded-md bg-neutral-300 dark:bg-neutral-500 dark:text-neutral-300 hover:shadow-sm"
                  @click="onCloseClicked"
                >
                  <span class="m-auto text-xs">{{ $t("menu.close") }}</span>
                </div>
                <div
                  id="paper-edit-view-save-btn"
                  class="flex w-20 h-6 rounded-md bg-accentlight dark:bg-accentdark hover:shadow-sm"
                  @click="onSaveClicked"
                >
                  <span class="m-auto text-xs text-white">{{
                    $t("menu.save")
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-between space-x-2 py-1"
          v-if="!wideMode"
        >
          <div class="flex space-x-2 py-1">
            <div
              class="flex w-20 h-6 rounded-md bg-neutral-300 dark:bg-neutral-500 dark:text-neutral-300 hover:shadow-sm my-auto"
              @click="wideMode = !wideMode"
            >
              <span class="m-auto text-xs">{{ $t("menu.advanced") }}</span>
            </div>
            <div
              class="flex w-20 h-6 rounded-md bg-neutral-300 dark:bg-neutral-500 dark:text-neutral-300 hover:shadow-sm my-auto"
              @click="onSaveAndScrapeClicked"
            >
              <span class="m-auto text-xs">{{ $t("menu.rescrape") }}</span>
            </div>
            <div
              title="Try to fillin one of the missing title, DOI, or arXiv ID to re-scrape the metadata of the paper if Paperlib cannot process it correctly."
              class="my-auto"
            >
              <BIconQuestionCircle
                class="text-neutral-300 dark:text-neutral-600 hover:text-neutral-800 hover:dark:text-neutral-300 cursor-pointer"
              />
            </div>
          </div>
          <div class="flex space-x-2 py-1">
            <div
              class="flex w-20 h-6 rounded-md bg-neutral-300 dark:bg-neutral-500 dark:text-neutral-300 hover:shadow-sm"
              @click="onCloseClicked"
            >
              <span class="m-auto text-xs">{{ $t("menu.close") }}</span>
            </div>
            <div
              id="paper-edit-view-save-btn"
              class="flex w-20 h-6 rounded-md bg-accentlight dark:bg-accentdark hover:shadow-sm"
              @click="onSaveClicked"
            >
              <span class="m-auto text-xs text-white">{{
                $t("menu.save")
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
