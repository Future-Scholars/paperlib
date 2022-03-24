<template>
    <div class="col-grow full-height data-box" v-if="viewType === 'table'">
       <EntitiesTableView id="data-box" :entities="entities" :selectedEntities="selectedEntities" />
    </div>
    <div class="col full-height data-box" v-if="viewType === 'list'">
       <EntitiesListView id="data-box" :entities="entities" :selectedEntities="selectedEntities" />
    </div>
</template>

<script lang="ts">
import {defineComponent, PropType, toRefs, ref} from 'vue';

import EntitiesTableView from './components/TableView.vue'
import EntitiesListView from './components/ListView.vue'
import { PaperEntity } from 'src/models/PaperEntity';

export default defineComponent({
  name: 'EntitiesView',

  components: {
    EntitiesTableView,
    EntitiesListView
  },

  props: {
    entities: Array as PropType<PaperEntity[]>,
    selectedEntities: Array as PropType<PaperEntity[]>,
  },
  setup(props) {
    const viewType = ref('list');
    
    window.systemInteractor.registerState('viewState.viewType', (_event, message) => {
      viewType.value = JSON.parse(message as string) as string;
    });

    return {
      viewType,
      ...toRefs(props),
    };
  },
});
</script>
