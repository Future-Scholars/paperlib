<template>
    <q-menu touch-position context-menu >
        <q-list dense style="min-width: 200px" class="menu-list">
            <EntitiesViewContextMenuItem label="Open" shortcutKey="enter" @click="openSelectedEntities" />
            <EntitiesViewContextMenuItem
              label="Edit" shortcutCmd="true" shortcutKey="E" @click="editSelectedEntities" :disable="selectedEntities.length > 1"
            />
            <EntitiesViewContextMenuItem label="Scrape" shortcutCmd="true" shortcutKey="R" @click="scrapeSelectedEntities"/>
            <EntitiesViewContextMenuItem label="Delete" shortcutKey="" @click="deleteSelectedEntities"/>
            <q-separator />
            <EntitiesViewContextMenuItem label="Toggle Flag" shortcutCmd="true" shortcutKey="F" @click="flagSelectedEntities"/>
            <EntitiesViewContextMenuItem
              label="Add Tags" shortcutCmd="true" shortcutKey="T" @click="tagSelectedEntities" :disable="selectedEntities.length > 1"
            />
            <EntitiesViewContextMenuItem
              label="Add Folders" shortcutCmd="true" shortcutKey="G" @click="folderSelectedEntities" :disable="selectedEntities.length > 1"
            />
            <EntitiesViewContextMenuItem
              label="Add Note" shortcutCmd="true" shortcutKey="N" @click="noteSelectedEntities" :disable="selectedEntities.length > 1"
            />
            <q-separator />
            <q-item clickable class="menu-list-item">
                <q-item-section style="font-size: 0.9em">Export</q-item-section>
                <q-item-section side>
                    <q-icon name="bi-chevron-right" style="font-size: 0.9em" />
                </q-item-section>
                <q-menu anchor="top end" self="top start">
                    <q-list dense style="min-width: 160px" class="menu-list">
                        <EntitiesViewContextMenuItem label="Bibtex" shortcutCmd="true" shortcutShift="true" shortcutKey="C" @click="exportSelectedEntities('bibtex')"/>
                        <EntitiesViewContextMenuItem label="Plain Text" shortcutKey="" @click="exportSelectedEntities('plain')"/>
                    </q-list>
                </q-menu>
            </q-item>
        </q-list>
    </q-menu>
</template>

<script lang="ts">
import { useQuasar } from 'quasar';
import {defineComponent, PropType} from 'vue';

import EntitiesViewContextMenuItem from './ContextMenuItem.vue';

import { PaperEntity } from 'src/models/PaperEntity';
import { PaperEntityDraft } from 'src/models/PaperEntityDraft';

export default defineComponent({
  name: 'EntitiesViewContextMenu',

  components: {
    EntitiesViewContextMenuItem,
  },

  props: {
    selectedEntities: {
      type: Array as PropType<PaperEntity[]>,
      required: true,
    }
  },

  setup(props, {emit}) {
    const $q = useQuasar();

    const openSelectedEntities = () => {
      void window.entityInteractor.open(props.selectedEntities[0].mainURL);
    };

    const editSelectedEntities = () => {
      const entityDraft = new PaperEntityDraft()
      entityDraft.initialize(props.selectedEntities[0]);
      window.systemInteractor.setState('sharedData.editEntityDraft', JSON.stringify(entityDraft));
      window.systemInteractor.setState('viewState.isEditViewShown', JSON.stringify(true));
    };

    const scrapeSelectedEntities = () => {
      const entityDrafts = props.selectedEntities.map(
          (entity) => {
            const entityDraft = new PaperEntityDraft()
            entityDraft.initialize(entity);
            return entityDraft;
          },
      );
      void window.entityInteractor.scrape(JSON.stringify(entityDrafts));
    };

    const deleteSelectedEntities = () => {
      $q.dialog({
        title: 'Confirm',
        message: 'Are you sure to delete?',
        cancel: true,
        persistent: true,
      })
        .onOk(() => {
          const ids = props.selectedEntities.map((entity) => entity._id as string);
          window.systemInteractor.setState('selectionState.selectedIndex', JSON.stringify([]));
          void window.entityInteractor.delete(ids);
        })
    };

    const flagSelectedEntities = () => {
      const entityDrafts = props.selectedEntities.map(
          (entity) => {
            const entityDraft = new PaperEntityDraft()
            entityDraft.initialize(props.selectedEntities[0]);
            entityDraft.flag = !entityDraft.flag;
            return entityDraft;
          },
      );
      void window.entityInteractor.update(JSON.stringify(entityDrafts));
    };

    const tagSelectedEntities = () => {
      const entityDraft = new PaperEntityDraft()
      entityDraft.initialize(props.selectedEntities[0]);
      window.systemInteractor.setState('sharedData.editEntityDraft', JSON.stringify(entityDraft));
      window.systemInteractor.setState('viewState.isTagViewShown', JSON.stringify(true));
    };

    const folderSelectedEntities = () => {
      const entityDraft = new PaperEntityDraft()
      entityDraft.initialize(props.selectedEntities[0]);
      window.systemInteractor.setState('sharedData.editEntityDraft', JSON.stringify(entityDraft));
      window.systemInteractor.setState('viewState.isFolderViewShown', JSON.stringify(true));
    };

    const noteSelectedEntities = () => {
      const entityDraft = new PaperEntityDraft()
      entityDraft.initialize(props.selectedEntities[0]);
      window.systemInteractor.setState('sharedData.editEntityDraft', JSON.stringify(entityDraft));
      window.systemInteractor.setState('viewState.isNoteViewShown', JSON.stringify(true));
    };

    const exportSelectedEntities = (format: string) => {
      window.entityInteractor.export(JSON.stringify(props.selectedEntities), format);
    };

    return {
      openSelectedEntities,
      editSelectedEntities,
      scrapeSelectedEntities,
      deleteSelectedEntities,
      flagSelectedEntities,
      tagSelectedEntities,
      folderSelectedEntities,
      noteSelectedEntities,
      exportSelectedEntities,
    };
  },
});
</script>
