<template>
    <q-btn
        flat
        size="sm"
        padding="xs sm"
        color="grey-7"
        :icon="icon"
        class="float-right q-mr-sm"
    />
</template>

<script>
import { defineComponent, toRefs } from "vue";

export default defineComponent({
    name: "ToolbarButton",
    props: {
        icon: String,
    },

    setup(props) {
        return {
            ...toRefs(props),
        }
    }

});
</script>
