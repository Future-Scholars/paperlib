<script setup lang="ts">
// @ts-ignore
import dragDrop from "drag-drop";
import { Ref, onBeforeUpdate, onMounted, ref, watch } from "vue";

import { Categorizer, CategorizerType } from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import Authors from "./components/authors.vue";
import Categorizers from "./components/categorizers.vue";
import CitationCount from "./components/citationcount.vue";
import Code from "./components/code.vue";
import Markdown from "./components/markdown.vue";
import PubDetails from "./components/pub-details.vue";
import Rating from "./components/rating.vue";
import Section from "./components/section.vue";
import Supplementary from "./components/supplementary.vue";
import Thumbnail from "./components/thumbnail.vue";

const props = defineProps({
  entity: {
    type: Object as () => PaperEntity,
    required: true,
  },
});

const viewState = MainRendererStateStore.useViewState();

const onRatingChanged = (value: number) => {
  const paperEntityDraft = new PaperEntity(false).initialize(props.entity);
  paperEntityDraft.rating = value;
  paperService.update([paperEntityDraft]);
};

const onDeleteCategorizer = (
  categorizer: Categorizer,
  type: CategorizerType
) => {
  const paperEntityDraft = new PaperEntity(false).initialize(props.entity);
  if (type === "PaperTag") {
    paperEntityDraft.tags = paperEntityDraft.tags.filter((tag) => {
      return tag.name !== categorizer.name;
    });
  } else {
    paperEntityDraft.folders = paperEntityDraft.folders.filter((folder) => {
      return folder.name !== categorizer.name;
    });
  }
  paperService.update([paperEntityDraft]);
};

const modifyMainFile = async (url: string) => {
  const paperEntityDraft = new PaperEntity(false).initialize(props.entity);
  paperEntityDraft.mainURL = url;
  const updatedPaperEntity = await paperService.update(
    [paperEntityDraft],
    false
  );
  await cacheService.updateCache(updatedPaperEntity);
  setTimeout(() => {
    viewState.renderRequired = Date.now();
  }, 500);
};

const locateMainFile = async () => {
  const paperEntityDraft = new PaperEntity(false).initialize(props.entity);
  const updatedPaperEntity = await fileService.locateFileOnWeb([
    paperEntityDraft,
  ]);
  await paperService.update(updatedPaperEntity);
  viewState.renderRequired = Date.now();
};

const addSups = (urls: string[]) => {
  const paperEntityDraft = new PaperEntity(false).initialize(props.entity);
  paperEntityDraft.supURLs = [...paperEntityDraft.supURLs, ...urls];
  paperService.update([paperEntityDraft], false);
};

const onDeleteSup = (url: string) => {
  const paperEntityDraft = new PaperEntity(false).initialize(props.entity);
  paperService.deleteSup(paperEntityDraft, url);
};

window.appInteractor.registerMainSignal("sup-context-menu-delete", (args) => {
  onDeleteSup(args);
});

const registerDropHandler = () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  dragDrop("#main-file-drag-area", {
    // @ts-ignore
    onDrop: (files, pos, fileList, directories) => {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      files.forEach((file) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        modifyMainFile(file.path);
      });
      dragAreaOpacity.value = 0;
      dragCount.value = 0;
      mainFileDragAreaHovered.value = false;
      supFileDragAreaHovered.value = false;
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  dragDrop("#sup-file-drag-area", {
    // @ts-ignore
    onDrop: (files, pos, fileList, directories) => {
      const filePaths: string[] = [];
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      files.forEach((file) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        filePaths.push(file.path);
      });
      addSups(filePaths);
      dragAreaOpacity.value = 0;
      dragCount.value = 0;
      mainFileDragAreaHovered.value = false;
      supFileDragAreaHovered.value = false;
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  dragDrop("#detail-view", {
    // @ts-ignore
    onDrop: (files, pos, fileList, directories) => {
      dragAreaOpacity.value = 0;
      dragCount.value = 0;
      mainFileDragAreaHovered.value = false;
      supFileDragAreaHovered.value = false;
    },
  });
};

const dragAreaOpacity = ref(0);
const dragCount = ref(0);
const mainFileDragAreaHovered = ref(false);
const supFileDragAreaHovered = ref(false);

const onDragEnter = (_: MouseEvent, id?: string) => {
  if (id === "main-file-drag-area") {
    mainFileDragAreaHovered.value = true;
  } else if (id === "sup-file-drag-area") {
    supFileDragAreaHovered.value = true;
  }

  dragAreaOpacity.value = 100;
  dragCount.value += 1;
};
const onDragLeave = (_: MouseEvent, id?: string) => {
  if (id === "main-file-drag-area") {
    mainFileDragAreaHovered.value = false;
  } else if (id === "sup-file-drag-area") {
    supFileDragAreaHovered.value = false;
  }

  dragCount.value -= 1;
  if (dragCount.value === 0) {
    dragAreaOpacity.value = 0;
  }
};

const reanderedTitle = ref("");

const renderTitle = async () => {
  if (props.entity.title?.includes("$")) {
    reanderedTitle.value = await renderService.renderMath(props.entity.title);
  } else {
    reanderedTitle.value = props.entity.title;
  }
};

const citationCount = ref({}) as Ref<
  Record<
    "semanticscholarId" | "citationCount" | "influentialCitationCount",
    string
  >
>;
const requestCitationCount = async () => {
  citationCount.value = {
    semanticscholarId: "",
    citationCount: "N/A",
    influentialCitationCount: "N/A",
  };
  const responseCitationCount = await window.entityInteractor.loadCitationCount(
    props.entity
  );
  citationCount.value.semanticscholarId =
    responseCitationCount.semanticscholarId;
  citationCount.value.citationCount = responseCitationCount.citationCount;
  citationCount.value.influentialCitationCount =
    responseCitationCount.influentialCitationCount;
};

watch(
  () => props.entity._id,
  () => {
    renderTitle();
    requestCitationCount();
  }
);

const onCitationCountClicked = (semanticscholarId: string) => {
  if (semanticscholarId) {
    fileService.open(
      `https://www.semanticscholar.org/paper/${semanticscholarId}`
    );
  }
};

onMounted(() => {
  registerDropHandler();
});
</script>

<template>
  <div
    id="detail-view"
    class="flex-none flex flex-col h-[calc(100vh-3rem)] pl-4 pr-2 pb-4"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
  >
    <div class="flex flex-col grow overflow-auto">
      <div class="text-md font-bold" v-html="reanderedTitle"></div>
      <Section :title="$t('mainview.authors')">
        <Authors :authors="entity.authors" />
      </Section>
      <PubDetails
        :publication="entity.publication"
        :volume="entity.volume"
        :pages="entity.pages"
        :number="entity.number"
        :publisher="entity.publisher"
      />
      <Section :title="$t('mainview.publicationyear')">
        <div class="text-xxs">
          {{ entity.pubTime }}
        </div>
      </Section>
      <Section :title="$t('mainview.citationcount')">
        <CitationCount
          :citation-count="citationCount.citationCount"
          :influential-citation-count="citationCount.influentialCitationCount"
          @click="onCitationCountClicked(citationCount.semanticscholarId)"
        />
      </Section>
      <Section
        id="detail-tag-section"
        :title="$t('mainview.tags')"
        v-if="entity.tags.length > 0"
      >
        <Categorizers
          :categorizers="entity.tags"
          categorizerType="PaperTag"
          @delete-categorizer="
            (categorizer) => onDeleteCategorizer(categorizer, 'PaperTag')
          "
        />
      </Section>
      <Section
        id="detail-folder-section"
        :title="$t('mainview.folders')"
        v-if="entity.folders.length > 0"
      >
        <Categorizers
          :categorizers="entity.folders"
          categorizerType="PaperFolder"
          @delete-categorizer="
            (categorizer) => onDeleteCategorizer(categorizer, 'PaperFolder')
          "
        />
      </Section>
      <Section :title="$t('mainview.addtime')">
        <div class="text-xxs">
          {{ entity.addTime.toLocaleString() }}
        </div>
      </Section>
      <Section :title="$t('mainview.rating')">
        <Rating :rating="entity.rating" @changed="onRatingChanged" />
      </Section>
      <Section :title="$t('mainview.preview')">
        <Thumbnail
          :entity="entity"
          @modify-main-file="(value) => modifyMainFile(value)"
          @locate-main-file="locateMainFile"
        />
      </Section>
      <Section
        :title="$t('mainview.note')"
        v-if="entity.note.length > 0 && !entity.note.startsWith('<md>')"
      >
        <div class="text-xxs break-words">
          {{ entity.note }}
        </div>
      </Section>
      <Markdown
        :title="$t('mainview.note')"
        v-if="entity.note.length > 0 && entity.note.startsWith('<md>')"
        :content="entity.note"
      />
      <Section :title="$t('mainview.codes')" v-if="entity.codes.length > 0">
        <Code :codes="entity.codes" />
      </Section>
      <Section
        :title="$t('mainview.supplementaries')"
        v-if="entity.supURLs.length > 0"
      >
        <Supplementary :sups="entity.supURLs" />
      </Section>
      <Markdown :title="'Markdown'" :sups="entity.supURLs" />
    </div>

    <div
      id="drag-area"
      class="h-16 flex-none flex space-x-2 text-xs text-neutral-400 bg-white dark:bg-neutral-800 pt-3 transition-all duration-150"
      v-show="dragAreaOpacity > 0"
    >
      <div
        id="main-file-drag-area"
        class="w-1/2 h-full border-[1px] border-neutral-400 dark:border-neutral-500 rounded-lg flex p-2 overflow-hidden"
        :class="
          mainFileDragAreaHovered
            ? 'border-solid border-neutral-500 text-neutral-500 dark:border-neutral-400 dark:text-neutral-300'
            : 'border-dashed'
        "
        @dragenter="onDragEnter($event, 'main-file-drag-area')"
        @dragleave="onDragLeave($event, 'main-file-drag-area')"
      >
        <span class="m-auto select-none pointer-events-none">{{
          $t("menu.replace")
        }}</span>
      </div>
      <div
        id="sup-file-drag-area"
        class="w-1/2 h-full border-[1px] border-neutral-400 dark:border-neutral-500 rounded-lg flex p-2 overflow-hidden"
        :class="
          supFileDragAreaHovered
            ? 'border-solid border-neutral-500 text-neutral-500 dark:border-neutral-400 dark:text-neutral-300'
            : 'border-dashed'
        "
        @dragenter="onDragEnter($event, 'sup-file-drag-area')"
        @dragleave="onDragLeave($event, 'sup-file-drag-area')"
      >
        <span class="m-auto select-none pointer-events-none">{{
          $t("menu.addsup")
        }}</span>
      </div>
    </div>
  </div>
</template>
