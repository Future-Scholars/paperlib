<template>
    <q-tab-panel class="preference-tab">
        <div class="row setting-title" style="text-align: left !important">
            <span style="font-weight: 500">
                Choose a folder to store paper files (e.g., PDF etc.) and the
                database files.
            </span>
        </div>
        <div class="row justify-center q-mb-sm">
            <div class="col">
              <div
                  style="cursor: pointer;"
                  class="radius-border preference-input"
                  @click="onPickerClicked"
              >
                  <span class="setting-content">
                      {{ preference.appLibFolder }}
                  </span>
              </div>
            </div>
        </div>

        <div class="row justify-center q-mt-lg">
            <div class="col-5 q-pt-xs setting-title">
                Prefered color theme.
            </div>
            <div class="col-5">
              <q-btn-toggle
                v-model="preferedTheme"
                flat
                toggle-color="accent"
                size="sm"
                :options="[
                  {label: 'Light', value: 'light'},
                  {label: 'Dark', value: 'dark'},
                  {label: 'System', value: 'system'}
                ]"
                @update:model-value="(value) => onPreferedThemeChanged(value)"
              />
            </div>
        </div>

        <div class="row justify-center q-mt-lg">
            <div class="col-5 setting-title">
                Invert preview color in dark mode.
            </div>
            <div class="col-5">
                <q-checkbox
                    dense
                    keep-color
                    size="xs"
                    color="grey-5"
                    v-model="invertColor"
                    @update:model-value="(value) => onUpdate('invertColor', value)"
                />
            </div>
        </div>

        <div class="row justify-center q-mt-lg">
            <div class="col-5 setting-title">
                Automatically delete the imported source file.
            </div>
            <div class="col-5">
                <q-checkbox
                    dense
                    keep-color
                    size="xs"
                    color="grey-5"
                    v-model="deleteSourceFile"
                    @update:model-value="(value) => onUpdate('deleteSourceFile', value)"
                />
            </div>
        </div>

        <div class="row justify-center q-mt-lg">
            <div class="col-5 setting-title">
                Show count number in sidebar.
            </div>
            <div class="col-5">
                <q-checkbox
                    dense
                    keep-color
                    size="xs"
                    color="grey-5"
                    v-model="showSidebarCount"
                    @update:model-value="(value) => onUpdate('showSidebarCount', value)"
                />
            </div>
        </div>
    </q-tab-panel>
</template>

<script lang="ts">
import {defineComponent, PropType, ref} from 'vue';

import { PreferenceType } from '../../../utils/preference';

export default defineComponent({
  name: 'GeneralTab',
  props: {
    preference: {
      type: Object as PropType<PreferenceType>,
      required: true,
    },
  },
  setup(props, {emit}) {
    const preferedTheme = ref(props.preference.preferedTheme);
    const deleteSourceFile = ref(props.preference.deleteSourceFile);
    const invertColor = ref(props.preference.invertColor);
    const showSidebarCount = ref(props.preference.showSidebarCount);

    const onUpdate = (key: string, value: unknown) => {
      window.systemInteractor.updatePreference(key, value);
    };

    const onPickerClicked = () => {
      window.systemInteractor.showFolderPicker();
    };

    const onPreferedThemeChanged = (value: string) => {
      onUpdate('preferedTheme', value);
      window.systemInteractor.setState('viewState.themeUpdated', new Date().getTime());
    };

    window.systemInteractor.registerState('dbState.selectedPath', (_event, message) => {
      onUpdate('appLibFolder', message);
      void window.entityInteractor.initDB();
    });

    return {
      preferedTheme,
      deleteSourceFile,
      invertColor,
      showSidebarCount,
      onPickerClicked,
      onPreferedThemeChanged,
      onUpdate,
    };
  },
});
</script>
