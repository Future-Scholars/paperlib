<template>
    <q-item
        clickable
        v-close-popup
        class="sidebar-list-item"
    >
        <q-icon
            v-show="sortBy === name"
            class="q-ml-sm"
            name="bi-check2"
            color="gray-7"
        />
        <q-icon class="q-ml-sm q-mr-sm" :name="icon" color="gray-7" />
        <span> {{ label }} </span>
    </q-item>
</template>

<style lang="sass">
@import 'src/css/sidebar.scss'
</style>

<script>
import { defineComponent, toRefs } from "vue";

export default defineComponent({
    name: "SortMenuItem",
    props: {
        label: String,
        name: String,
        icon: String,
        sortBy: String,
    },

    setup(props) {
        return {
            ...toRefs(props),
        };
    },
});
</script>
