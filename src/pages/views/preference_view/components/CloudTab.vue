<template>
    <q-tab-panel>

        <div class="row setting-title" style="text-align: left !important">
            <span style="font-weight: 500">
                Cloud Sync API Key is your identification and authentication on the cloud database. Never share it with others.
            </span>
        </div>
        <div class="row">
            <div class="col-10">
                <div
                    style="
                        padding-left: 5px;
                        border: 1px solid #ddd;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        cursor: pointer;
                    "
                    class="radius-border setting-content"
                >
                    <q-input
                        borderless
                        v-model="preference.syncAPIKey"
                        dense
                        style="max-height: 22px"
                        @update:model-value="(value) => onUpdate('syncAPIKey', value)"
                    />
                </div>
            </div>
            <div class="col-1">
                <q-btn
                    unelevated
                    no-caps
                    size="xs"
                    text-color="primary"
                    color="secondary"
                    label="Login"
                    style="font-size: 10px;"
                    class="q-ml-sm"
                    @click="onLoginClicked"
                />
            </div>
        </div>

        <div class="row setting-title q-mt-lg" style="text-align: left !important">
            <span style="font-weight: 500">
                Migrate the local database to the cloud database.
            </span>
        </div>
            <q-btn
                unelevated
                no-caps
                size="sm"
                text-color="primary"
                color="secondary"
                label="Migrate"
                style="font-size: 12px;"
                class="q-mt-sm"
                @click="onMigrateClicked"
            />
    </q-tab-panel>
</template>

<style lang="sass">
@import 'src/css/settingview.scss'
</style>

<script>
import { defineComponent, ref, toRefs } from "vue";

export default defineComponent({
    name: "CloudTab",
    props: {
        preference: Object,
    },
    setup(props, { emit }) {

        const onUpdate = (key, value) => {
            window.api.updatePreference(key, value);
        };

        return {
            onUpdate,
            ...toRefs(props),
        };
    },
});
</script>
