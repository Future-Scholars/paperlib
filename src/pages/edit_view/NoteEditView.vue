<template>
    <q-dialog v-model="isNoteViewShown" @hide="onClose" transition-show="fade" transition-hide="fade" transition-duration="100" >
        <q-card flat style="width: 500px; height: 190px" class="q-pa-sm edit-view">
            <q-input
                stack-label
                dense
                v-model="entityDraft.note"
                class="edit-textfield"
                standout="bg-accent text-secondary"
                label="Note"
                type="textarea"
                style="font-size: 0.85em; resize: none !important;"
            />

            <div class="row justify-end q-ml-sm q-mr-sm q-mt-sm">
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
import {defineComponent, ref, toRefs} from 'vue';

import { PaperEntity } from '../../models/PaperEntity';
import { PaperEntityDraft } from '../../models/PaperEntityDraft'

export default defineComponent({
  name: 'NoteEditView',
  setup(props, {emit}) {
    const isNoteViewShown = ref(false);
    const entityDraft = ref(new PaperEntityDraft());

    window.systemInteractor.registerState(
        'viewState.isNoteViewShown',
        (event, message) => {
          isNoteViewShown.value = JSON.parse(message as string) as boolean;
        },
    );

    window.systemInteractor.registerState(
        'sharedData.editEntityDraft',
        (event, message) => {
          entityDraft.value.initialize(JSON.parse(message as string) as PaperEntity);
        },
    );

    const onClose= () => {
      window.systemInteractor.setState('viewState.isNoteViewShown', false);
    };

    const onSave = () => {
      void window.entityInteractor.update(JSON.stringify([entityDraft.value]));
      window.systemInteractor.setState('viewState.isNoteViewShown', false);
    };


    return {
      isNoteViewShown,
      entityDraft,
      onSave,
      onClose,
      ...toRefs(props),
    };
  },
});
</script>
