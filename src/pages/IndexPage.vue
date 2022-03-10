<template>
    <q-page class="flex flex-center">
        <!-- Sidebar -->
        <SidebarView :selectedCategorizer="selectedCategorizer" :tags="tags" :folders="folders" :showSidebarCount="showSidebarCount"/>
        <!-- Content -->
        <div ref="mainview" class="mainview absolute-full">
            <!-- Menu Bar -->
            <ToolbarView :selectedEntities="selectedEntities" :sortBy="sortBy" :sortOrder="sortOrder" :searchText="searchText" />

            <!-- Main View -->
            <div
                class="row no-wrap justify-start items-start content-start"
                style="height: calc(100% - 50px) !important"
            >
                <EntitiesView
                    :entities="entities"
                    :selectedEntities="selectedEntities"
                />

                <DetailView
                    :entity="selectedEntities[0]"
                    v-if="selectedEntities.length > 0"
                />
            </div>
        </div>

        <!-- Edit Window -->
        <EditView />
        <!-- Tag Add Window -->
        <TagEditView :tags="tags" />
        <!-- Folder Add Window -->
        <FolderEditView :folders="folders" />
        <!-- Note Add Window -->
        <NoteEditView />

        <!-- Setting Window -->
        <PreferenceView :preference="preference" />
    </q-page>
</template>

<style lang="sass">
@import './src/css/global.scss'
@import './src/css/sidebar.scss'
@import './src/css/mainview.scss'
@import './src/css/detailview.scss'
@import './src/css/settingview.scss'
</style>

<script>
import {ref, onMounted} from 'vue';
import {useQuasar} from 'quasar';

import SidebarView from 'src/pages/views/sidebar_view/SidebarView.vue';
import EntitiesView from 'src/pages/views/entities_view/EntitiesView.vue';
import DetailView from 'src/pages/views/detail_view/DetailView.vue';
import ToolbarView from 'src/pages/views/toolbar_view/ToolbarView.vue';
import EditView from 'src/pages/views/edit_view/EditView.vue';
import TagEditView from 'src/pages/views/edit_view/TagEditView.vue';
import FolderEditView from 'src/pages/views/edit_view/FolderEditView.vue';
import NoteEditView from 'src/pages/views/edit_view/NoteEditView.vue';
import PreferenceView from 'src/pages/views/preference_view/PreferenceView.vue';

export default {
  components: {
    SidebarView,
    EntitiesView,
    DetailView,
    ToolbarView,
    EditView,
    TagEditView,
    FolderEditView,
    NoteEditView,
    PreferenceView,
  },

  setup() {
    const $q = useQuasar();

    const sortBy = ref('addTime');
    const sortOrder = ref('desc');

    const entities = ref([]);
    const tags = ref([]);
    const folders = ref([]);

    const searchText = ref('');
    const selectedCategorizer = ref('lib-all');
    const selectedIndex = ref([]);
    const selectedEntities = ref([]);

    const preference = ref({});
    const showSidebarCount = ref(false);
    const version = ref('-1');

    // =======================================
    // Register signal
    window.api.registerSignal('selectionState.selectedCategorizer', (event, message) => {
      selectedCategorizer.value = JSON.parse(message);
      clearSelected();
      reloadEntities();
    });

    window.api.registerSignal('selectionState.selectedIndex', (event, message) => {
      selectedIndex.value = JSON.parse(message);
      reloadSelectedEntities();
    });

    window.api.registerSignal('viewState.sortBy', (event, message) => {
      sortBy.value = JSON.parse(message);
      clearSelected();
      reloadEntities();
    });

    window.api.registerSignal('viewState.sortOrder', (event, message) => {
      sortOrder.value = JSON.parse(message);
      clearSelected();
      reloadEntities();
    });

    window.api.registerSignal('viewState.searchText', (event, message) => {
      searchText.value = JSON.parse(message);
      clearSelected();
      reloadEntities();
    });

    window.api.registerSignal('viewState.preferenceUpdated', (event, message) => {
      reloadPreference();
    });

    window.api.registerSignal('dbState.entitiesUpdated', (event, message) => {
      reloadEntities();
    });

    window.api.registerSignal('dbState.tagsUpdated', (event, message) => {
      reloadTags();
    });

    window.api.registerSignal('dbState.foldersUpdated', (event, message) => {
      reloadFolders();
    });

    window.api.registerSignal('pluginURL', async (event, message) => {
      console.log(message);
      await window.api.add([message]);
    });

    window.api.registerSignal('viewState.realmReinited', async (event, message) => {
      clearSelected();
      await reloadEntities();
      await reloadTags();
      await reloadFolders();
    });

    window.api.registerSignal('viewState.alertInformation', async (event, message) => {
      $q.notify(message);
    });

    // =======================================
    // Data
    const reloadEntities = async () => {
      let flaged = null;
      let tag = null;
      let folder = null;
      if (selectedCategorizer.value.startsWith('tag-')) {
        tag = selectedCategorizer.value.replace('tag-', '');
      } else if (selectedCategorizer.value.startsWith('folder-')) {
        folder = selectedCategorizer.value.replace('folder-', '');
      } else if (selectedCategorizer.value === 'lib-flaged') {
        flaged = true;
      }

      const results = await window.api.load(
          searchText.value,
          flaged,
          tag,
          folder,
          sortBy.value,
          sortOrder.value,
      );
      entities.value = results;
      reloadSelectedEntities();
    };

    const reloadTags = async () => {
      const results = await window.api.loadTags();
      tags.value = results;
    };

    const reloadFolders = async () => {
      const results = await window.api.loadFolders();
      folders.value = results;
    };

    const reloadSelectedEntities = () => {
      selectedEntities.value = [];
      selectedIndex.value.forEach((index) => {
        selectedEntities.value.push(entities.value[index]);
      });
    };

    const clearSelected = () => {
      selectedIndex.value = [];
      selectedEntities.value = [];
    };

    // Settings
    const reloadPreference = () => {
      preference.value = window.api.loadPreferences();
      showSidebarCount.value = preference.value.showSidebarCount;
    };

    onMounted(async () => {
      reloadPreference();
      await reloadEntities();
      await reloadTags();
      await reloadFolders();
      window.api.setRoutineTimer();
    });

    return {
      version,

      sortBy,
      sortOrder,

      entities,
      tags,
      folders,

      searchText,
      selectedCategorizer,
      selectedEntities,

      preference,
      showSidebarCount,

      reloadEntities,
      reloadSelectedEntities,
      clearSelected,

      reloadPreference,
    };
  },
};
</script>
