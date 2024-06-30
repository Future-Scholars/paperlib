<script setup lang="ts">
import { PaperEntity } from "@/models/paper-entity";
import { PropType, ref } from "vue";

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  candidates: {
    type: Object as PropType<PaperEntity[]>,
    required: true,
    default: [],
  },
});

// ================================
// State
// ================================
const uiState = uiStateService.useState();
const selectIdx = ref<number>(0);

// ================================
// Event handlers
// ================================
const onConfirmClicked = async () => {
  const paperEntityDraft = new PaperEntity(props.candidates[selectIdx.value]);
  const currentEntityDraft = (await paperService.loadByIds([props.id]))[0] as PaperEntity;

  if (currentEntityDraft) {
    paperEntityDraft.id = currentEntityDraft.id;
    paperEntityDraft.mainURL = currentEntityDraft.mainURL;
    paperEntityDraft.addTime = currentEntityDraft.addTime;
    paperEntityDraft._partition = currentEntityDraft._partition;
    paperEntityDraft.codes = currentEntityDraft.codes;
    paperEntityDraft.tags = currentEntityDraft.tags;
    paperEntityDraft.folders = currentEntityDraft.folders;
    paperEntityDraft.flag = currentEntityDraft.flag;
    paperEntityDraft.rating = currentEntityDraft.rating;
    paperEntityDraft.supURLs = currentEntityDraft.supURLs;
    paperEntityDraft.note = currentEntityDraft.note;

    paperService.update([paperEntityDraft], false, true);
  }
  uiState.showingCandidatesId = "";
  delete uiState.metadataCandidates[props.id]
};

const onCancelClicked = () => {
  uiState.showingCandidatesId = "";
  delete uiState.metadataCandidates[props.id]
};

</script>

<template>
  <div
    id="candidates-view"
    class="flex-none flex flex-col h-[calc(100vh-3rem)] px-2"
  >
    <div class="flex flex-col overflow-auto grow">
      <div
        class="flex flex-col w-full p-2 rounded-md select-none cursor-pointer"
        :class="selectIdx === idx ? `bg-accentlight dark:bg-accentdark` : ''"
        v-for="(candidate, idx) in candidates"
        @click="selectIdx = idx"
      >
        <div
          class="flex space-x-2"
          :class="selectIdx === idx ? 'text-white' : ''"
        >
          <div
            class="text-[0.84rem] leading-[1.1rem] font-semibold overflow-hidden grow line-clamp-2"
          >
            {{ candidate.title }}
          </div>
        </div>
        <div
          class="text-[0.7rem] leading-[0.9rem] truncate overflow-hidden"
          :class="selectIdx === idx ? 'text-white' : ''"
        >
          {{ candidate.authors }}
        </div>
        <div
          class="text-[0.7rem] leading-[0.9rem] text-neutral-400 flex space-x-2"
          :class="selectIdx === idx ? 'text-neutral-300' : ''"
        >
          <div>{{ candidate.pubTime }}</div>
          <div class="flex space-x-2 text-ellipsis overflow-hidden shrink">
            <div>|</div>
            <div class="italic truncate">
              {{ candidate.publication }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="flex space-x-2 py-2 justify-between select-none">
      <div
        class="flex w-1/2 h-8 rounded-md bg-neutral-200 dark:bg-neutral-600 dark:text-neutral-300 hover:shadow-sm hover:bg-neutral-300 hover:dark:bg-neutral-500 cursor-pointer transition-colors duration-75"
        @click="onCancelClicked"
      >
        <span class="m-auto text-xs">{{ $t("menu.close") }}</span>
      </div>
      <div
        id="paper-edit-view-save-btn"
        class="flex w-1/2 h-8 rounded-md bg-neutral-200 dark:bg-neutral-600 dark:text-neutral-300 hover:shadow-sm hover:bg-neutral-300 hover:dark:bg-neutral-500 cursor-pointer transition-colors duration-75"
        @click="onConfirmClicked()"
      >
        <span class="m-auto text-xs">{{ $t("menu.save") }}</span>
      </div>
    </div>
  </div>
</template>
