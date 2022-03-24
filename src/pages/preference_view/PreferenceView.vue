<template>
    <q-dialog class="q-pa-none" v-model="isPreferenceViewShown" @hide="onClose" transition-show="fade" transition-hide="fade">
        <q-card flat class="preference-view">
            <q-tabs
                v-model="selectedTab"
                dense
                no-caps
                align="center"
                class="text-grey q-mt-md"
                :breakpoint="0"
                indicator-color="transparent"
                active-color="blue-7"
            >
                <q-tab
                    name="general"
                    icon="bi-gear-wide-connected"
                    label="General"
                    :ripple="false"
                />
                <q-tab
                    name="scraper"
                    icon="bi-binoculars"
                    label="Scraper"
                    :ripple="false"
                />
                <q-tab
                    name="cloud"
                    icon="bi-cloud-arrow-up"
                    label="Cloud"
                    :ripple="false"
                />
                <q-tab
                    name="export"
                    icon="bi-box-arrow-up"
                    label="Export"
                    :ripple="false"
                />
                <q-tab
                    name="info"
                    icon="bi-info-circle"
                    label="About"
                    :ripple="false"
                />
            </q-tabs>

            <hr
                class="q-ml-lg q-mr-lg"
                style="height: 1px; border: 0"
            />

            <q-tab-panels class="q-mt-md" v-model="selectedTab" animated>
                <GeneralTab name="general" :preference="preference"/>
                <ScraperTab name="scraper" :preference="preference"/>
                <CloudTab name="cloud" :preference="preference"/>
                <ExportTab name="export" :preference="preference"/>
                <InfoTab name="info" :preference="preference"/>

            </q-tab-panels>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import {defineComponent, ref, toRefs} from 'vue';

import GeneralTab from './components/GeneralTab.vue';
import ScraperTab from './components/ScraperTab.vue';
import CloudTab from './components/CloudTab.vue';
import ExportTab from './components/ExportTab.vue';
import InfoTab from './components/InfoTab.vue';

export default defineComponent({
  name: 'PreferenceView',
  components: {
    GeneralTab,
    ScraperTab,
    CloudTab,
    ExportTab,
    InfoTab,
  },
  props: {
    preference: Object,
  },
  setup(props, {emit}) {
    const isPreferenceViewShown = ref(false);
    const selectedTab = ref('general');

    window.systemInteractor.registerState('viewState.isPreferenceViewShown', (event, message) => {
      isPreferenceViewShown.value = JSON.parse(message as string) as boolean;
    });

    const onClose = () => {
      window.systemInteractor.setState('viewState.isPreferenceViewShown', false);
    };

    return {
      isPreferenceViewShown,
      selectedTab,
      onClose,
      ...toRefs(props),
    };
  },
});
</script>
