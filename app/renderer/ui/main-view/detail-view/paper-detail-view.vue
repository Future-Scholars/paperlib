<script setup lang="ts">
// @ts-ignore
import dragDrop from "drag-drop";
import { onBeforeUpdate, onMounted, ref } from "vue";

import { Categorizer, CategorizerType } from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import Authors from "./components/authors.vue";
import Categorizers from "./components/categorizers.vue";
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
  void window.entityInteractor.update([paperEntityDraft]);
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
  void window.entityInteractor.update([paperEntityDraft]);
};

const modifyMainFile = async (url: string) => {
  const paperEntityDraft = new PaperEntity(false).initialize(props.entity);
  paperEntityDraft.mainURL = url;
  const updatedPaperEntity = await window.entityInteractor.update([
    paperEntityDraft,
  ]);
  await window.entityInteractor.updateCache(updatedPaperEntity);
  setTimeout(() => {
    viewState.renderRequired = Date.now();
  }, 500);
};

const locateMainFile = async () => {
  const paperEntityDraft = new PaperEntity(false).initialize(props.entity);
  const updatedPaperEntity = await window.entityInteractor.locateMainFile([
    paperEntityDraft,
  ]);
  await window.entityInteractor.updateCache(updatedPaperEntity);
  viewState.renderRequired = Date.now();
};

const addSups = (urls: string[]) => {
  const paperEntityDraft = new PaperEntity(false).initialize(props.entity);
  paperEntityDraft.supURLs = [...paperEntityDraft.supURLs, ...urls];
  void window.entityInteractor.update([paperEntityDraft]);
};

const onDeleteSup = (url: string) => {
  const paperEntityDraft = new PaperEntity(false).initialize(props.entity);
  window.entityInteractor.deleteSup(props.entity, url);
};

window.appInteractor.registerMainSignal("sup-context-menu-delete", (args) => {
  onDeleteSup(args);
});

const registerDropHandler = () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  dragDrop("#detail-view", {
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
    },
  });
};

const reanderedTitle = ref("");

const renderTitle = async () => {
  if (props.entity.title?.includes("$")) {
    reanderedTitle.value = await window.renderInteractor.renderMath(
      props.entity.title
    );
  } else {
    reanderedTitle.value = props.entity.title;
  }
};

onBeforeUpdate(() => {
  renderTitle();
});

onMounted(() => {
  registerDropHandler();
});
</script>

<template>
  <div
    id="detail-view"
    class="flex-none flex flex-col w-80 max-h-[calc(100vh-3rem)] pl-4 pr-2 pb-4 overflow-auto"
  >
    <div class="text-md font-bold" v-html="reanderedTitle"></div>
    <Section title="Authors">
      <Authors :authors="entity.authors" />
    </Section>
    <PubDetails
      :publication="entity.publication"
      :volume="entity.volume"
      :pages="entity.pages"
      :number="entity.number"
      :publisher="entity.publisher"
    />
    <Section title="Publication Year">
      <div class="text-xxs">
        {{ entity.pubTime }}
      </div>
    </Section>
    <Section title="Tags" v-if="entity.tags.length > 0">
      <Categorizers
        :categorizers="entity.tags"
        categorizerType="PaperTag"
        @delete-categorizer="
          (categorizer) => onDeleteCategorizer(categorizer, 'PaperTag')
        "
      />
    </Section>
    <Section title="Folders" v-if="entity.folders.length > 0">
      <Categorizers
        :categorizers="entity.folders"
        categorizerType="PaperFolder"
        @delete-categorizer="
          (categorizer) => onDeleteCategorizer(categorizer, 'PaperFolder')
        "
      />
    </Section>
    <Section title="Add Time">
      <div class="text-xxs">
        {{ entity.addTime.toLocaleString() }}
      </div>
    </Section>
    <Section title="Rating">
      <Rating :rating="entity.rating" @changed="onRatingChanged" />
    </Section>
    <Section title="Preview">
      <Thumbnail
        :entity="entity"
        @modify-main-file="(value) => modifyMainFile(value)"
        @locate-main-file="locateMainFile"
      />
    </Section>
    <Section
      title="Note"
      v-if="entity.note.length > 0 && !entity.note.startsWith('<md>')"
    >
      <div class="text-xxs">
        {{ entity.note }}
      </div>
    </Section>
    <Markdown
      :title="'Note'"
      v-if="entity.note.length > 0 && entity.note.startsWith('<md>')"
      :content="entity.note"
    />
    <Section title="Codes" v-if="entity.codes.length > 0">
      <Code :codes="entity.codes" />
    </Section>
    <Section title="Supplementaries" v-if="entity.supURLs.length > 0">
      <Supplementary :sups="entity.supURLs" />
    </Section>
    <Markdown :title="'Markdown'" :sups="entity.supURLs" />
    <div class="w-40 h-10">&nbsp;</div>
    <div
      class="fixed bottom-0 w-80 h-10 bg-gradient-to-t from-white dark:from-neutral-800"
    ></div>
  </div>
</template>
