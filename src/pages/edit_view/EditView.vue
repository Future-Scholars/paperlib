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
                  style="margin-right: 15px;"
                  :value="entityDraft.pubTime"
                  @update:model-value="(value) => onUpdate('pubTime', value)"
                />
                <q-select 
                  dense
                  class="col q-mr-sm q-mt-sm edit-select-field"
                  standout="bg-accent text-secondary"
                  v-model="pubType" 
                  :options="['Journal', 'Conference', 'Book', 'Others']" 
                  label="Publication Type"
                  @update:model-value="(value) => onUpdatePubType(value)"
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
    const pubType = ref('Journal');

    window.systemInteractor.registerState('viewState.isEditViewShown', (event, message) => {
      isEditViewShown.value = JSON.parse(message as string) as boolean;
    });

    window.systemInteractor.registerState('sharedData.editEntityDraft', (event, message) => {
      entityDraft.value.initialize(JSON.parse(message as string) as PaperEntity);
      pubType.value = ['Journal', 'Conference', 'Others', 'Book'][entityDraft.value.pubType];
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

    const onUpdatePubType = (value: string) => {
      entityDraft.value.pubType = ['Journal', 'Conference', 'Others', 'Book'].indexOf(value);
    };

    return {
      isEditViewShown,
      entityDraft,
      pubType,
      onUpdate,
      onUpdatePubType,
      onClose,
      onSave,
      ...toRefs(props),
    };
  },
});
</script>
