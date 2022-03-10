<template>
    <div id="data-box" class="col-grow full-height table-box">
        <q-table
            dense
            hide-bottom
            virtual-scroll
            class="no-shadow full-height"
            style="height: 100%"
            table-class="data-table"
            :rows="entities"
            :columns="columns"
            :row-key="(row) => row.title + row.authors"
            :rows-per-page-options="[0]"
            separator="none"
            @row-click="onRowClicked"
            @row-dblclick="onRowDblClicked"
            @row-contextmenu="onRowRightClicked"
        >
            <template v-slot:body-cell="props">
                <q-td
                    :props="props"
                    :class="
                        selectedEntities.map((entity) => entity._id).indexOf(props.row._id) >= 0
                            ? 'bg-secondary'
                            : ''
                    "
                >
                    {{ props.value }}
                </q-td>
                <EntitiesViewContextMenu :selectedEntities="selectedEntities" />
            </template>
        </q-table>
    </div>
</template>

<style lang="sass">
@import 'src/css/mainview.scss'
</style>

<script>
import {defineComponent, ref, toRefs} from 'vue';
import dragDrop from 'drag-drop';

import EntitiesViewContextMenu from 'src/pages/views/entities_view/components/ContextMenu.vue';

export default defineComponent({
  name: 'EntitiesView',

  components: {
    EntitiesViewContextMenu,
  },

  props: {
    entities: Array,
    selectedEntities: Array,
  },
  setup(props) {
    const columns = [
      {
        name: 'Title',
        label: 'Title',
        required: true,
        align: 'left',
        field: (row) => row.title,
        format: (val) => `${val}`,
        classes: 'ellipsis-cell',
        style: 'max-width: 300px;',
        headerStyle: 'max-width: 300px;',
      },
      {
        name: 'Authors',
        label: 'Authors',
        align: 'left',
        field: 'authors',
        classes: 'ellipsis-cell',
        style: 'max-width: 130px;',
        headerStyle: 'max-width: 150px;',
      },
      {
        name: 'Publication',
        label: 'Publication',
        align: 'left',
        field: 'publication',
        classes: 'ellipsis-cell',
        style: 'max-width: 200px;',
        headerStyle: 'max-width: 200px;',
      },
      {
        name: 'Year',
        label: 'Year',
        align: 'left',
        field: 'pubTime',
        classes: 'ellipsis-cell',
        style: 'max-width: 40px;',
        headerStyle: 'max-width: 40px;',
      },
      {
        name: 'Flag',
        label: 'Flag',
        align: 'center',
        field: 'flag',
        format: (val) => `${val ? '\u2691' : ''}`,
        style: 'max-width: 35px; font-size: 1.2em !important; padding: 0 !important;',
        headerStyle: 'max-width: 35px;',
      },
    ];

    const selectedIndex = ref([]);
    const selectedLastSingleIndex = ref(-1);

    const onRowClicked = (event, row, index) => {
      if (event.shiftKey) {
        const minIndex = Math.min(selectedLastSingleIndex.value, index);
        const maxIndex = Math.max(selectedLastSingleIndex.value, index);
        selectedIndex.value = [];
        for (let i = minIndex; i <= maxIndex; i++) {
          selectedIndex.value.push(i);
        }
      } else if (event.ctrlKey) {
        if (selectedIndex.value.indexOf(index) >= 0) {
          selectedIndex.value.splice(
              selectedIndex.value.indexOf(index),
              1,
          );
        } else {
          selectedIndex.value.push(index);
        }
      } else {
        selectedIndex.value = [index];
        selectedLastSingleIndex.value = index;
      }
      window.api.sendSignal('selectionState.selectedIndex', JSON.stringify(selectedIndex.value));
    };

    const onRowDblClicked = (event, row, index) => {
      onRowClicked(event, row, index);
      window.api.open(getJoinedPath(row.mainURL));
    };

    const onRowRightClicked = (event, row, index) => {
      if (selectedIndex.value.indexOf(index) === -1) {
        onRowClicked(event, row, index);
      }
    };

    const registerDropHandler = () => {
      dragDrop('#data-box', {
        onDrop: async (files, pos, fileList, directories) => {
          const filePaths = [];
          files.forEach((file) => {
            filePaths.push(file.path);
          });
          await window.api.add(filePaths);
        },
      });
    };

    const getJoinedPath = (url) => {
      return window.api.getJoinedPath(url, true);
    };

    return {
      columns,

      selectedIndex,
      selectedLastSingleIndex,

      onRowClicked,
      onRowDblClicked,
      onRowRightClicked,
      registerDropHandler,

      ...toRefs(props),
    };
  },
  mounted() {
    this.registerDropHandler();
  },
});
</script>
