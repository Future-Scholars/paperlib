<script setup lang="ts">
import { PaperEntity } from "../../../../../preload/models/PaperEntity";
import { PaperEntityDraft } from "../../../../../preload/models/PaperEntityDraft";

import Section from "./components/section.vue";
import Rating from "./components/rating.vue";
import Code from "./components/code.vue";
import Authors from "./components/authors.vue";
import Thumbnail from "./components/thumbnail.vue";
import Supplementary from "./components/supplementary.vue";

const props = defineProps({
  entity: {
    type: Object as () => PaperEntity,
    required: true,
  },
});

const onRatingChanged = (value: number) => {
  const entityDraft = new PaperEntityDraft();
  entityDraft.initialize(props.entity);
  entityDraft.rating = value;
  void window.entityInteractor.update(JSON.stringify([entityDraft]));
};
</script>

<template>
  <div
    class="flex-none flex flex-col w-80 max-h-[calc(100vh-3rem)] px-4 pb-4 overflow-auto"
  >
    <div class="text-md font-bold">
      {{ entity.title }}
    </div>
    <Section title="Authors">
      <Authors :authors="entity.authors" />
    </Section>
    <Section title="Publication">
      <div class="text-xxs">
        {{ entity.publication }}
      </div>
    </Section>
    <Section title="Publication Year">
      <div class="text-xxs">
        {{ entity.pubTime }}
      </div>
    </Section>
    <Section title="Tags" v-if="entity.tags.length > 0">
      <div class="text-xxs">
        {{ entity.tags.map((tag) => tag.name).join("; ") }}
      </div>
    </Section>
    <Section title="Folders" v-if="entity.folders.length > 0">
      <div class="text-xxs">
        {{ entity.folders.map((folder) => folder.name).join("; ") }}
      </div>
    </Section>
    <Section title="Add Time">
      <div class="text-xxs">
        {{ entity.addTime.toLocaleString() }}
      </div>
    </Section>
    <Section title="Rating">
      <Rating :rating="entity.rating" @changed="onRatingChanged" />
    </Section>
    <Section title="Preview" v-if="entity.mainURL">
      <Thumbnail :url="entity.mainURL" />
    </Section>
    <Section title="Note" v-if="entity.note.length > 0">
      <div class="text-xxs">
        {{ entity.note }}
      </div>
    </Section>
    <Section title="Codes" v-if="entity.codes.length > 0">
      <Code :codes="entity.codes" />
    </Section>
    <Section title="Supplementaries" v-if="entity.supURLs.length > 0">
      <Supplementary :sups="entity.supURLs" />
    </Section>
  </div>
</template>
