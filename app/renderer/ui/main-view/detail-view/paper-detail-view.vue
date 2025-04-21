<script setup lang="ts">
import { onUpdated, ref } from "vue";

import { Categorizer, CategorizerType } from "@/models/categorizer";
import { Entity } from "@/models/entity";

import Authors from "./components/authors.vue";
import Categorizers from "./components/categorizers.vue";
import Markdown from "./components/markdown.vue";
import PubDetails from "./components/pub-details.vue";
import Rating from "./components/rating.vue";
import Section from "./components/section.vue";
import Supplementaries from "./components/supplementary.vue";
import Thumbnail from "./components/thumbnail.vue";
import { Supplementary } from "@/models/supplementary";
import { uid } from "@/base/misc";
import { constructFileURL } from "@/base/url";
import { getPublicationString } from "@/base/string";

const props = defineProps({
  entity: {
    type: Object as () => Entity,
    required: true,
  },

  slot1: {
    type: Object as () => { [id: string]: { title: string; content: string } },
    default: {},
  },

  slot2: {
    type: Object as () => { [id: string]: { title: string; content: string } },
    default: {},
  },

  slot3: {
    type: Object as () => { [id: string]: { title: string; content: string } },
    default: {},
  },
});
// #ENHANCE: should we support button slots? html slots?

// ======================
// State
// ======================
const uiState = PLUIAPILocal.uiStateService.useState();

// ==============================
// Event Handler
// ==============================
const onRatingChanged = (value: number) => {
  const paperEntityDraft = new Entity(props.entity);
  paperEntityDraft.rating = value;
  PLAPI.paperService.update([paperEntityDraft], false, true);
};

const onDeleteCategorizer = (
  categorizer: Categorizer,
  type: CategorizerType
) => {
  const paperEntityDraft = new Entity(props.entity);
  if (type === CategorizerType.PaperTag) {
    paperEntityDraft.tags = paperEntityDraft.tags.filter((tag) => {
      return tag.name !== categorizer.name;
    });
  } else {
    paperEntityDraft.folders = paperEntityDraft.folders.filter((folder) => {
      return folder.name !== categorizer.name;
    });
  }
  PLAPI.paperService.update([paperEntityDraft], false, true);
};

const modifyMainFile = async (url: string) => {
  if (props.entity.defaultSup) {
    const mainSup = new Supplementary(props.entity.supplementaries[props.entity.defaultSup]);
    mainSup.url = constructFileURL(url, false, true, "", "file://");
    const paperEntityDraft = new Entity(props.entity);
    await PLAPI.paperService.updateSups(paperEntityDraft, [mainSup]);
    setTimeout(async () => {
      await PLAPI.cacheService.updateThumbnailCache(paperEntityDraft, {
        blob: new ArrayBuffer(0),
        width: 0,
        height: 0,
      });

      uiState.renderRequired = Date.now();
    }, 1000);
  } else {
    const mainSup = new Supplementary({
      _id: uid(),
      url: constructFileURL(url, false, true, "", "file://"),
    });
    const paperEntityDraft = new Entity(props.entity);
    paperEntityDraft.supplementaries[mainSup._id] = mainSup;
    await PLAPI.paperService.updateSups(paperEntityDraft, [mainSup], mainSup._id);
    setTimeout(async () => {
      await PLAPI.cacheService.updateThumbnailCache(paperEntityDraft, {
        blob: new ArrayBuffer(0),
        width: 0,
        height: 0,
      });

      uiState.renderRequired = Date.now();
    }, 1000);
  }
};

const locateMainFile = async () => {
  // TODO: implement this.
  // const paperEntityDraft = new PaperEntity(props.entity);
  // const locatedPaperEntities = await PLAPI.fileService.locateFileOnWeb([
  //   paperEntityDraft,
  // ]);
  // paperEntityDraft.mainURL = "";
  // await PLAPI.paperService.updateMainURL(
  //   paperEntityDraft,
  //   locatedPaperEntities[0].mainURL
  // );
  // setTimeout(() => {
  //   uiState.renderRequired = Date.now();
  // }, 1000);
};

const addSups = (urls: string[]) => {
  const paperEntityDraft = new Entity(props.entity);
  const newSups = urls.map((url) => {
    const sup = new Supplementary({
      _id: uid(),
      url: url,
    });
    return sup;
  });

  PLAPI.paperService.updateSups(paperEntityDraft, newSups);
};

const dragAreaOpacity = ref(0);
const dragCount = ref(0);
const mainFileDragAreaHovered = ref(false);
const supFileDragAreaHovered = ref(false);

const onDragEntered = (e: MouseEvent, id?: string) => {
  if (id === "main-file-drag-area") {
    mainFileDragAreaHovered.value = true;
  } else if (id === "sup-file-drag-area") {
    supFileDragAreaHovered.value = true;
  }

  dragAreaOpacity.value = 100;
  dragCount.value += 1;

  e.preventDefault();
};
const onDragLeaved = (e: MouseEvent, id?: string) => {
  if (id === "main-file-drag-area") {
    mainFileDragAreaHovered.value = false;
  } else if (id === "sup-file-drag-area") {
    supFileDragAreaHovered.value = false;
  }

  dragCount.value -= 1;
  if (dragCount.value === 0) {
    dragAreaOpacity.value = 0;
  }

  e.preventDefault();
};
const onDragCancelled = (e: MouseEvent) => {
  dragAreaOpacity.value = 0;
  dragCount.value = 0;
  mainFileDragAreaHovered.value = false;
  supFileDragAreaHovered.value = false;
  e.preventDefault();
  e.stopPropagation();
};
const onDroppedToMain = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();

  const files = e.dataTransfer?.files;
  if (!files) {
    return;
  }

  for (let i = 0; i < files.length; i++) {
    modifyMainFile(files[i].path);
  }
  dragAreaOpacity.value = 0;
  dragCount.value = 0;
  mainFileDragAreaHovered.value = false;
  supFileDragAreaHovered.value = false;
};
const onDroppedToSup = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();

  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) {
    const text = e.dataTransfer?.getData("text/plain");

    if (text && text.startsWith("http")) {
      addSups([text]);
      dragAreaOpacity.value = 0;
      dragCount.value = 0;
      mainFileDragAreaHovered.value = false;
      supFileDragAreaHovered.value = false;
    }
    return;
  }

  const filePaths: string[] = [];
  for (let i = 0; i < files.length; i++) {
    filePaths.push(
      constructFileURL(files[i].path, false, true, "", "file://")
    );
  }
  addSups(filePaths);
  dragAreaOpacity.value = 0;
  dragCount.value = 0;
  mainFileDragAreaHovered.value = false;
  supFileDragAreaHovered.value = false;
};

const reanderedTitle = ref("");

const renderTitle = async () => {
  if (props.entity.title?.includes("$")) {
    reanderedTitle.value = await PLAPI.renderService.renderMath(props.entity.title);
  } else {
    reanderedTitle.value = props.entity.title;
  }
};

onUpdated(() => {
  renderTitle();
});
</script>

<template>
  <div
    id="detail-view"
    class="flex-none flex flex-col h-[calc(100vh-3rem)] pl-4 pr-2 pb-4"
    @dragenter="onDragEntered"
    @dragleave="onDragLeaved"
    @dragover="(e) => e.preventDefault()"
    @drop.prevent="onDragCancelled"
  >
    <div class="flex flex-col grow overflow-auto">
      <div class="text-md font-bold" v-html="reanderedTitle"></div>
      <Section :title="$t('mainview.authors')">
        <Authors :authors="entity.authors" />
      </Section>
      <PubDetails
        :publication="getPublicationString(entity)"
        :volume="entity.volume"
        :pages="entity.pages"
        :number="entity.number"
        :publisher="entity.publisher"
      />
      <Section :title="$t('mainview.year')">
        <div class="text-xxs">
          {{ entity.year }}
        </div>
      </Section>

      <Section
        :id="`detailspanel-slot1-${id}`"
        v-for="[id, item] of Object.entries(slot1)"
        :title="item.title"
      >
        <div class="text-xxs" v-html="item.content">
        </div>
      </Section>

      <Section
        id="detail-tag-section"
        :title="$t('mainview.tags')"
        v-if="entity.tags.length > 0"
      >
        <Categorizers
          :categorizers="entity.tags"
          categorizerType="PaperTag.schema.name"
          @event:delete="
            (categorizer) =>
              onDeleteCategorizer(categorizer, CategorizerType.PaperTag)
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
          categorizerType="PaperFolder.schema.name"
          @event:delete="
            (categorizer) =>
              onDeleteCategorizer(categorizer, CategorizerType.PaperFolder)
          "
        />
      </Section>
      <Section :title="$t('mainview.addTime')">
        <div class="text-xxs">
          {{ entity.addTime.toLocaleString() }}
        </div>
      </Section>
      <Section :title="$t('mainview.rating')">
        <Rating :rating="entity.rating || 0" @event:change="onRatingChanged" />
      </Section>

      <Section
        :id="`detailspanel-slot2-${id}`"
        v-for="[id, item] of Object.entries(slot2)"
        :title="item.title"
      >
        <div class="text-xxs" v-html="item.content">
        </div>
      </Section>

      <Section :title="$t('mainview.preview')">
        <Thumbnail
          @event:modify="modifyMainFile"
          @event:locate="locateMainFile"
          :entity="entity"
        />
      </Section>
      <Section
        :title="$t('mainview.note')"
        v-if="entity.note && entity.note.length > 0 && !entity.note.startsWith('<md>')"
      >
        <div class="text-xxs break-words">
          {{ entity.note }}
        </div>
      </Section>
      <Markdown
        :title="$t('mainview.note')"
        v-if="entity.note && entity.note.length > 0 && entity.note.startsWith('<md>')"
        :content="entity.note"
      />
      <Supplementaries :entity="entity"
        v-if="Object.keys(entity.supplementaries).length > 0 || entity.doi || entity.arxiv"
      />
      <!-- TODO: move this to a hover window -->
      <!-- <Markdown :title="'Markdown'" :sups="entity.supURLs" /> -->

      <Section
        :id="`detailspanel-slot3-${id}`"
        v-for="[id, item] of Object.entries(slot3)"
        :title="item.title"
      >
        <div class="text-xxs" v-html="item.content">
        </div>
      </Section>
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
        @dragenter="onDragEntered($event, 'main-file-drag-area')"
        @dragleave="onDragLeaved($event, 'main-file-drag-area')"
        @drop="onDroppedToMain"
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
        @dragenter="onDragEntered($event, 'sup-file-drag-area')"
        @dragleave="onDragLeaved($event, 'sup-file-drag-area')"
        @drop="onDroppedToSup"
      >
        <span class="m-auto select-none pointer-events-none">{{
          $t("menu.addsup")
        }}</span>
      </div>
    </div>
  </div>
</template>
