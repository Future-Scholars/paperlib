<template>
    <q-menu touch-position context-menu >
        <q-list dense style="min-width: 200px">
            <EntitiesViewContextMenuItem label="Open" shortcut="ENTER" @click="openSelectedEntities" />
            <EntitiesViewContextMenuItem label="Edit" shortcut="CTRL-E" @click="editSelectedEntities" :disable="selectedEntities.length > 1"/>
            <EntitiesViewContextMenuItem label="Scrape" shortcut="CTRL-R" @click="scrapeSelectedEntities"/>
            <EntitiesViewContextMenuItem label="Delete" shortcut="CTRL-Back" @click="deleteSelectedEntities"/>
            <q-separator />
            <EntitiesViewContextMenuItem label="Toggle Flag" shortcut="CTRL-F" @click="flagSelectedEntities"/>
            <EntitiesViewContextMenuItem label="Add Tags" shortcut="CTRL-T" @click="tagSelectedEntities" :disable="selectedEntities.length > 1"/>
            <EntitiesViewContextMenuItem label="Add Folders" shortcut="CTRL-G" @click="folderSelectedEntities" :disable="selectedEntities.length > 1"/>
            <EntitiesViewContextMenuItem label="Add Note" shortcut="CTRL-N" @click="noteSelectedEntities" :disable="selectedEntities.length > 1"/>
            <q-separator />
            <q-item clickable>
                <q-item-section style="font-size: 0.9em">Export</q-item-section>
                <q-item-section side>
                    <q-icon name="bi-chevron-right" style="font-size: 0.9em" />
                </q-item-section>
                <q-menu anchor="top end" self="top start">
                    <q-list dense style="min-width: 150px">
                        <EntitiesViewContextMenuItem label="Bibtex" shortcut="S-CTRL-C" @click="exportSelectedEntities('bibtex')"/>
                        <EntitiesViewContextMenuItem label="Plain Text" shortcut="" @click="exportSelectedEntities('plain')"/>
                    </q-list>
                </q-menu>
            </q-item>
        </q-list>
    </q-menu>
</template>

<style lang="sass">
@import 'src/css/mainview.scss'
</style>

<script>
import { defineComponent } from "vue";

import EntitiesViewContextMenuItem from "src/pages/views/entities_view/components/ContextMenuItem.vue";
import { PaperEntityDraft } from "src/models/PaperEntity";

export default defineComponent({
    name: "EntitiesViewContextMenu",

    components: {
        EntitiesViewContextMenuItem
    },

    props: {
        selectedEntities: Array,
    },

    setup(props, { emit }) {
        const openSelectedEntities = () => {
            window.api.open(getJoinedPath(props.selectedEntities[0].mainURL));
        };

        const editSelectedEntities = () => {
            let entity = props.selectedEntities[0];
            let entityDraft = new PaperEntityDraft(entity)
            window.api.sendSignal("sharedData.editEntityDraft", JSON.stringify(entityDraft));
            window.api.sendSignal("viewState.isEditViewShown", JSON.stringify(true));
        };

        const scrapeSelectedEntities = () => {
            let entityDrafts = props.selectedEntities.map(
                (entity) => {
                    var entityDraft = new PaperEntityDraft(entity)
                    return entityDraft
                }
            );
            window.api.scrape(JSON.stringify(entityDrafts));
        };

        const deleteSelectedEntities = () => {
            let ids = props.selectedEntities.map((entity) => entity._id);
            window.api.sendSignal("selectionState.selectedIndex", JSON.stringify([]));
            window.api.delete(ids);
        };

        const flagSelectedEntities = () => {
            let entityDrafts = props.selectedEntities.map(
                (entity) => {
                    var entityDraft = new PaperEntityDraft(entity)
                    entityDraft.flag = !entityDraft.flag;
                    return entityDraft
                }
            );
            window.api.update(JSON.stringify(entityDrafts));
        };

        const tagSelectedEntities = () => {
            let entity = props.selectedEntities[0];
            let entityDraft = new PaperEntityDraft(entity)
            window.api.sendSignal("sharedData.editEntityDraft", JSON.stringify(entityDraft));
            window.api.sendSignal("viewState.isTagViewShown", JSON.stringify(true));
        };

        const folderSelectedEntities = () => {
            let entity = props.selectedEntities[0];
            let entityDraft = new PaperEntityDraft(entity)
            window.api.sendSignal("sharedData.editEntityDraft", JSON.stringify(entityDraft));
            window.api.sendSignal("viewState.isFolderViewShown", JSON.stringify(true));
        };

        const noteSelectedEntities = () => {
            let entity = props.selectedEntities[0];
            let entityDraft = new PaperEntityDraft(entity)
            window.api.sendSignal("sharedData.editEntityDraft", JSON.stringify(entityDraft));
            window.api.sendSignal("viewState.isNoteViewShown", JSON.stringify(true));
        };

        const exportSelectedEntities = (form) => {
            // TODO: export to file
        };

        const getJoinedPath = (url) => {
            return window.api.getJoinedPath(url, true);
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
        }
    },
});
</script>
