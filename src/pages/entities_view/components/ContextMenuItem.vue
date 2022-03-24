<template>
    <q-item clickable v-close-popup class="menu-list-item">
        <q-item-section > {{ label }} </q-item-section>
        <q-item-section class="menu-item-shortcut">
          <div class="row justify-end">
            <i class='bootstrap-icons bi-command col-2' v-if="shortcutCmd" />
            <i class='bootstrap-icons bi-shift col-3' v-if="shortcutShift" />
            <i class='bootstrap-icons bi-arrow-return-left col-2' v-if="shortcutKey === 'enter'" />
            <span class="col-2" v-if="shortcutKey !== 'enter'"> {{ shortcutKey }} </span>
          </div>
        </q-item-section>
    </q-item>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'EntitiesViewContextMenuItem',

  props: {
    label: String,
    shortcutCmd: Boolean,
    shortcutShift: Boolean,
    shortcutKey: String,
  },
});
</script>
