<template>
    <q-dialog v-model="isEditViewShown" @hide="onClose" transition-show="fade" transition-hide="fade" transition-duration="100" >
        <q-card flat style="width: 500px; height: 440px" class="q-pa-none edit-view">
            <EditTextField label="Title" :value="entityDraft.title" @update:model-value="(value) => onUpdate('title', value)"/>
            <EditTextField label="Authors" :value="entityDraft.authors" @update:model-value="(value) => onUpdate('authors', value)"/>
            <EditTextField
              label="Publication" :value="entityDraft.publication" @update:model-value="(value) => onUpdate('publication', value)"
            />
            <div class="row" style="margin-top: -8px;">
                <EditTextField
                  label="PubTime"
                  class="col"
                  style="margin-right: 20px;"
                  :value="entityDraft.pubTime"
                  @update:model-value="(value) => onUpdate('pubTime', value)"
                />
                <q-btn-toggle
                    class="col q-ml-xs"
                    no-caps
                    flat
                    toggle-color="primary"
                    color="white"
                    text-color="grey-5"
                    size="11.5px"
                    :options="[
                        { label: 'Journal', value: 0 },
                        { label: 'Conference', value: 1 },
                        { label: 'Others', value: 2 },
                    ]"
                    style="height: 40px; margin-top: 8px;"
                    v-model="entityDraft.pubType"
                    @update:model-value="(value) => onUpdate('pubType', value)"
                />
            </div>
            <div class="row" style="margin-top: -8px; margin-bottom: -8px;">
                <EditTextField
                  label="arXivID" class="col" :value="entityDraft.arxiv" @update:model-value="(value) => onUpdate('arxiv', value)"
                />
                <EditTextField label="DOI" class="col" :value="entityDraft.doi" @update:model-value="(value) => onUpdate('doi', value)"/>
            </div>
            <EditTextField label="Tags" :value="entityDraft.tags" @update:model-value="(value) => onUpdate('tags', value)"/>
            <EditTextField label="Folders" :value="entityDraft.folders" @update:model-value="(value) => onUpdate('folders', value)"/>
            <EditTextField label="Note" :value="entityDraft.note" @update:model-value="(value) => onUpdate('note', value)"/>
            <div class="row justify-end q-ml-sm q-mr-sm">
                <q-btn
                    class="col-2"
                    unelevated
                    no-caps
                    size="small"
                    text-color="primary"
                    label="Close"
                    @click="onClose()"
                />
                <q-btn
                    class="col-2"
                    unelevated
                    no-caps
                    size="small"
                    text-color="primary"
                    label="Save"
                    @click="onSave()"
                />
            </div>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, toRefs } from 'vue';

import EditTextField from './components/TextField.vue';

import { PaperEntity } from '../../models/PaperEntity';
import { PaperEntityDraft } from '../../models/PaperEntityDraft';

export default defineComponent({
  name: 'EditView',

  components: {
    EditTextField,
  },

  setup(props, {emit}) {
    const isEditViewShown = ref(false);
    const entityDraft = ref(new PaperEntityDraft());

    window.systemInteractor.registerState('viewState.isEditViewShown', (event, message) => {
      isEditViewShown.value = JSON.parse(message as string) as boolean;
    });

    window.systemInteractor.registerState('sharedData.editEntityDraft', (event, message) => {
      entityDraft.value.initialize(JSON.parse(message as string) as PaperEntity);
    });

    const onClose = () => {
      window.systemInteractor.setState('viewState.isEditViewShown', false);
    };

    const onSave = () => {
      void window.entityInteractor.update(JSON.stringify([entityDraft.value]));
      window.systemInteractor.setState('viewState.isEditViewShown', false);
    };

    const onUpdate = (propName: string, value: unknown) => {
      entityDraft.value[propName] = value;
    };

    return {
      isEditViewShown,
      entityDraft,
      onUpdate,
      onClose,
      onSave,
      ...toRefs(props),
    };
  },
});
</script>
