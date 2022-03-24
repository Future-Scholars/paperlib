<template>
  <q-table
      dense
      hide-bottom
      virtual-scroll
      class="no-shadow full-height"
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
                      ? 'table-row-active'
                      : ''
              "
          >
              {{ props.value }}
          </q-td>
          <EntitiesViewContextMenu :selectedEntities="selectedEntities" />
      </template>
  </q-table>
</template>

<script lang="ts">
import {defineComponent, PropType, Ref, ref, toRefs} from 'vue';
// @ts-ignore
import dragDrop from 'drag-drop';

import EntitiesViewContextMenu from './ContextMenu.vue';

import { PaperEntity } from 'src/models/PaperEntity';

export default defineComponent({
  name: 'EntitiesTableView',

  components: {
    EntitiesViewContextMenu,
  },

  props: {
    entities: Array as PropType<PaperEntity[]>,
    selectedEntities: Array as PropType<PaperEntity[]>,
  },
  setup(props) {
    const columns = [
      {
        name: 'Title',
        label: 'Title',
        required: true,
        align: 'left',
        field: 'title',
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
        format: (val: boolean) => `${val ? '\u2691' : ''}`,
        style: 'max-width: 35px; font-size: 1.2em !important; padding: 0 !important;',
        headerStyle: 'max-width: 35px;',
      },
    ];

    const selectedIndex: Ref<number[]> = ref([]);
    const selectedLastSingleIndex = ref(-1);

    const onRowClicked = (event: { shiftKey: boolean; ctrlKey: boolean; }, row: PaperEntity, index: number) => {
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
      window.systemInteractor.setState('selectionState.selectedIndex', JSON.stringify(selectedIndex.value));
    };

    const onRowDblClicked = (event: { shiftKey: boolean; ctrlKey: boolean; }, row: PaperEntity, index: number) => {
      onRowClicked(event, row, index);
      void window.entityInteractor.open(row.mainURL);
    };

    const onRowRightClicked = (event: { shiftKey: boolean; ctrlKey: boolean; }, row: PaperEntity, index: number) => {
      if (selectedIndex.value.indexOf(index) === -1) {
        onRowClicked(event, row, index);
      }
    };

    const registerDropHandler = () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      dragDrop('#data-box', {
        // @ts-ignore
        onDrop: async (files, pos, fileList, directories) => {
          const filePaths: string[] = [];
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          files.forEach((file) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            filePaths.push(`file://${file.path as string}`);
          });
          await window.entityInteractor.add(filePaths);
        },
      });
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
