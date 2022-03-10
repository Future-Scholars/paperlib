<template>
    <q-tab-panel>
        <div class="row setting-title" style="text-align: left !important">
            <span style="font-weight: 500">
                Turn on/off Metadata Scrapers.
            </span>
        </div>
        <hr
            style="
                margin-top: -1px;
                background-color: #eee;
                height: 1px;
                border: 0;
            "
        />

        <div class="row justify-center">
            <div class="col-4 setting-title q-pt-xs">PDF-builtin</div>
            <div class="col-1">
                <q-checkbox
                    dense
                    keep-color
                    size="xs"
                    color="grey-5"
                    v-model="preference.pdfBuiltinScraper"
                    @update:model-value="(value) => onUpdate('pdfBuiltinScraper', value)"
                />
            </div>
            <div class="col-5"></div>
        </div>

        <div class="row justify-center">
            <div class="col-4 setting-title q-pt-xs">arXiv</div>
            <div class="col-1">
                <q-checkbox
                    dense
                    keep-color
                    size="xs"
                    color="grey-5"
                    v-model="preference.arXivScraper"
                    @update:model-value="(value) => onUpdate('arXivScraper', value)"
                />
            </div>
            <div class="col-5"></div>
        </div>

        <div class="row justify-center">
            <div class="col-4 setting-title q-pt-xs">DOI.org</div>
            <div class="col-1">
                <q-checkbox
                    dense
                    keep-color
                    size="xs"
                    color="grey-5"
                    v-model="preference.doiScraper"
                    @update:model-value="(value) => onUpdate('doiScraper', value)"
                />
            </div>
            <div class="col-5"></div>
        </div>

        <div class="row justify-center">
            <div class="col-4 setting-title q-pt-xs">
                Paperlib's Title Extractor
            </div>
            <div class="col-1">
                <q-checkbox
                    dense
                    keep-color
                    size="xs"
                    color="grey-5"
                    v-model="preference.teScraper"
                    @update:model-value="(value) => onUpdate('teScraper', value)"
                />
            </div>
            <div class="col-5"></div>
        </div>

        <div class="row justify-center">
            <div class="col-4 setting-title q-pt-xs">DBLP</div>
            <div class="col-1">
                <q-checkbox
                    dense
                    keep-color
                    size="xs"
                    color="grey-5"
                    v-model="preference.dblpScraper"
                    @update:model-value="(value) => onUpdate('dblpScraper', value)"
                />
            </div>
            <div class="col-5"></div>
        </div>

        <div class="row justify-center">
            <div class="col-4 setting-title q-pt-xs">The CVF</div>
            <div class="col-1">
                <q-checkbox
                    dense
                    keep-color
                    size="xs"
                    color="grey-5"
                    v-model="preference.cvfScraper"
                    @update:model-value="(value) => onUpdate('cvfScraper', value)"
                />
            </div>
            <div class="col-5"></div>
        </div>

        <div class="row justify-center">
            <div class="col-4 setting-title q-pt-xs">IEEE Xplorer</div>
            <div class="col-1">
                <q-checkbox
                    dense
                    keep-color
                    size="xs"
                    color="grey-5"
                    v-model="preference.ieeeScraper"
                    @update:model-value="(value) => onUpdate('ieeeScraper', value)"
                />
            </div>
            <div class="col-5">
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
                        v-model="preference.ieeeAPIKey"
                        dense
                        style="max-height: 22px"
                        @update:model-value="(value) => onUpdate('ieeeAPIKey', value)"
                    />
                </div>
            </div>
        </div>

        <div
            class="q-mt-lg row setting-title"
            style="text-align: left !important"
        >
            <span style="font-weight: 500">
                Check publication status for preprint papers automatically.
            </span>
        </div>
        <hr
            style="
                margin-top: -1px;
                background-color: #eee;
                height: 1px;
                border: 0;
            "
        />

        <div class="row justify-center q-mt-lg">
            <div class="col-4 setting-title q-pt-xs">Turn on/off, and interval day(s).</div>
            <div class="col-1">
                <q-checkbox
                    dense
                    keep-color
                    size="xs"
                    v-model="preference.allowRoutineMatch"
                    color="grey-5"
                    @update:model-value="(value) => onUpdate('allowRoutineMatch', value)"
                />
            </div>
            <div class="col-5">
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
                        v-model="preference.rematchInterval"
                        dense
                        type="number"
                        style="max-height: 22px"
                        @update:model-value="(value) => onUpdate('rematchInterval', value)"
                    />
                </div>
            </div>
        </div>
    </q-tab-panel>
</template>

<style lang="sass">
@import 'src/css/settingview.scss'
</style>

<script>
import {defineComponent, ref, toRefs} from 'vue';

export default defineComponent({
  name: 'ScraperTab',
  props: {
    preference: Object,
  },
  setup(props, {emit}) {
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
