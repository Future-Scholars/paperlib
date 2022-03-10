<template>
    <q-item clickable v-close-popup>
        <q-item-section style="font-size: 0.9em"> {{ label }} </q-item-section>
        <q-item-section style="font-size: 0.9em; color: #888; text-align: right">
            {{ shortcut }}
        </q-item-section>
    </q-item>
</template>

<script>
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'EntitiesViewContextMenuItem',

  props: {
    label: String,
    shortcut: String,
  },
});
</script>
