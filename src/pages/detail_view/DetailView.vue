<template>
    <div id="detail-view" class="detail-panel full-height">
        <div class="detail-title">{{ entity.title }}</div>
        <DetailTextSection title="Authors" :value="entity.authors" />
        <DetailTextSection title="Publication" :value="entity.publication" />
        <DetailTextSection title="Publication Year" :value="entity.pubTime" />
        <DetailTextSection title="Tags" :value="entity.tags.map((tag) => tag.name).join('; ')" v-if="entity.tags.length > 0" />
        <DetailTextSection
          title="Folders" :value="entity.folders.map((folder) => folder.name).join('; ')" v-if="entity.folders.length > 0"
        />
        <DetailTextSection title="Add Time" :value="entity.addTime.toLocaleDateString()" />
        <DetailRatingSection :initRating="entity.rating" @rating-changed="onRatingChanged"/>
        <DetailThumbnailSection :url="entity.mainURL" v-show="entity.mainURL"/>
        <DetailTextSection title="Note" :value="entity.note" v-if="entity.note.length > 0" />
        <DetailCodeSection :codes="entity.codes"/>
        <DetailSupSection :urls="entity.supURLs" @delete-sup="onDeleteSup"/>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs } from 'vue';
// @ts-ignore
import dragDrop from 'drag-drop';

import DetailTextSection from './components/DetailTextSection.vue';
import DetailRatingSection from './components/DetailRatingSection.vue';
import DetailThumbnailSection from './components/DetailThumbnailSection.vue';
import DetailSupSection from './components/DetailSupSection.vue';
import DetailCodeSection from './components/DetailCodeSection.vue';

import { PaperEntity } from '../../models/PaperEntity';
import { PaperEntityDraft } from '../../models/PaperEntityDraft';

export default defineComponent({
  name: 'DetailView',

  components: {
    DetailTextSection,
    DetailRatingSection,
    DetailThumbnailSection,
    DetailSupSection,
    DetailCodeSection,
  },

  props: {
    entity: {
      type: Object as PropType<PaperEntity>,
      required: true,
    },
  },

  setup(props) {
    const onRatingChanged = (value: number) => {
      const entityDraft = new PaperEntityDraft()
      entityDraft.initialize(props.entity);
      entityDraft.rating = value;
      void window.entityInteractor.update(JSON.stringify([entityDraft]));
    };

    const onDeleteSup = (url: string) => {
      const entityDraft = new PaperEntityDraft()
      entityDraft.initialize(props.entity);
      window.entityInteractor.deleteSup(JSON.stringify(entityDraft), url);
    };

    const onAddSups = (urls: string[]) => {
      const entityDraft = new PaperEntityDraft()
      entityDraft.initialize(props.entity);
      entityDraft.supURLs = [...entityDraft.supURLs, ...urls];
      void window.entityInteractor.update(JSON.stringify([entityDraft]));
    };

    const registerDropHandler = () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      dragDrop('#detail-view', {
        // @ts-ignore
        onDrop: (files, pos, fileList, directories) => {
          const filePaths: string[] = [];
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          files.forEach((file) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            filePaths.push(file.path);
          });
          onAddSups(filePaths);
        },
      });
    };

    return {
      onRatingChanged,
      onDeleteSup,
      onAddSups,
      registerDropHandler,
      ...toRefs(props),
    };
  },
  mounted() {
    this.registerDropHandler();
  },
});
</script>
