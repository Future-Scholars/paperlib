<template>
    <q-tab-panel name="export">
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
                    v-model="preference.enableExportReplacement"
                    @update:model-value="(value) => onUpdate('enableExportReplacement', value)"
                />
            </div>
        </div>

        <div class="row justify-center q-mt-sm">
            <div class="col-5">
                <div
                    style="
                        padding-left: 5px;
                        border: 1px solid #ddd;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    "
                    class="radius-border setting-content"
                >
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
                <div
                    style="
                        padding-left: 5px;
                        border: 1px solid #ddd;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    "
                    class="radius-border setting-content"
                >
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

<style lang="sass">
@import 'src/css/settingview.scss'
</style>

<script>
import { defineComponent, ref, toRefs } from "vue";

export default defineComponent({
    name: "ExportTab",
    props: {
        preference: Object,
    },
    setup(props, { emit }) {
        const newReplacementFrom = ref("");
        const newReplacementTo = ref("");

        const onUpdate = (key, value) => {
            window.api.updatePreference(key, value);
        };

        const onReplacementAdd = () => {
            var replacements = props.preference.exportReplacement;
            // Remove duplicates
            replacements = replacements.filter(
                (item) => item.from !== newReplacementFrom.value
            )
            // Add new replacement
            replacements.push({
                from: newReplacementFrom.value,
                to: newReplacementTo.value,
            });
            // Update preference
            onUpdate("exportReplacement", replacements);

            newReplacementFrom.value = "";
            newReplacementTo.value = "";
        }

        const onReplacementDelete = (replacement) => {
            var replacements = props.preference.exportReplacement;
            // Remove
            replacements = replacements.filter(
                (item) => item.from !== replacement.from && item.to !== replacement.to
            )
            // Update preference
            onUpdate("exportReplacement", replacements);
        }


        return {
            newReplacementFrom,
            newReplacementTo,
            onUpdate,
            onReplacementAdd,
            onReplacementDelete,
            ...toRefs(props),
        };
    }
});
</script>
