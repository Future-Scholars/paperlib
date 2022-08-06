<script setup lang="ts">
import { PropType, ref } from "vue";

import InputBox from "./components/input-box.vue";
import InputField from "./components/input-field.vue";
import SelectBox from "./components/select-box.vue";
import MultiselectBox from "./components/multiselect-box.vue";

import {
  PaperFolder,
  PaperTag,
} from "../../../../preload/models/PaperCategorizer";
import { PaperEntityDraft } from "../../../../preload/models/PaperEntityDraft";
import { PaperEntity } from "../../../../preload/models/PaperEntity";

defineProps({
  tags: {
    type: Array as PropType<PaperTag[]>,
    required: true,
  },
  folders: {
    type: Array as PropType<PaperFolder[]>,
    required: true,
  },
});

const isEditViewShown = ref(false);
const wideMode = ref(false);
const entityDraft = ref(new PaperEntityDraft());

const pubTypes = ["Article", "Conference", "Others", "Book"];

const keyDownListener = (e: KeyboardEvent) => {
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement
  ) {
    if (e.key === "Escape") {
      onCloseClicked();
    }
    return true;
  }

  e.preventDefault();
  if (e.key === "Escape") {
    onCloseClicked();
  }
};

window.appInteractor.registerState("viewState.isEditViewShown", (value) => {
  isEditViewShown.value = value as boolean;
  if (isEditViewShown) {
    window.addEventListener("keydown", keyDownListener, { once: true });
  }
});

window.appInteractor.registerState("sharedData.editEntityDraft", (value) => {
  entityDraft.value.initialize(JSON.parse(value as string) as PaperEntity);
});

const onCloseClicked = () => {
  window.appInteractor.setState("viewState.isEditViewShown", false);
};

const onSaveClicked = async () => {
  window.entityInteractor.update(JSON.stringify([entityDraft.value]));
  window.appInteractor.setState("viewState.isEditViewShown", false);
};
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-75"
    enter-from-class="transform opacity-0"
    enter-to-class="transform opacity-100"
    leave-active-class="transition ease-in duration-75"
    leave-from-class="transform opacity-100"
    leave-to-class="transform opacity-0"
  >
    <div
      class="fixed top-0 right-0 left-0 z-50 w-screen h-screen bg-neutral-800 dark:bg-neutral-900 bg-opacity-50 dark:bg-opacity-80"
      v-if="isEditViewShown"
    >
      <div class="flex flex-col justify-center items-center w-full h-full">
        <div
          class="m-auto flex flex-col p-2 border-[1px] dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 rounded-lg shadow-lg select-none space-y-2"
          :class="wideMode ? 'w-[800px]' : 'w-[500px]'"
        >
          <div class="flex space-x-2">
            <div
              class="flex flex-col space-y-2"
              :class="wideMode ? 'w-1/2' : 'w-full'"
            >
              <InputBox
                placeholder="Title"
                :value="entityDraft.title"
                @changed="(value) => (entityDraft.title = value)"
              />
              <InputBox
                placeholder="Authors"
                :value="entityDraft.authors"
                @changed="(value) => (entityDraft.authors = value)"
              />
              <InputBox
                placeholder="Publication"
                :value="entityDraft.publication"
                @changed="(value) => (entityDraft.publication = value)"
              />
              <div class="flex w-full space-x-2">
                <InputBox
                  placeholder="Pub Time"
                  class="w-1/2"
                  :value="entityDraft.pubTime"
                  @changed="(value) => (entityDraft.pubTime = value)"
                />
                <SelectBox
                  placeholder="Publication Type"
                  class="w-1/2"
                  :options="pubTypes"
                  :value="pubTypes[entityDraft.pubType]"
                  @changed="
                    (value) => {
                      entityDraft.pubType = pubTypes.indexOf(value);
                    }
                  "
                />
              </div>
              <div
                class="flex flex-row space-x-2"
                v-if="entityDraft.pubType === 0"
              >
                <div class="basis-1/2 flex space-x-2">
                  <InputBox
                    class="basis-1/2 w-8"
                    placeholder="Volumn"
                    :value="entityDraft.volume"
                    @changed="(value) => (entityDraft.volume = value)"
                  />
                  <InputBox
                    class="basis-1/2 w-8"
                    placeholder="Pages"
                    :value="entityDraft.pages"
                    @changed="(value) => (entityDraft.pages = value)"
                  />
                </div>
                <div class="basis-1/2 flex space-x-2">
                  <InputBox
                    class="basis-1/2 w-8"
                    placeholder="Number"
                    :value="entityDraft.number"
                    @changed="(value) => (entityDraft.number = value)"
                  />
                  <InputBox
                    class="basis-1/2 w-8"
                    placeholder="Publisher"
                    :value="entityDraft.publisher"
                    @changed="(value) => (entityDraft.publisher = value)"
                  />
                </div>
              </div>
              <div class="flex w-full space-x-2">
                <InputBox
                  placeholder="arXiv ID"
                  class="w-1/2"
                  :value="entityDraft.arxiv"
                  @changed="(value) => (entityDraft.arxiv = value)"
                />
                <InputBox
                  placeholder="DOI"
                  class="w-1/2"
                  :value="entityDraft.doi"
                  @changed="(value) => (entityDraft.doi = value)"
                />
              </div>
              <MultiselectBox
                placeholder="Tags"
                :options="tags.map((tag) => tag.name)"
                :existValues="
                  entityDraft.tags
                    .split(';')
                    .map((tag) => tag.replaceAll(' ', ''))
                    .filter((tag) => tag.length > 0)
                "
                @changed="
              (values) => {
                entityDraft.tags = values.map((tag: string) => tag.trim()).join('; ');
              }
            "
              />
              <MultiselectBox
                placeholder="Folders"
                :options="folders.map((folder) => folder.name)"
                :existValues="
                  entityDraft.folders
                    .split(';')
                    .map((folder) => folder.replaceAll(' ', ''))
                    .filter((folder) => folder.length > 0)
                "
                @changed="
              (values) => {
                entityDraft.folders = values.map((folder: string) => folder.trim()).join('; ');
              }
            "
              />
              <InputField
                placeholder="Note"
                class="h-28"
                :value="entityDraft.note"
                :is-expanded="wideMode"
                @changed="(value) => (entityDraft.note = value)"
                v-if="!wideMode"
                @expand="(expanded) => (wideMode = expanded)"
              />
            </div>

            <div class="h-full w-full" v-if="wideMode">
              <InputField
                placeholder="Note (start with '<md>' to use markdown)"
                class="h-full w-full"
                :value="entityDraft.note"
                :is-expanded="wideMode"
                @changed="(value) => (entityDraft.note = value)"
                v-if="wideMode"
                @expand="(expanded) => (wideMode = expanded)"
              />
            </div>
          </div>
          <div class="flex justify-end space-x-2">
            <div
              class="flex w-24 h-8 rounded-lg bg-neutral-300 dark:bg-neutral-500 dark:text-neutral-300 hover:shadow-sm"
              @click="onCloseClicked"
            >
              <span class="m-auto text-xs">Cancel</span>
            </div>
            <div
              class="flex w-24 h-8 rounded-lg bg-accentlight dark:bg-accentdark hover:shadow-sm"
              @click="onSaveClicked"
            >
              <span class="m-auto text-xs text-white">Save</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
