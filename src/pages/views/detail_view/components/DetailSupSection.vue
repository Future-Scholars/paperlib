<template>
    <div v-if="urls.length > 0">
        <div class="detail-section-title q-mb-xs" >
            Supplementaries
        </div>
        <q-chip
            square
            size="md"
            dense
            color="grey-4"
            clickable
            v-for="url in urls"
            :key="url"
            @click="openFile(url)"
            class="q-mt-none q-ml-none"
        >
            <div style="font-size: 10px; color: #666666">
                {{ fileExtension(url) }}
            </div>
            <q-menu touch-position context-menu>
                <q-list dense style="min-width: 50px">
                    <q-item clickable v-close-popup @click="$emit('deleteSup', url)">
                        <q-item-section style="font-size: 0.9em">Delete</q-item-section>
                    </q-item>
                </q-list>
            </q-menu>
        </q-chip>
    </div>
</template>

<style lang="sass">
@import 'src/css/detailview.scss'
</style>

<script>
import {defineComponent, toRefs} from 'vue';

export default defineComponent({
  name: 'DetailSupSection',
  components: {},
  props: {
    urls: Array,
  },

  setup(props) {
    const fileExtension = (url) => {
      return url.split('.').pop().toUpperCase();
    };

    const openFile = (url) => {
      window.api.open(url);
    };
    return {
      fileExtension,
      openFile,
      ...toRefs(props),
    };
  },
});
</script>
