<script setup lang="ts">
import { BIconQuestionCircle } from "bootstrap-icons-vue";
import { Ref, inject, onMounted, onUnmounted, ref } from "vue";

import { CategorizerType, PaperFolder, PaperTag } from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import { ICategorizerCollection } from "@/repositories/db-repository/categorizer-repository";

import { disposable } from "@/base/dispose";
import CodesInput from "./components/codes-input.vue";
import InputBox from "./components/input-box.vue";
import MultiselectBox from "./components/multiselect-box.vue";
import SelectBox from "./components/select-box.vue";
import InputField from "./components/text-field.vue";

// ==============================
// State
// ==============================
const uiState = uiStateService.useState();
const wideMode = ref(false);
const advancedMode = ref(false);
const editingPaperEntityDraft = ref(new PaperEntity({}));

// ==============================
// Data
// ==============================
const pubTypes = {
  Article: 0,
  Conference: 1,
  Others: 2,
  Book: 3,
};
const pubTypeKeys = ["Article", "Conference", "Others", "Book"];
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
  uiState.editViewShown = false;
};

const onSaveClicked = async () => {
  paperService.update(
    [new PaperEntity(editingPaperEntityDraft.value)],
    false,
    true
  );
  onCloseClicked();
};

const onSaveAndScrapeClicked = async () => {
  const savedPaperEntityDraft = await paperService.update(
    [new PaperEntity(editingPaperEntityDraft.value)],
    false,
    true
  );
  paperService.scrape(savedPaperEntityDraft);
};

disposable(
  shortcutService.updateWorkingViewScope(shortcutService.viewScope.OVERLAY)
);

disposable(
  shortcutService.register(
    "Escape",
    onCloseClicked,
    true,
    true,
    shortcutService.viewScope.GLOBAL
  )
);
if (uiState?.os === "darwin") {
  disposable(
    shortcutService.register(
      "Command+S",
      onSaveClicked,
      true,
      true,
      shortcutService.viewScope.GLOBAL
    )
  );
} else {
  disposable(
    shortcutService.register(
      "Control+S",
      onSaveClicked,
      true,
      true,

      shortcutService.viewScope.GLOBAL
    )
  );
}

onMounted(() => {
  editingPaperEntityDraft.value.initialize(uiState.selectedPaperEntities[0]);
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
        <div class="flex space-x-2" v-show="!advancedMode">
          <div
            class="flex flex-col space-y-2"
            :class="wideMode ? 'w-1/2' : 'w-full'"
          >
            <InputBox
              :placeholder="$t('mainview.title')"
              :value="editingPaperEntityDraft.title"
              @event:change="(value: string) => (editingPaperEntityDraft.title = value)"
            />
            <InputBox
              id="paper-edit-view-author-input"
              :placeholder="$t('mainview.authors')"
              :value="editingPaperEntityDraft.authors"
              @event:change="(value: string) => (editingPaperEntityDraft.authors = value)"
            />
            <InputBox
              id="paper-edit-view-publication-input"
              :placeholder="$t('mainview.publication')"
              :value="editingPaperEntityDraft.publication"
              @event:change="
                (value: string) => (editingPaperEntityDraft.publication = value)
              "
            />
            <div class="flex w-full space-x-2">
              <InputBox
                :placeholder="$t('mainview.pubTime')"
                class="w-1/2"
                :value="editingPaperEntityDraft.pubTime"
                @event:change="(value: string) => (editingPaperEntityDraft.pubTime = value)"
              />
              <SelectBox
                :placeholder="$t('mainview.pubType')"
                class="w-1/2 h-10"
                :options="pubTypes"
                :value="editingPaperEntityDraft.pubType"
                @event:change="
                  (value: any) => {
                    editingPaperEntityDraft.pubType = parseInt(value);
                  }
                "
              />
            </div>
            <div class="flex flex-row space-x-2">
              <div class="basis-1/2 flex space-x-2">
                <InputBox
                  class="basis-1/2 w-8"
                  placeholder="Volumn"
                  :value="editingPaperEntityDraft.volume"
                  @event:change="(value: string) => (editingPaperEntityDraft.volume = value)"
                />
                <InputBox
                  class="basis-1/2 w-8"
                  placeholder="Pages"
                  :value="editingPaperEntityDraft.pages"
                  @event:change="(value: string) => (editingPaperEntityDraft.pages = value)"
                />
              </div>
              <div class="basis-1/2 flex space-x-2">
                <InputBox
                  class="basis-1/2 w-8"
                  placeholder="Number"
                  :value="editingPaperEntityDraft.number"
                  @event:change="(value: string) => (editingPaperEntityDraft.number = value)"
                />
                <InputBox
                  class="basis-1/2 w-8"
                  placeholder="Publisher"
                  :value="editingPaperEntityDraft.publisher"
                  @event:change="
                    (value: string) => (editingPaperEntityDraft.publisher = value)
                  "
                />
              </div>
            </div>
            <div class="flex w-full space-x-2">
              <InputBox
                placeholder="arXiv ID"
                class="w-1/2"
                :value="editingPaperEntityDraft.arxiv"
                @event:change="(value: string) => (editingPaperEntityDraft.arxiv = value)"
              />
              <InputBox
                placeholder="DOI"
                class="w-1/2"
                :value="editingPaperEntityDraft.doi"
                @event:change="(value: string) => (editingPaperEntityDraft.doi = value)"
              />
            </div>
            <MultiselectBox
              id="paper-edit-view-tags-input"
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
              :placeholder="$t('mainview.note') + ' (start with `<md> to use markdown`)'"
              class="h-28"
              :value="editingPaperEntityDraft.note"
              :is-expanded="wideMode"
              :can-expand="true"
              @event:change="(value: string) => (editingPaperEntityDraft.note = value)"
              v-if="!wideMode"
              @event:expand="(expanded: boolean) => (wideMode = expanded)"
            />
          </div>

          <div class="h-full w-full" v-if="wideMode">
            <InputField
              placeholder="Note (start with '<md>' to use markdown)"
              class="h-full w-full"
              :value="editingPaperEntityDraft.note"
              :is-expanded="wideMode"
              :can-expand="true"
              @event:change="(value: string) => (editingPaperEntityDraft.note = value)"
              v-if="wideMode"
              @event:expand="(expanded: boolean) => (wideMode = expanded)"
            />
          </div>
        </div>

        <div class="flex" v-show="advancedMode">
          <CodesInput
            class="max-h-40 w-full"
            :codes="editingPaperEntityDraft.codes"
            @event:change="(codes) => (editingPaperEntityDraft.codes = codes)"
          />
        </div>

        <div class="flex justify-between space-x-2 py-1">
          <div class="flex space-x-2 py-1">
            <div
              class="flex w-20 h-6 rounded-md bg-neutral-300 dark:bg-neutral-500 dark:text-neutral-300 hover:shadow-sm my-auto"
              @click="advancedMode = !advancedMode"
            >
              <span class="m-auto text-xs">{{
                advancedMode ? $t("menu.close") : $t("menu.advanced")
              }}</span>
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
