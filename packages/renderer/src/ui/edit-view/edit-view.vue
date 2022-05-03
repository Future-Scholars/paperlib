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
const entityDraft = ref(new PaperEntityDraft());

const pubTypes = ["Article", "Conference", "Others", "Book"];

window.appInteractor.registerState("viewState.isEditViewShown", (value) => {
  isEditViewShown.value = value as boolean;
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
          class="m-auto flex flex-col justify-between p-2 border-[1px] dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 w-[500px] rounded-lg shadow-lg select-none space-y-2"
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
            :values="
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
            :values="
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
            class="min-h-96"
            :value="entityDraft.note"
            @changed="(value) => (entityDraft.note = value)"
          />

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
