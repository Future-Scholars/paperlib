<template>
    <q-tab-panel name="scraper" class="preference-tab">
        <div class="row setting-title" style="text-align: left !important">
            <span style="font-weight: 500">
                Turn on/off Metadata Scrapers.
            </span>
        </div>
        <hr
            style="
                margin-top: -1px;
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
                    v-model="pdfBuiltinScraper"
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
                    v-model="arXivScraper"
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
                    v-model="doiScraper"
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
                    v-model="teScraper"
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
                    v-model="dblpScraper"
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
                    v-model="cvfScraper"
                    @update:model-value="(value) => onUpdate('cvfScraper', value)"
                />
            </div>
            <div class="col-5"></div>
        </div>

        <div class="row justify-center">
            <div class="col-4 setting-title q-pt-xs">Paper with Code</div>
            <div class="col-1">
                <q-checkbox
                    dense
                    keep-color
                    size="xs"
                    color="grey-5"
                    v-model="pwcScraper"
                    @update:model-value="(value) => onUpdate('pwcScraper', value)"
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
                    v-model="ieeeScraper"
                    @update:model-value="(value) => onUpdate('ieeeScraper', value)"
                />
            </div>
            <div class="col-5">
                <div class="radius-border setting-content preference-input" >
                    <q-input
                        borderless
                        v-model="ieeeAPIKey"
                        placeholder="API Key"
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
                    v-model="allowRoutineMatch"
                    color="grey-5"
                    @update:model-value="(value) => onUpdate('allowRoutineMatch', value)"
                />
            </div>
            <div class="col-5">
                <div class="radius-border setting-content preference-input" >
                    <q-input
                        borderless
                        v-model="rematchInterval"
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

<script lang="ts">
import {defineComponent, PropType, ref, toRefs} from 'vue';

import { PreferenceType } from '../../../utils/preference';

export default defineComponent({
  name: 'ScraperTab',
  props: {
    preference: {
      type: Object as PropType<PreferenceType>,
      required: true,
    },
  },
  setup(props, {emit}) {
    const pdfBuiltinScraper = ref(props.preference.pdfBuiltinScraper);
    const arXivScraper = ref(props.preference.arXivScraper);
    const doiScraper = ref(props.preference.doiScraper);
    const teScraper = ref(props.preference.teScraper);
    const dblpScraper = ref(props.preference.dblpScraper);
    const cvfScraper = ref(props.preference.cvfScraper);
    const ieeeScraper = ref(props.preference.ieeeScraper);
    const ieeeAPIKey = ref(props.preference.ieeeAPIKey);
    const pwcScraper = ref(props.preference.pwcScraper);

    const rematchInterval = ref(props.preference.rematchInterval);
    const allowRoutineMatch = ref(props.preference.allowRoutineMatch);

    const onUpdate = (key: string, value: unknown) => {
      window.systemInteractor.updatePreference(key, value);
    };

    return {
      pdfBuiltinScraper,
      arXivScraper,
      doiScraper,
      teScraper,
      dblpScraper,
      cvfScraper,
      ieeeScraper,
      ieeeAPIKey,
      pwcScraper,
      rematchInterval,
      allowRoutineMatch,

      onUpdate,
    };
  },
});
</script>
