<template>
    <q-dialog class="q-pa-none" v-model="isPreferenceViewShown">
        <q-card flat style="width: 800px; height: 400px">
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
                    icon="bi-globe"
                    label="Metadata"
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
                style="background-color: #ddd; height: 1px; border: 0"
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

<style lang="sass">
@import 'src/css/settingview.scss'
</style>

<script>
import { defineComponent, ref, toRefs } from "vue";

import GeneralTab from "src/pages/views/preference_view/components/GeneralTab.vue"
import ScraperTab from "src/pages/views/preference_view/components/ScraperTab.vue"
import CloudTab from "src/pages/views/preference_view/components/CloudTab.vue"
import ExportTab from "src/pages/views/preference_view/components/ExportTab.vue"
import InfoTab from "src/pages/views/preference_view/components/InfoTab.vue"

export default defineComponent({
    name: "PreferenceView",
    components: { 
        GeneralTab,
        ScraperTab,
        CloudTab,
        ExportTab,
        InfoTab
    },
    props: {
        preference: Object
    },
    setup(props, { emit }) {
        console.log(props.preference)
        const isPreferenceViewShown = ref(false);
        const selectedTab = ref("general");

        window.api.registerSignal("viewState.isPreferenceViewShown", (event, message) => {
            isPreferenceViewShown.value = JSON.parse(message);
        });

        return {
            isPreferenceViewShown,
            selectedTab,
            ...toRefs(props),
        };
    },
});
</script>
