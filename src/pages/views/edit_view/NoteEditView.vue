<template>
    <q-dialog v-model="isNoteViewShown">
        <q-card flat style="width: 500px; height: 190px" class="q-pa-sm">
            <q-input
                stack-label
                dense
                v-model="entityDraft.note"
                standout="bg-primary text-white"
                label="Note"
                type="textarea"
                style="font-size: 0.85em"
            />
            <div class="row justify-between q-mt-sm">
                <q-btn
                    class="col-3"
                    unelevated
                    no-caps
                    color="secondary"
                    text-color="primary"
                    label="Close"
                    @click="onClose"
                />
                <q-btn
                    class="col-3"
                    unelevated
                    no-caps
                    color="secondary"
                    text-color="primary"
                    label="Save & Close"
                    @click="onSave"
                />
            </div>
        </q-card>
    </q-dialog>
</template>

<style lang="sass">
@import 'src/css/mainview.scss'
</style>

<script>
import {defineComponent, ref, toRefs} from 'vue';

import {PaperEntityDraft} from 'src/models/PaperEntity';

export default defineComponent({
  name: 'NoteEditView',
  setup(props, {emit}) {
    const isNoteViewShown = ref(false);
    const entityDraft = ref(new PaperEntityDraft());

    window.api.registerSignal(
        'viewState.isNoteViewShown',
        (event, message) => {
          isNoteViewShown.value = JSON.parse(message);
        },
    );

    window.api.registerSignal(
        'sharedData.editEntityDraft',
        (event, message) => {
          entityDraft.value = JSON.parse(message);
        },
    );

    const onClose= () => {
      window.api.sendSignal('viewState.isNoteViewShown', false);
    };

    const onSave = () => {
      window.api.update(JSON.stringify([entityDraft.value]));
      window.api.sendSignal('viewState.isNoteViewShown', false);
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
