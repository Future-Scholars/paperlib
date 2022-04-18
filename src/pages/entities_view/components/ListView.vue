<template>
  <q-virtual-scroll
      class="no-shadow full-height list-view"
      :items="entities"
    >
      <template v-slot="{ item, index }">
        <q-item
          :key="index"
          clickable
          class="q-pl-sm q-pr-sm q-mr-sm radius-border list-item"
          active-class="list-item-active"
          :active="selectedIndex.indexOf(index) >= 0"
          @click="onRowClicked($event, item, index)"
          @dblclick="onRowDblClicked($event, item, index)"
          @contextmenu="onRowRightClicked($event, item, index)"
        >
          <q-item-section>
            <div class="row">
              <span class="col-auto">
                {{ item.title }} 
              </span>
            </div>
            <div class="row">
              <span class="col-auto">
                {{ item.authors }}
              </span>
            </div>
            <div class="row">
              <span class="col-auto">
                {{ item.pubTime }} &nbsp;&nbsp;
              </span>
              <span class="col-auto text-italic">
                |&nbsp;&nbsp; {{ item.publication }} &nbsp;&nbsp;
              </span>
              <span class="col-auto text-italic" v-if="item.flag">
                |&nbsp;&nbsp; <q-icon name="bi-flag-fill" />
              </span>
            </div>
          </q-item-section>
          <EntitiesViewContextMenu :selectedEntities="selectedEntities" />
        </q-item>
      </template>
    </q-virtual-scroll>
</template>

<script lang="ts">
import {defineComponent, PropType, Ref, ref, toRefs} from 'vue';
// @ts-ignore
import dragDrop from 'drag-drop';

import EntitiesViewContextMenu from './ContextMenu.vue';

import { PaperEntity } from 'src/models/PaperEntity';

export default defineComponent({
  name: 'EntitiesListView',

  components: {
    EntitiesViewContextMenu,
  },

  props: {
    entities: Array as PropType<PaperEntity[]>,
    selectedEntities: Array as PropType<PaperEntity[]>,
  },
  setup(props) {
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

    window.systemInteractor.registerState('selectionState.selectedIndex', (_event, message) => {
      const newSelectedIndex = JSON.parse(message as string) as number[];
      if (newSelectedIndex.length === 0) {
        selectedIndex.value = [];
      }
    });

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
