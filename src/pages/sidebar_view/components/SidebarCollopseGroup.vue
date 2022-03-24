<template>
  <div>
    <q-item clickable class="sidebar-list-title" @click="onCollopse">
        <q-icon
            v-if="!isCollopsed"
            class="q-mr-sm"
            name="bi-chevron-down"
        />
        <q-icon
            v-if="isCollopsed"
            class="q-mr-sm"
            name="bi-chevron-right"
        />
        <span> {{ label }} </span>
    </q-item>

    <q-item
        clickable
        dense
        class="sidebar-list-item"
        active-class="sidebar-list-item-active"
        v-show="!isCollopsed"
        v-for="categorizer in categorizers"
        :key="categorizerType + '-' + categorizer.name"
        :active="selectedCategorizer === categorizerType + '-' + categorizer.name"
        @click="onSelectCategorizerInGroup(categorizerType + '-' + categorizer.name)"
    >
        <q-icon
            class="q-ml-sm q-mr-sm sidebar-list-icon"
            :name=icon
        />
        <span class="sidebar-list-text"> {{ categorizer.name }} </span>
        <q-badge
          rounded class="absolute-right q-mr-sm sidebar-list-badge"
          :label="categorizer.count"
          v-if="showCount"
        />
        <q-menu touch-position context-menu>
            <q-list dense style="min-width: 50px">
                <q-item clickable v-close-popup @click="deleteCategorizer(categorizer)">
                    <q-item-section style="font-size: 0.9em; color: var(--q-text)">
                        Delete
                    </q-item-section>
                </q-item>
            </q-list>
        </q-menu>
    </q-item>
  </div>
</template>

<style lang="sass">
@import 'src/css/sidebar.scss'
</style>

<script lang="ts">
import { PaperCategorizer } from 'src/models/PaperCategorizer';
import {defineComponent, ref, toRefs} from 'vue';

export default defineComponent({
  name: 'SidebarCollopseGroup',
  props: {
    label: String,
    icon: String,
    categorizers: Array,
    categorizerType: String,
    selectedCategorizer: String,
    showCount: Boolean,
  },
  emits: ['select-categorizer'],
  setup(props, {emit}) {
    const isCollopsed = ref(false);

    const onCollopse = () => {
      isCollopsed.value = !isCollopsed.value;
    };

    const onSelectCategorizerInGroup = (categorizer: PaperCategorizer) => {
      emit('select-categorizer', categorizer);
    };

    const deleteCategorizer = (categorizer: PaperCategorizer) => {
      if (props.categorizerType === 'tag') {
        window.entityInteractor.deleteCategorizer(categorizer.name, 'PaperTag');
      } else {
        window.entityInteractor.deleteCategorizer(categorizer.name, 'PaperFolder');
      }
    };

    return {
      isCollopsed,
      onCollopse,
      onSelectCategorizerInGroup,
      deleteCategorizer,
      ...toRefs(props),
    };
  },
});
</script>
