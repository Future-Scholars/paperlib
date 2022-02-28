<template>
    <q-dialog v-model="isEditViewShown">
        <q-card flat style="width: 500px; height: 440px" class="q-pa-none">
            <EditTextField label="Title" :value="entityDraft.title" @update:model-value="(value) => onUpdate('title', value)"/>
            <EditTextField label="Authors" :value="entityDraft.authors" @update:model-value="(value) => onUpdate('authors', value)"/>
            <EditTextField label="Publication" :value="entityDraft.publication" @update:model-value="(value) => onUpdate('publication', value)"/>
            <div class="row" style="margin-top: -8px;">
                <EditTextField label="PubTime" class="col" style="margin-right: 20px;" :value="entityDraft.pubTime" @update:model-value="(value) => onUpdate('pubTime', value)"/>
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
                <EditTextField label="arXivID" class="col" :value="entityDraft.arxiv" @update:model-value="(value) => onUpdate('arxiv', value)"/>
                <EditTextField label="DOI" class="col" :value="entityDraft.doi" @update:model-value="(value) => onUpdate('doi', value)"/>
            </div>
            <EditTextField label="Tags" :value="entityDraft.tags" @update:model-value="(value) => onUpdate('tags', value)"/>
            <EditTextField label="Folders" :value="entityDraft.folders" @update:model-value="(value) => onUpdate('folders', value)"/>
            <EditTextField label="Note" :value="entityDraft.note" @update:model-value="(value) => onUpdate('note', value)"/>
            <div class="row justify-between q-ml-sm q-mr-sm">
                <q-btn
                    class="col-3"
                    unelevated
                    no-caps
                    color="primary"
                    label="Close"
                    @click="isEditViewShown = false"
                />
                <q-btn
                    class="col-3"
                    unelevated
                    no-caps
                    color="primary"
                    label="Save & Close"
                    @click="saveAndClose()"
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

import EditTextField from "src/pages/views/edit_view/components/TextField.vue";

import { PaperEntityDraft } from "src/models/PaperEntity";

export default defineComponent({
    name: "EditView",

    components: { 
        EditTextField 
    },

    setup(props, { emit }) {
        const isEditViewShown = ref(false);
        const entityDraft = ref(new PaperEntityDraft());

        window.api.registerSignal("viewState.isEditViewShown", (event, message) => {
            isEditViewShown.value = JSON.parse(message);
        });

        window.api.registerSignal("sharedData.editEntityDraft", (event, message) => {
            entityDraft.value = JSON.parse(message);
        });

        const saveAndClose = () => {
            window.api.update(JSON.stringify([entityDraft.value]))
            isEditViewShown.value = false;
        };

        const onUpdate = (path, value) => {
            entityDraft.value[path] = value;
        };

        return {
            isEditViewShown,
            entityDraft,
            onUpdate,
            saveAndClose,
            ...toRefs(props),
        };
    },
});
</script>
