<template>
    <q-dialog v-model="isTagViewShown">
        <q-card flat style="width: 500px; height: 530px" class="q-pa-sm">
            <q-input
                v-model="entityDraft.tags"
                class="q-mb-sm"
                standout="bg-primary text-white"
                label="Tags"
                stack-label
                dense
                style="font-size: 0.85em"
            />
            <q-scroll-area style="height: 420px">
                <q-list >
                    <q-item
                        clickable
                        class="sidebar-list-item"
                        v-for="tag in tags"
                        @click="onTagClicked(tag)"
                    >
                        <q-icon
                            class="q-ml-sm q-mr-sm"
                            name="bi-tag-fill"
                            color="grey-8"
                        />
                        <span style="font-size: 1em">
                            {{ tag.name }}
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
    name: "TagNoteEditView",
    props: {
        tags: Array
    },
    setup(props, { emit }) {
        const isTagViewShown = ref(false);
        const entityDraft = ref(new PaperEntityDraft());

        window.api.registerSignal(
            "viewState.isTagViewShown",
            (event, message) => {
                isTagViewShown.value = JSON.parse(message);
            }
        );

        window.api.registerSignal(
            "sharedData.editEntityDraft",
            (event, message) => {
                entityDraft.value = JSON.parse(message);
            }
        );

        const onClose= () => {
            window.api.sendSignal("viewState.isTagViewShown", false)
        };

        const onSave = () => {
            window.api.update(JSON.stringify([entityDraft.value]));
            window.api.sendSignal("viewState.isTagViewShown", false)
        };

        const onTagClicked = (tag) => {
            var tags = formatString({
                str: entityDraft.value.tags,
                removeWhite: true,
            }).split(";");
            tags = tags.filter(
                (t) => t !== tag.name && t !== ""
            );
            tags.push(tag.name);
            entityDraft.value.tags = tags.join("; ");
        }

        return {
            isTagViewShown,
            entityDraft,
            onClose,
            onSave,
            onTagClicked,
            ...toRefs(props),
        };
    },
});
</script>
