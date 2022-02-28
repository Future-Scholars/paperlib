<template>
    <q-input
        stack-label
        dense
        v-model="value"
        class="q-mt-sm q-mb-sm q-ml-sm q-mr-sm"
        standout="bg-primary text-white"
        :label="label"
        style="font-size: 0.85em"
        @update:model-value="onUpdate"
    />
</template>

<script>
import { defineComponent, ref, toRefs } from "vue";

export default defineComponent({
    name: "EditTextField",
    components: {},
    props: {
        label: String,
        value: String,
    },

    setup(props, { emit }) {
        const value = ref(props.value);
        const label = ref(props.label);

        const onUpdate = (value) => {
            emit("update:model-value", value);
        };

        return {
            label,
            value,
            onUpdate,
        };
    },
});
</script>
