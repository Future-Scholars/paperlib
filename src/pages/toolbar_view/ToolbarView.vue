<template>
    <q-bar class="no-shadow menubar q-pl-md">
        <q-icon :name="searchIcon" class="search-bar-icon q-mr-sm" style="cursor: pointer" @click="onSearchIconClicked">
          <q-tooltip v-if="searchMode === 'advanced'">
            Operators:            ==, &lt;, &gt;, &lt;=, &gt;=, !=, in, contains, and, or <br/>

Queryable fields:  title, authors, publication, pubTime, rating, note <br/>
Examples: <br/>
1) Query the paper whos title are 'Test title': <br/>
&nbsp;&nbsp;&nbsp; title == 'Test title' <br/>
2) Query the paper whos title contains 'Test title': <br/>
&nbsp;&nbsp;&nbsp; title contains 'Test title' <br/>
3) Query the paper whos publication year are 2008: <br/>
&nbsp;&nbsp;&nbsp; pubTime == '2008' <br/>
4) Query the paper whos rating are > 3: <br/>
&nbsp;&nbsp;&nbsp; rating > 3 <br/>
          </q-tooltip>
        </q-icon>
        <q-input
            borderless
            dense
            class="search-bar"
            :placeholder="searchPlaceholder"
            :debounce="searchDebounce"
            v-model="searchText"
            @update:model-value="onSearchTextChanged"
        >
        </q-input>
        <q-space />
        <div class="q-electron-drag menubar-drag-box" />
        <q-space />
        <ToolbarButton icon="bi-arrow-counterclockwise" tooltip="Scrape Metadata" @click="scrapeSelectedEntities" :disable="selectedEntities.length < 1" />
        <ToolbarButton icon="bi-trash" tooltip="Delete" @click="deleteSelectedEntities" :disable="selectedEntities.length < 1" />
        <ToolbarButton icon="bi-pencil-square" tooltip="Edit" @click="editSelectedEntities" :disable="selectedEntities.length !== 1" />
        <ToolbarButton icon="bi-flag" tooltip="Flag" @click="flagSelectedEntities" :disable="selectedEntities.length < 1" />
        <ToolbarButton icon="bi-tags" tooltip="Add Tag" @click="tagSelectedEntities" :disable="selectedEntities.length !== 1" />
        <ToolbarButton icon="bi-folder-plus" tooltip="Add to Folder" @click="folderSelectedEntities" :disable="selectedEntities.length !== 1" />
        <ToolbarButton icon="bi-card-text" tooltip="Add Note" @click="noteSelectedEntities" :disable="selectedEntities.length !== 1" />
        <q-btn-group outline>
          <ToolbarButton icon="bi-list-ul" tooltip="List View" @click="onChangeViewType('list')" :disable="false" />
          <ToolbarButton icon="bi-grid-3x2" tooltip="Table View" @click="onChangeViewType('table')" :disable="false" />
        </q-btn-group>
        <SortMenu :sortBy="sortBy" :sortOrder="sortOrder" @sort-by-changed="onSortByChanged" @sort-order-changed="onSortOrderChanged" />
        <ToolbarButton icon="bi-gear" tooltip="Preference" @click="openPreference" />

    </q-bar>

</template>

<script lang="ts">
import { useQuasar } from 'quasar';
import Mousetrap from 'mousetrap';
import {defineComponent, PropType, toRefs, ref} from 'vue';

import ToolbarButton from './components/ToolbarButton.vue';
import SortMenu from './components/SortMenu.vue';

import { PaperEntity } from 'src/models/PaperEntity';
import { PaperEntityDraft } from 'src/models/PaperEntityDraft';

export default defineComponent({
  name: 'ToolbarView',

  components: {
    ToolbarButton,
    SortMenu,
  },

  props: {
    selectedEntities: {
      type: Array as PropType<PaperEntity[]>,
      required: true,
    },
    sortBy: {
      type: String,
      required: true,
    },
    sortOrder: {
      type: String,
      required: true,
    }
  },

  setup(props, {emit}) {
    const $q = useQuasar();
    const searchText = ref('');
    const searchIcon = ref('bi-search');
    const searchPlaceholder = ref('Search...');
    const searchMode = ref('general');
    const searchDebounce = ref(300);
    const searchHelp = ref(`
Operators:            ==, <, >, <=, >=, !=, in, contains, and, or <br/>

Queryable fields:  title, authors, publication, pubTime, rating, note <br/>
Examples: <br/>
1) Query the paper whos title are 'Test title': <br/>
     title == 'Test title' <br/>
2) Query the paper whos title contains 'Test title': <br/>
     title contains 'Test title' <br/>
3) Query the paper whos publication year are 2008: <br/>
     pubTime == '2008' <br/>
4) Query the paper whos rating are > 3: <br/>
     rating > 3 <br/>
`);

    const onSearchTextChanged = (searchText: string) => {
      window.systemInteractor.setState('viewState.searchText', JSON.stringify(searchText));
    };

    const onSearchIconClicked = () => {
      searchText.value = '';
      window.systemInteractor.setState('viewState.searchText', JSON.stringify(searchText.value));

      if (searchMode.value === 'general'){
        window.systemInteractor.setState('viewState.searchMode', 'fulltext');
        searchIcon.value = 'bi-blockquote-left';
        searchPlaceholder.value = 'Fulltext Search...';
        searchDebounce.value = 300;
      } else if (searchMode.value === 'fulltext'){
        window.systemInteractor.setState('viewState.searchMode', 'advanced');
        searchIcon.value = 'bi-code';
        searchPlaceholder.value = 'Advanced Search...';
        searchDebounce.value = 1000;
      } else if (searchMode.value === 'advanced'){
        window.systemInteractor.setState('viewState.searchMode', 'general');
        searchIcon.value = 'bi-search';
        searchPlaceholder.value = 'Search...';
        searchDebounce.value = 300;
      }
    };

    window.systemInteractor.registerState('viewState.searchMode', (_event, message) => {
      searchMode.value = message as string;
    });

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
            entityDraft.initialize(entity);
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

    const openPreference = () => {
      window.systemInteractor.setState('viewState.isPreferenceViewShown', JSON.stringify(true));
    };

    const onSortByChanged = (sortBy: string) => {
      window.systemInteractor.setState('viewState.sortBy', JSON.stringify(sortBy));
    };

    const onSortOrderChanged = (sortOrder: string) => {
      window.systemInteractor.setState('viewState.sortOrder', JSON.stringify(sortOrder));
    };

    const exportSelectedEntities = (format: string) => {
      window.entityInteractor.export(JSON.stringify(props.selectedEntities), format);
    };

    const onChangeViewType = (viewType: string) => {
      window.systemInteractor.setState('viewState.viewType', JSON.stringify(viewType));
    };

    const bindShortcut = () => {
      Mousetrap.bind('enter', function() {
        if (props.selectedEntities.length == 1) {
          void window.entityInteractor.open(props.selectedEntities[0].mainURL);
        }
      });
      Mousetrap.bind('ctrl+shift+c', function() {
        exportSelectedEntities('bibtex');
      });
      Mousetrap.bind('ctrl+e', function() {
        if (props.selectedEntities.length == 1) {
          editSelectedEntities();
        }
      });
      Mousetrap.bind('ctrl+f', function() {
        flagSelectedEntities();
      });
      Mousetrap.bind('ctrl+t', function() {
        if (props.selectedEntities.length == 1) {
          tagSelectedEntities();
        }
      });
      Mousetrap.bind('ctrl+g', function() {
        if (props.selectedEntities.length == 1) {
          folderSelectedEntities();
        }
      });
      Mousetrap.bind('ctrl+r', function() {
        scrapeSelectedEntities();
      });
      Mousetrap.bind('ctrl+n', function() {
        if (props.selectedEntities.length == 1) {
          noteSelectedEntities();
        }
      });
    };

    return {
      searchText,
      searchIcon,
      searchPlaceholder,
      searchMode,
      searchDebounce,
      searchHelp,

      onSearchIconClicked,
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
      onChangeViewType,
      bindShortcut,
      ...toRefs(props),
    };
  },
  mounted() {
    this.bindShortcut();
  },

});
</script>
