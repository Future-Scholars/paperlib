<template>
    <q-btn
        flat
        size="sm"
        padding="xs sm"
        style="color: var(--q-button-1)"
        :icon="icon"
        class="float-right q-mr-sm"
    >
     <q-tooltip :delay="1000"> {{ tooltip }} </q-tooltip>
    </q-btn>
</template>

<script lang="ts">
import {defineComponent, toRefs} from 'vue';

export default defineComponent({
  name: 'ToolbarButton',
  props: {
    icon: String,
    tooltip: String,
  },

  setup(props) {
    return {
      ...toRefs(props),
    };
  },

});
</script>
