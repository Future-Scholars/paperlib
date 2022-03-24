<template>
    <q-tab-panel name="export" class="preference-tab">
        <div class="row">
            <div
                class="col-11 setting-title"
                style="text-align: left !important"
            >
                Enable replacing publication title with customed string when
                you export papers. For example, replacing 'Conference on
                Computer Vision and Pattern Recognition' by 'CVPR'.
            </div>
            <div class="col-1">
                <q-checkbox
                    dense
                    keep-color
                    size="xs"
                    color="grey-5"
                    v-model="enableExportReplacement"
                    @update:model-value="(value) => onUpdate('enableExportReplacement', value)"
                />
            </div>
        </div>

        <div class="row justify-center q-mt-sm">
            <div class="col-5">
                <div class="radius-border setting-content preference-input">
                    <q-input
                        borderless
                        v-model="newReplacementFrom"
                        dense
                        style="max-height: 22px"
                    />
                </div>
            </div>
            <div class="col-1" style="text-align: center">
                <q-icon name="bi-arrow-right" size="" color="grey-5" />
            </div>
            <div class="col-5">
                <div class="radius-border setting-content preference-input">
                    <q-input
                        borderless
                        v-model="newReplacementTo"
                        dense
                        style="max-height: 22px"
                    />
                </div>
            </div>
            <div class="col-1" style="text-align: center">
                <q-btn
                    dense
                    flat
                    color="primary"
                    size="xs"
                    icon="bi-plus-circle"
                    @click="onReplacementAdd"
                />
            </div>
        </div>

        <q-scroll-area style="height: 180px" class="q-mt-md">
            <q-list dense>
                <q-item
                    v-for="replacement in preference.exportReplacement"
                    :key="replacement.from + replacement.to"
                >
                    <div class="row justify-center full-width">
                        <span
                            class="setting-content col-5"
                            style="text-align: right; padding-top: 4px"
                        >
                            {{ replacement.from }}
                        </span>
                        <div class="col-1" style="text-align: center">
                            <q-icon
                                name="bi-arrow-right"
                                size=""
                                color="grey-5"
                            />
                        </div>
                        <span
                            class="setting-content col-5"
                            style="padding-top: 4px"
                        >
                            {{ replacement.to }}
                        </span>
                        <div class="col-1" style="text-align: center">
                            <q-btn
                                dense
                                flat
                                color="primary"
                                size="xs"
                                icon="bi-trash"
                                @click="onReplacementDelete(replacement)"
                            />
                        </div>
                    </div>
                </q-item>
            </q-list>
        </q-scroll-area>
    </q-tab-panel>
</template>

<script lang="ts">
import {defineComponent, PropType, ref, toRefs} from 'vue';

import { PreferenceType } from '../../../utils/preference';

export default defineComponent({
  name: 'ExportTab',
  props: {
    preference: {
      type: Object as PropType<PreferenceType>,
      required: true,
    },
  },
  setup(props, {emit}) {
    const newReplacementFrom = ref('');
    const newReplacementTo = ref('');

    const replacements = ref(props.preference.exportReplacement);
    const enableExportReplacement = ref(props.preference.enableExportReplacement);

    const onUpdate = (key: string, value: unknown) => {
      window.systemInteractor.updatePreference(key, value);
    };

    const onReplacementAdd = () => {
      // Remove duplicates
      replacements.value = replacements.value.filter(
          (item) => item.from !== newReplacementFrom.value,
      );
      // Add new replacement
      replacements.value.push({
        from: newReplacementFrom.value,
        to: newReplacementTo.value,
      });
      // Update preference
      window.systemInteractor.updatePreference('exportReplacement', JSON.stringify(replacements.value), true);

      newReplacementFrom.value = '';
      newReplacementTo.value = '';
    };

    const onReplacementDelete = (replacement: {from: string, to: string}) => {
      // Remove
      replacements.value = replacements.value.filter(
          (item) => item.from !== replacement.from && item.to !== replacement.to,
      );
      // Update preference
      window.systemInteractor.updatePreference('exportReplacement', JSON.stringify(replacements.value), true);
    };


    return {
      newReplacementFrom,
      newReplacementTo,
      replacements,
      enableExportReplacement,
      onUpdate,
      onReplacementAdd,
      onReplacementDelete,
    };
  },
});
</script>
