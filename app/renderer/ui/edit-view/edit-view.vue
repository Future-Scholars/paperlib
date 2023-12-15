<script setup lang="ts">
import { BIconQuestionCircle } from "bootstrap-icons-vue";
import { Ref, inject, ref } from "vue";

import { CategorizerType, PaperFolder, PaperTag } from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import { ICategorizerResults } from "@/repositories/db-repository/categorizer-repository";

import CodesInput from "./components/codes-input.vue";
import InputBox from "./components/input-box.vue";
import InputField from "./components/input-field.vue";
import MultiselectBox from "./components/multiselect-box.vue";
import SelectBox from "./components/select-box.vue";

// ==============================
// State
// ==============================
const uiState = uiStateService.useState();
const wideMode = ref(false);
const advancedMode = ref(false);

// ==============================
// Data
// ==============================
const pubTypes = ["Article", "Conference", "Others", "Book"];
const tags = inject<Ref<ICategorizerResults>>("tags");
const folders = inject<Ref<ICategorizerResults>>("folders");

const onCategorizerUpdated = (names: string[], type: CategorizerType) => {
  if (type === "PaperTag") {
    uiState.editingPaperEntityDraft.tags = names.map((name: string) => {
      return new PaperTag(name, 1, "blue");
    });
  } else if (type === "PaperFolder") {
    uiState.editingPaperEntityDraft.folders = names.map((name: string) => {
      return new PaperFolder(name, 1, "blue");
    });
  }
};

const onCloseClicked = () => {
  uiState.isEditViewShown = false;
};

const onSaveClicked = async () => {
  paperService.update([
    new PaperEntity(false).initialize(uiState.editingPaperEntityDraft),
  ]);
  onCloseClicked();
};

const onSaveAndScrapeClicked = async () => {
  const savedPaperEntityDraft = await paperService.update([
    new PaperEntity(false).initialize(uiState.editingPaperEntityDraft),
  ]);
  paperService.scrape(savedPaperEntityDraft);
};

shortcutService.register("Escape", onCloseClicked);
shortcutService.registerInInputField("Escape", onCloseClicked);
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
              :value="uiState.editingPaperEntityDraft.title"
              @changed="(value: string) => (uiState.editingPaperEntityDraft.title = value)"
            />
            <InputBox
              id="paper-edit-view-author-input"
              :placeholder="$t('mainview.authors')"
              :value="uiState.editingPaperEntityDraft.authors"
              @changed="(value: string) => (uiState.editingPaperEntityDraft.authors = value)"
            />
            <InputBox
              id="paper-edit-view-publication-input"
              :placeholder="$t('mainview.publicationtitle')"
              :value="uiState.editingPaperEntityDraft.publication"
              @changed="
                (value: string) => (uiState.editingPaperEntityDraft.publication = value)
              "
            />
            <div class="flex w-full space-x-2">
              <InputBox
                :placeholder="$t('mainview.publicationyear')"
                class="w-1/2"
                :value="uiState.editingPaperEntityDraft.pubTime"
                @changed="(value: string) => (uiState.editingPaperEntityDraft.pubTime = value)"
              />
              <SelectBox
                :placeholder="$t('mainview.publicationtype')"
                class="w-1/2"
                :options="pubTypes"
                :value="pubTypes[uiState.editingPaperEntityDraft.pubType]"
                @changed="
                  (value: string) => {
                    uiState.editingPaperEntityDraft.pubType = pubTypes.indexOf(value);
                  }
                "
              />
            </div>
            <div class="flex flex-row space-x-2">
              <div class="basis-1/2 flex space-x-2">
                <InputBox
                  class="basis-1/2 w-8"
                  placeholder="Volumn"
                  :value="uiState.editingPaperEntityDraft.volume"
                  @changed="(value: string) => (uiState.editingPaperEntityDraft.volume = value)"
                />
                <InputBox
                  class="basis-1/2 w-8"
                  placeholder="Pages"
                  :value="uiState.editingPaperEntityDraft.pages"
                  @changed="(value: string) => (uiState.editingPaperEntityDraft.pages = value)"
                />
              </div>
              <div class="basis-1/2 flex space-x-2">
                <InputBox
                  class="basis-1/2 w-8"
                  placeholder="Number"
                  :value="uiState.editingPaperEntityDraft.number"
                  @changed="(value: string) => (uiState.editingPaperEntityDraft.number = value)"
                />
                <InputBox
                  class="basis-1/2 w-8"
                  placeholder="Publisher"
                  :value="uiState.editingPaperEntityDraft.publisher"
                  @changed="
                    (value: string) => (uiState.editingPaperEntityDraft.publisher = value)
                  "
                />
              </div>
            </div>
            <div class="flex w-full space-x-2">
              <InputBox
                placeholder="arXiv ID"
                class="w-1/2"
                :value="uiState.editingPaperEntityDraft.arxiv"
                @changed="(value: string) => (uiState.editingPaperEntityDraft.arxiv = value)"
              />
              <InputBox
                placeholder="DOI"
                class="w-1/2"
                :value="uiState.editingPaperEntityDraft.doi"
                @changed="(value: string) => (uiState.editingPaperEntityDraft.doi = value)"
              />
            </div>
            <MultiselectBox
              id="paper-edit-view-tags-input"
              :placeholder="$t('mainview.tags')"
              :options="(tags ? tags : []).map((tag) => tag.name)"
              :existValues="
                uiState.editingPaperEntityDraft.tags.map((tag) => tag.name)
              "
              @changed="
                (values: string[]) => {
                  onCategorizerUpdated(values, 'PaperTag');
                }
              "
            />
            <MultiselectBox
              id="paper-edit-view-folders-input"
              :placeholder="$t('mainview.folders')"
              :options="(folders ? folders : []).map((folder) => folder.name)"
              :existValues="
                uiState.editingPaperEntityDraft.folders.map(
                  (folder) => folder.name
                )
              "
              @changed="
                (values: string[]) => {
                  onCategorizerUpdated(values, 'PaperFolder');
                }
              "
            />
            <InputField
              :placeholder="$t('mainview.note')"
              class="h-28"
              :value="uiState.editingPaperEntityDraft.note"
              :is-expanded="wideMode"
              :can-expand="true"
              @changed="(value: string) => (uiState.editingPaperEntityDraft.note = value)"
              v-if="!wideMode"
              @expand="(expanded: boolean) => (wideMode = expanded)"
            />
          </div>

          <div class="h-full w-full" v-if="wideMode">
            <InputField
              placeholder="Note (start with '<md>' to use markdown)"
              class="h-full w-full"
              :value="uiState.editingPaperEntityDraft.note"
              :is-expanded="wideMode"
              :can-expand="true"
              @changed="(value: string) => (uiState.editingPaperEntityDraft.note = value)"
              v-if="wideMode"
              @expand="(expanded: boolean) => (wideMode = expanded)"
            />
          </div>
        </div>

        <div class="flex" v-show="advancedMode">
          <CodesInput
            class="max-h-40 w-full"
            :codes="uiState.editingPaperEntityDraft.codes"
            @changed="
              (codes) => (uiState.editingPaperEntityDraft.codes = codes)
            "
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
