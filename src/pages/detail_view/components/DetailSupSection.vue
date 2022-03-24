<template>
    <div v-if="urls.length > 0">
        <div class="detail-section-title q-mb-xs" >
            Supplementaries
        </div>
        <q-chip
            square
            size="md"
            dense
            clickable
            v-for="url in urls"
            :key="url"
            @click="openFile(url)"
            class="q-mt-none q-ml-none"
            style="background-color: var(--q-bg-secondary);"
        >
            <div style="font-size: 10px; color: var(--q-text)">
                {{ fileExtension(url) }}
            </div>
            <q-menu touch-position context-menu>
                <q-list dense style="min-width: 50px">
                    <q-item clickable v-close-popup @click="$emit('delete-sup', url)">
                        <q-item-section style="font-size: 0.9em">Delete</q-item-section>
                    </q-item>
                </q-list>
            </q-menu>
        </q-chip>
    </div>
</template>

<script lang="ts">
import {defineComponent, toRefs} from 'vue';

export default defineComponent({
  name: 'DetailSupSection',
  components: {},
  props: {
    urls: Array,
  },

  setup(props) {
    const fileExtension = (url: string) => {
      const parts = url.split('.');
      const ext = parts.pop();
      return ext ? ext.toUpperCase() : 'FILE';
    };

    const openFile = (url: string) => {
      void window.entityInteractor.open(url);
    };
    return {
      fileExtension,
      openFile,
      ...toRefs(props),
    };
  },
});
</script>
