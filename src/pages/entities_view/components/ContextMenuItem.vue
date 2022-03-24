<template>
    <q-item clickable v-close-popup class="menu-list-item">
        <q-item-section > {{ label }} </q-item-section>
        <q-item-section class="menu-item-shortcut">
            {{ shortcut }}
        </q-item-section>
    </q-item>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'EntitiesViewContextMenuItem',

  props: {
    label: String,
    shortcut: String,
  },
});
</script>
