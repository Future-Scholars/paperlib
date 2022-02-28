<template>
    <div class="sidebar absolute-full bg-secondary">
        <WindowControl />

        <q-list dense class="sidebar-list q-pl-md q-pr-md">
            <q-item class="sidebar-list-title">
                <span class="text-primary">Library</span>
            </q-item>

            <SidebarItem label="All Papers" icon="bi-collection" :withSpinner="true" :active="selectedCategorizer === 'lib-all'" @click="onSelectCategorizer('lib-all')" />
            <SidebarItem label="Flags" icon="bi-flag" :withSpinner="false" :active="selectedCategorizer === 'lib-flaged'" @click="onSelectCategorizer('lib-flaged')" />

            <SidebarCollopseGroup label="Tags" icon="bi-tag" :categorizers="tags" categorizerType="tag" :selectedCategorizer="selectedCategorizer" @select-categorizer="onSelectCategorizer" />
            <SidebarCollopseGroup label="Folders" icon="bi-folder" :categorizers="folders" categorizerType="folder" :selectedCategorizer="selectedCategorizer" @select-categorizer="onSelectCategorizer" />

        </q-list>
    </div>

</template>

<style lang="sass">
@import 'src/css/sidebar.scss'
</style>

<script>
import { defineComponent, toRefs } from "vue";

import WindowControl from "src/pages/views/sidebar_view/components/WindowControl.vue";
import SidebarItem from "src/pages/views/sidebar_view/components/SidebarItem.vue";
import SidebarCollopseGroup from "src/pages/views/sidebar_view/components/SidebarCollopseGroup.vue";

export default defineComponent({
    name: "SidebarView",

    components: {
        WindowControl,
        SidebarItem,
        SidebarCollopseGroup
    },

    props: {
        tags: Array,
        folders: Array,
        selectedCategorizer: String,
    },

    setup(props, { emit }) {
        const onSelectCategorizer = (categorizer) => {
            window.api.sendSignal("selectionState.selectedCategorizer", JSON.stringify(categorizer));
        };

        return {
            onSelectCategorizer,
            ...toRefs(props),
        }
    }

});
</script>
