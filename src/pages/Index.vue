<template>
  <q-page class="flex flex-center">
    <!-- Sidebar -->
    <SidebarView :selectedCategorizer="selectedCategorizer" :tags="tags" :folders="folders" :showSidebarCount="showSidebarCount"/>
    <div ref="mainview" class="mainview absolute-full bg-bgprimary">
      <!-- Menu Bar -->
      <ToolbarView :selectedEntities="selectedEntities" :sortBy="sortBy" :sortOrder="sortOrder"/>
      <!-- Main View -->
      <div
        class="row no-wrap justify-start items-start content-start"
        style="height: calc(100% - 50px) !important"
      >
        <EntitiesView :entities="entities" :selectedEntities="selectedEntities" />
        <DetailView :entity="selectedEntities[0] ? selectedEntities[0] : paperEntityPlaceholder" v-show="selectedEntities.length > 0" />
      </div>

      <!-- Edit Window -->
      <EditView />
      <!-- Categorizer Add Window -->
      <CategorizerEditView :tags="tags" :folders="folders"/>
      <!-- Note Add Window -->
      <NoteEditView />

      <!-- Preference Window -->
      <PreferenceView :preference="preference" />

    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, onMounted, Ref, ref, watch } from 'vue';
import { useQuasar } from 'quasar';

import SidebarView from './sidebar_view/SidebarView.vue';
import ToolbarView from './toolbar_view/ToolbarView.vue';
import EntitiesView from './entities_view/EntitiesView.vue';
import DetailView from './detail_view/DetailView.vue';
import EditView from './edit_view/EditView.vue';
import CategorizerEditView from './edit_view/CategorizerEditView.vue';
import NoteEditView from './edit_view/NoteEditView.vue';
import PreferenceView from './preference_view/PreferenceView.vue';

import { PaperCategorizer } from 'src/models/PaperCategorizer';
import { PaperEntity, PaperEntityPlaceholder } from 'src/models/PaperEntity';
import { PreferenceType } from 'src/utils/preference';



export default defineComponent({
  name: 'PageIndex',
  components: { SidebarView, ToolbarView, EntitiesView, DetailView, EditView, CategorizerEditView, NoteEditView, PreferenceView },
  setup() {
    const version = ref('-1');
    const $q = useQuasar();
    const paperEntityPlaceholder = ref(PaperEntityPlaceholder)

    const sortBy = ref('addTime');
    const sortOrder = ref('desc');

    const entities: Ref<PaperEntity[]> = ref([]);
    const tags: Ref<PaperCategorizer[]> = ref([]);
    const folders: Ref<PaperCategorizer[]> = ref([]);

    const searchText = ref('');
    const selectedCategorizer = ref('lib-all');
    const selectedIndex: Ref<number[]> = ref([]);
    const selectedEntities: Ref<PaperEntity[]> = ref([]);

    const preference: Ref<PreferenceType> = ref(window.systemInteractor.loadPreferences());
    const showSidebarCount = ref(false);

    // =======================================
    // Data
    const reloadEntities = async () => {
      let flaged = false;
      let tag = '';
      let folder = '';
      if (selectedCategorizer.value.startsWith('tag-')) {
        tag = selectedCategorizer.value.replace('tag-', '');
      } else if (selectedCategorizer.value.startsWith('folder-')) {
        folder = selectedCategorizer.value.replace('folder-', '');
      } else if (selectedCategorizer.value === 'lib-flaged') {
        flaged = true;
      }

      const results = await window.entityInteractor.load(
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
      const results = await window.entityInteractor.loadCategorizers('PaperTag');
      tags.value = results;
    };

    const reloadFolders = async () => {
      const results = await window.entityInteractor.loadCategorizers('PaperFolder');
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
      window.systemInteractor.setState('selectionState.selectedIndex', JSON.stringify(selectedIndex.value));
    };

    // =======================================
    // Preferences
    const reloadPreference = () => {
      preference.value = window.systemInteractor.loadPreferences();
      showSidebarCount.value = preference.value.showSidebarCount;
    };

    // =======================================
    // Register state change
    window.systemInteractor.registerState('selectionState.selectedCategorizer', (_event, message) => {
      selectedCategorizer.value = JSON.parse(message as string) as string;
      clearSelected();
      void reloadEntities();
    });

    window.systemInteractor.registerState('selectionState.selectedIndex', (_event, message) => {
      selectedIndex.value = JSON.parse(message as string) as number[];
      reloadSelectedEntities();
    });

    window.systemInteractor.registerState('viewState.sortBy', (_event, message) => {
      sortBy.value = JSON.parse(message as string) as string;
      clearSelected();
      void reloadEntities();
    });

    window.systemInteractor.registerState('viewState.sortOrder', (_event, message) => {
      sortOrder.value = JSON.parse(message as string) as string;
      clearSelected();
      void reloadEntities();
    });

    window.systemInteractor.registerState('viewState.searchText', (_event, message) => {
      searchText.value = JSON.parse(message as string) as string;
      clearSelected();
      void reloadEntities();
    });

    window.systemInteractor.registerState('viewState.preferenceUpdated', (_event, _message) => {
      reloadPreference();
    });

    window.systemInteractor.registerState('dbState.entitiesUpdated', (_event, _message) => {
      void reloadEntities();
    });

    window.systemInteractor.registerState('dbState.tagsUpdated', (_event, _message) => {
      void reloadTags();
    });

    window.systemInteractor.registerState('dbState.foldersUpdated', (_event, _message) => {
      void reloadFolders();
    });

    window.systemInteractor.registerSignal('pluginURL', (_event, message) => {
      void window.entityInteractor.addFromPlugin([message as string]);
    });

    window.systemInteractor.registerSignal('window-lost-focus', (_event, _message) => {
      void window.entityInteractor.pauseSync();
    });

    window.systemInteractor.registerSignal('window-gained-focus', (_event, _message) => {
      void window.entityInteractor.resumeSync();
    });

    window.systemInteractor.registerState('viewState.realmReinited', (_event, _message) => {
      void (async () => {
        await reloadEntities();
        await reloadTags();
        await reloadFolders();
        reloadPreference();
      })(); 
    });

    window.systemInteractor.registerState('viewState.alertInformation', (_event, message) => {
      $q.notify({
        message: message as string
      });
    });

    window.systemInteractor.registerState('viewState.themeUpdated', (_event, message) => {
      reloadTheme();
    });

    window.systemInteractor.registerSignal('preferenceShortcutClicked', (_event, _message) => {
      window.systemInteractor.setState('viewState.isPreferenceViewShown', JSON.stringify(true));
    });

    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', function (e) {
        reloadTheme();
      });

    const reloadTheme = () => {
      let matches = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = matches ? 'dark' : 'light';
      window.systemInteractor.setTheme(theme);
    }

    window.systemInteractor.registerSignal('log', (_event, message) => {
      console.log(message);
    });

    onMounted(async () => {
      reloadPreference();
      reloadTheme();
      await reloadTags();
      await reloadFolders();
      await reloadEntities();
    });

    return {       
      version,
      paperEntityPlaceholder,

      sortBy,
      sortOrder,

      entities,
      tags,
      folders,

      searchText,
      selectedCategorizer,
      selectedEntities,

      preference,
      showSidebarCount
    };
  },
});
</script>
