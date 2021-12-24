<template>
  <div class="detail-title">{{ entity.title }}</div>

  <div class="detail-section-title">Authors</div>
  <div class="detail-section-content">{{ entity.authors }}</div>

  <div class="detail-section-title">Publication</div>
  <div class="detail-section-content">{{ entity.publication }}</div>

  <div class="detail-section-title">Publication Year</div>
  <div class="detail-section-content">{{ entity.pubTime }}</div>

  <div class="detail-section-title" v-if="entity.tags.length > 0">Tags</div>
  <div class="detail-section-content" v-if="entity.tags.length > 0">
    {{ entity.tags.map((tag) => tag.name).join("; ") }}
  </div>

  <div class="detail-section-title" v-if="entity.folders.length > 0">
    Folders
  </div>
  <div class="detail-section-content" v-if="entity.folders.length > 0">
    {{ entity.folders.map((folders) => folders.name).join("; ") }}
  </div>

  <div class="detail-section-title">Add Time</div>
  <div class="detail-section-content">
    {{ entity.addTime.toLocaleDateString() }}
  </div>

  <div class="detail-section-title">Rating</div>
  <q-rating
    :model-value="entity.rating"
    size="1em"
    :max="5"
    color="grey-8"
    style="margin-bottom: 1em"
    @update:model-value="ratingEvent"
  />

  <div class="detail-section-title">Preview</div>
  <div
    style="
      height: 210px;
      width: 150px;
      position: absolute;
      border: 1px solid #ddd;
      border-radius: 5px;
    "
    v-on:dblclick="openFileEvent(entity.mainURL)"
  />
  <vue-pdf-embed
    :source="joined(entity.mainURL)"
    :page="1"
    style="height: 210px; width: 150px; margin-bottom: 1em"
  />

  <div class="detail-section-title" v-if="entity.note.length > 0">Note</div>
  <div class="detail-section-content" v-if="entity.note.length > 0">
    {{ entity.note }}
  </div>

  <div class="detail-section-title q-mb-xs" v-if="entity.supURLs.length > 0">
    Supplementaries
  </div>
  <q-chip
    square
    size="md"
    dense
    color="grey-4"
    clickable
    v-for="sup in entity.supURLs"
    :key="sup"
    @click="openFileEvent(sup)"
    class="q-mt-none q-ml-none"
  >
    <div style="font-size: 10px; color: #666666">
      {{ sup.split(".").pop().toUpperCase() }}
    </div>
    <q-menu touch-position context-menu>
      <q-list dense style="min-width: 50px">
        <q-item clickable v-close-popup @click="deleteSupEvent(sup)">
          <q-item-section style="font-size: 0.9em">Delete</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-chip>
</template>

<style lang="sass">
@import 'src/css/detailview.scss'
</style>

<script>
import { defineComponent, toRefs } from "vue";
import VuePdfEmbed from "vue-pdf-embed";

export default defineComponent({
  name: "DetailView",

  components: {
    VuePdfEmbed,
  },

  props: {
    entity: {
      type: Object,
      required: true,
    },
  },

  setup(props) {
    const openFileEvent = (url) => {
      window.api.open(url);
    };

    const deleteSupEvent = (url) => {
      let editEntity = JSON.parse(JSON.stringify(props.entity));
      editEntity.tags = editEntity.tags.map((tag) => tag.name).join("; ");
      editEntity.folders = editEntity.folders
        .map((folder) => folder.name)
        .join("; ");
      window.api.deleteSup(editEntity, url);
    };

    const ratingEvent = (value) => {
      let editEntity = JSON.parse(JSON.stringify(props.entity));
      editEntity.tags = editEntity.tags.map((tag) => tag.name).join("; ");
      editEntity.folders = editEntity.folders
        .map((folder) => folder.name)
        .join("; ");
      editEntity.rating = value;
      window.api.update(editEntity);
    };

    const joined = (url) => {
      return window.api.getJoinedPath(url, true);
    };

    return {
      openFileEvent,
      deleteSupEvent,
      ratingEvent,
      joined,
      ...toRefs(props),
    };
  },
});
</script>
