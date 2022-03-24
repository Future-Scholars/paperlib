<template>
    <div v-if="codes.length > 0" class="q-mb-sm">
        <div class="detail-section-title q-mb-xs" >
            Codes
        </div>
        <q-chip
            square
            size="md"
            dense
            clickable
            v-for="code in codes"
            :key="code"
            @click="openWeb(code)"
            class="q-mt-none q-ml-none"
            style="background-color: var(--q-bg-secondary);"
        >
          <q-icon :name=" code.includes('github') ? 'bi-github' : 'bi-code-slash'" style="color: var(--q-text)"/>
          <div class="q-ml-xs" style="font-size: 10px; color: var(--q-text)">
              {{ isOfficial(code) }}
          </div>
        </q-chip>
    </div>
</template>

<script lang="ts">
import {defineComponent, toRefs} from 'vue';

export default defineComponent({
  name: 'DetailCodeSection',
  components: {},
  props: {
    codes: Array,
  },
  setup(props) {
    const isOfficial = (codeJSONstr: string) => {
      const code = JSON.parse(codeJSONstr) as {
        url: string;
        isOfficial: boolean;
      };
      const official = code.isOfficial? 'Official' : 'Community';
      return official;
    };

    const openWeb = (codeJSONstr: string) => {
      const code = JSON.parse(codeJSONstr) as {
        url: string;
        isOfficial: boolean;
      };
      const url = code.url;
      void window.systemInteractor.openweb(url);
    };
    return {
      isOfficial,
      openWeb,
      ...toRefs(props),
    };
  },
});
</script>
