<template>
    <q-dialog v-model="isFolderViewShown">
        <q-card flat style="width: 500px; height: 530px" class="q-pa-sm">
            <q-input
                v-model="entityDraft.folders"
                class="q-mb-sm"
                standout="bg-primary text-white"
                label="Folders"
                stack-label
                dense
                style="font-size: 0.85em"
            />
            <q-scroll-area style="height: 420px">
                <q-list >
                    <q-item
                        clickable
                        class="sidebar-list-item"
                        v-for="folder in folders"
                        @click="onFolderClicked(folder)"
                    >
                        <q-icon
                            class="q-ml-sm q-mr-sm"
                            name="bi-folder-fill"
                            color="grey-8"
                        />
                        <span style="font-size: 1em">
                            {{ folder.name }}
                        </span>
                    </q-item>
                </q-list>
            </q-scroll-area>
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
import { defineComponent, ref, toRefs } from "vue";

import { PaperEntityDraft } from "src/models/PaperEntity";
import { formatString } from "src/utils/misc";

export default defineComponent({
    name: "FolderNoteEditView",
    props: {
        folders: Array
    },
    setup(props, { emit }) {
        const isFolderViewShown = ref(false);
        const entityDraft = ref(new PaperEntityDraft());

        window.api.registerSignal(
            "viewState.isFolderViewShown",
            (event, message) => {
                isFolderViewShown.value = JSON.parse(message);
            }
        );

        window.api.registerSignal(
            "sharedData.editEntityDraft",
            (event, message) => {
                entityDraft.value = JSON.parse(message);
            }
        );

        const onClose= () => {
            window.api.sendSignal("viewState.isFolderViewShown", false)
        };

        const onSave = () => {
            window.api.update(JSON.stringify([entityDraft.value]));
            window.api.sendSignal("viewState.isFolderViewShown", false)
        };

        const onFolderClicked = (folder) => {
            var folders = formatString({
                str: entityDraft.value.folders,
                removeWhite: true,
            }).split(";");
            folders = folders.filter(
                (t) => t !== folder.name && t !== ""
            );
            folders.push(folder.name);
            entityDraft.value.folders = folders.join("; ");
        }

        return {
            isFolderViewShown,
            entityDraft,
            onFolderClicked,
            onClose,
            onSave,
            ...toRefs(props),
        };
    },
});
</script>
