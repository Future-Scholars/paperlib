<template>
    <q-bar class="no-shadow menubar">
        <q-input
            borderless
            dense
            class="search-input"
            placeholder="Search"
            debounce="300"
            v-model="searchText"
            @update:model-value="onSearchTextChanged"
        >
            <template v-slot:prepend>
                <q-icon size="xs" name="search" />
            </template>
        </q-input>
        <q-space />
        <div class="q-electron-drag menubar-drag-box" />
        <q-space />
        <ToolbarButton icon="bi-search" @click="scrapeSelectedEntities" :disable="selectedEntities.length < 1" />
        <ToolbarButton icon="bi-trash" @click="deleteSelectedEntities" :disable="selectedEntities.length < 1" />
        <ToolbarButton icon="bi-pencil-square" @click="editSelectedEntities" :disable="selectedEntities.length !== 1" />
        <ToolbarButton icon="bi-flag" @click="flagSelectedEntities" :disable="selectedEntities.length < 1" />
        <ToolbarButton icon="bi-tag" @click="tagSelectedEntities" :disable="selectedEntities.length !== 1" />
        <ToolbarButton icon="bi-folder-plus" @click="folderSelectedEntities" :disable="selectedEntities.length !== 1" />
        <ToolbarButton icon="bi-card-text" @click="noteSelectedEntities" :disable="selectedEntities.length !== 1" />
        <SortMenu :sortBy="sortBy" :sortOrder="sortOrder" @sort-by-changed="onSortByChanged" @sort-order-changed="onSortOrderChanged" />
        <ToolbarButton icon="bi-gear" @click="openPreference" />
     
    </q-bar>

</template>

<style lang="sass">
@import 'src/css/mainview.scss'
</style>

<script>
import { defineComponent, toRefs } from "vue";

import ToolbarButton from "src/pages/views/toolbar_view/components/ToolbarButton.vue";
import SortMenu from "src/pages/views/toolbar_view/components/SortMenu.vue";

import { PaperEntityDraft } from "src/models/PaperEntity";
import Mousetrap from "mousetrap";


export default defineComponent({
    name: "ToolbarView",

    components: {
        ToolbarButton,
        SortMenu,
    },

    props: {
        selectedEntities: Array,
        sortBy: String,
        sortOrder: String,
        searchText: String,
    },

    setup(props, { emit }) {

        const editSelectedEntities = () => {
            let entity = props.selectedEntities[0];
            let entityDraft = new PaperEntityDraft(entity)
            window.api.sendSignal("sharedData.editEntityDraft", JSON.stringify(entityDraft));
            window.api.sendSignal("viewState.isEditViewShown", JSON.stringify(true));
        };

        const scrapeSelectedEntities = () => {
            let entity = props.selectedEntities[0];
            let entityDraft = new PaperEntityDraft(entity)
            window.api.match(entityDraft);
        };

        const deleteSelectedEntities = () => {
            let ids = props.selectedEntities.map((entity) => entity._id);
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

        const openPreference = () => {
            window.api.sendSignal("viewState.isPreferenceViewShown", JSON.stringify(true));
        };

        const onSortByChanged = (sortBy) => {
            window.api.sendSignal("viewState.sortBy", JSON.stringify(sortBy));
        };

        const onSortOrderChanged = (sortOrder) => {
            window.api.sendSignal("viewState.sortOrder", JSON.stringify(sortOrder));
        };

        const onSearchTextChanged = (searchText) => {
            window.api.sendSignal("viewState.searchText", JSON.stringify(searchText));
        };

        const bindShortcut = () => {
            Mousetrap.bind("enter", function () {
                if (selectedEntities.value.length == 1) {
                    window.api.open(window.api.getJoinedPath(selectedEntities.value[0].mainURL, true));
                }
            });
            Mousetrap.bind("ctrl+shift+c", function () {
                exportEntities("bibtex");
            });
            Mousetrap.bind("ctrl+e", function () {
                if (selectedEntities.value.length == 1) {
                    editSelectedEntities();
                }
            });
            Mousetrap.bind("ctrl+f", function () {
                flagSelectedEntities()
            });
            Mousetrap.bind("ctrl+t", function () {
                if (selectedEntities.value.length == 1) {
                    tagSelectedEntities();
                }
            });
            Mousetrap.bind("ctrl+g", function () {
                if (selectedEntities.value.length == 1) {
                    folderSelectedEntities();
                }
            });
            Mousetrap.bind("ctrl+r", function () {
                scrapeSelectedEntities();
            });
            Mousetrap.bind("ctrl+n", function () {
                if (selectedEntities.value.length == 1) {
                    noteSelectedEntities();
                }
            });
        };

        return {
            editSelectedEntities,
            scrapeSelectedEntities,
            deleteSelectedEntities,
            flagSelectedEntities,
            tagSelectedEntities,
            folderSelectedEntities,
            noteSelectedEntities,
            openPreference,
            onSortByChanged,
            onSortOrderChanged,
            onSearchTextChanged,
            bindShortcut,
            ...toRefs(props),
        }
    },
    mounted() {
        this.bindShortcut();
    },

});
</script>
