<template>
    <q-item
        clickable
        v-close-popup
        class="menu-list-item"
    >
      <q-item-section avatar style="min-width: 12px !important;">
        <q-icon :name="icon" style="font-size: 0.8rem;"/>
      </q-item-section>
      <q-item-section>
      {{ label }}
      </q-item-section>
      <q-item-section side>
        <q-icon
            v-show="sortBy === name"
            name="bi-check2"
            style="font-size: 0.8rem"
        />
      </q-item-section>
    </q-item>
</template>

<script lang="ts">
import {defineComponent, toRefs} from 'vue';

export default defineComponent({
  name: 'SortMenuItem',
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
