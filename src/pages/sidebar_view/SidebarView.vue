<template>
    <div class="sidebar absolute-full">
        <WindowControl />

        <q-list dense class="sidebar-list q-pl-md q-pr-md">
            <q-item dense class="sidebar-list-title">
                <span>Library</span>
            </q-item>

            <SidebarItem
              label="All Papers"
              icon="bi-collection"
              :count="entitiesCount"
              :showCount="showSidebarCount"
              :withSpinner="true"
              :active="selectedCategorizer === 'lib-all'"
              @click="onSelectCategorizer('lib-all')"
            />
            <SidebarItem
              label="Flags"
              icon="bi-flag"
              :withSpinner="false"
              :active="selectedCategorizer === 'lib-flaged'"
              @click="onSelectCategorizer('lib-flaged')"
            />

            <SidebarCollopseGroup
              label="Tags"
              icon="bi-tag"
              :showCount="showSidebarCount"
              :categorizers="tags"
              categorizerType="tag"
              :selectedCategorizer="selectedCategorizer"
              @select-categorizer="onSelectCategorizer"
            />

            <SidebarCollopseGroup
              label="Folders"
              icon="bi-folder"
              :showCount="showSidebarCount"
              :categorizers="folders"
              categorizerType="folder"
              :selectedCategorizer="selectedCategorizer"
              @select-categorizer="onSelectCategorizer"
            />

        </q-list>
    </div>

</template>

<style lang="sass">
@import '../../css/sidebar.scss'
</style>

<script lang="ts">
import {defineComponent, toRefs, ref} from 'vue';

import WindowControl from './components/WindowControl.vue';
import SidebarItem from './components/SidebarItem.vue';
import SidebarCollopseGroup from './components/SidebarCollopseGroup.vue';

export default defineComponent({
  name: 'SidebarView',

  components: {
    WindowControl,
    SidebarItem,
    SidebarCollopseGroup,
  },

  props: {
    tags: Array,
    folders: Array,
    selectedCategorizer: String,
    showSidebarCount: Boolean,
  },

  setup(props, {emit}) {
    const entitiesCount = ref(0);

    const onSelectCategorizer = (categorizer: string) => {
      window.systemInteractor.setState('selectionState.selectedCategorizer', JSON.stringify(categorizer));
    };

    window.systemInteractor.registerState('viewState.entitiesCount', (event, message) => {
      entitiesCount.value = JSON.parse(message as string) as number;
    });

    return {
      entitiesCount,
      onSelectCategorizer,
      ...toRefs(props),
    };
  },

});
</script>
