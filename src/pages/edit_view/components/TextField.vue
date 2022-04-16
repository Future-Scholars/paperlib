<template>
    <q-input
        stack-label
        dense
        v-model="textFieldValue"
        class="q-mt-sm q-mb-sm q-ml-sm q-mr-sm edit-textfield"
        outlined
        :label="label"
        style="font-size: 0.85em"
        @update:model-value="onUpdate"
    />
</template>

<script lang="ts">
import {defineComponent, ref, toRefs} from 'vue';

export default defineComponent({
  name: 'EditTextField',
  components: {},
  props: {
    label: String,
    value: String,
  },

  watch: {
    value: {
      immediate: true,
      handler(value: string) {
        this.textFieldValue = value;
      },
    },
  },

  setup(props, {emit}) {
    const textFieldValue = ref(props.value);

    const onUpdate = (value: string) => {
      emit('update:model-value', value);
    };

    return {
      textFieldValue,
      onUpdate,
      ...toRefs(props),
    };
  },
});
</script>
