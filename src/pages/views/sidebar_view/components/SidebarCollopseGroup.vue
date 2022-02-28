<template>
    <q-item clickable class="sidebar-list-title" @click="onCollopse">
        <q-icon
            v-if="!isCollopsed"
            class="q-mr-sm"
            name="bi-chevron-down"
            color="grey-8"
        />
        <q-icon
            v-if="isCollopsed"
            class="q-mr-sm"
            name="bi-chevron-right"
            color="grey-8"
        />
        <span class="text-primary"> {{ label }} </span>
    </q-item>

    <q-item
        clickable
        v-ripple
        class="sidebar-list-item"
        active-class="sidebar-list-item-active"
        v-show="!isCollopsed"
        v-for="categorizer in categorizers"
        :key="categorizerType + '-' + categorizer.name"
        :active="selectedCategorizer === categorizerType + '-' + categorizer.name"
        @click="onSelectCategorizer(categorizerType + '-' + categorizer.name)"
    >
        <q-icon
            class="q-mr-md sidebar-list-icon"
            color="blue-7"
            :name=icon
        />
        <span class=""> {{ categorizer.name }} </span>
        <q-menu touch-position context-menu>
            <q-list dense style="min-width: 50px">
                <q-item clickable v-close-popup @click="deleteCategorizer(categorizer)">
                    <q-item-section style="font-size: 0.9em">
                        Delete
                    </q-item-section>
                </q-item>
            </q-list>
        </q-menu>
    </q-item>
</template>

<style lang="sass">
@import 'src/css/sidebar.scss'
</style>

<script>
import { defineComponent, ref, toRefs } from "vue";

export default defineComponent({
    name: "SidebarCollopseGroup",
    props: {
        label: String,
        icon: String,
        categorizers: Array,
        categorizerType: String,
        selectedCategorizer: String,
    },
    emits: ["selectCategorizer"],
    setup(props, { emit }) {
        const isCollopsed = ref(false);

        const onCollopse = () => {
            isCollopsed.value = !isCollopsed.value;
        };

        const onSelectCategorizer = (categorizer) => {
            emit("selectCategorizer", categorizer);
        };

        const deleteCategorizer = (categorizer) => {
            if (props.categorizerType === "tag") {
                window.api.deleteTag(categorizer.name);
            }
            else {
                window.api.deleteFolder(categorizer.name);
            }
        };

        return {
            isCollopsed,
            onCollopse,
            onSelectCategorizer,
            deleteCategorizer,
            ...toRefs(props),
        };
    },
});
</script>
