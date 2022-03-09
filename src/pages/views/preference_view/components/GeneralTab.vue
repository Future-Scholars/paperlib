<template>
    <q-tab-panel>
        <div class="row setting-title" style="text-align: left !important">
            <span style="font-weight: 500">
                Choose a folder to store paper files (e.g., PDF etc.) and the
                database files.</span
            >
        </div>
        <div class="row justify-center q-mb-sm">
            <div class="col">
                <q-file
                    ref="folderPicker"
                    dense
                    webkitdirectory
                    style="display: none"
                    @update:model-value="onFolderConfirmed"
                />
                <div
                    style="
                        padding-left: 5px;
                        border: 1px solid #ddd;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        cursor: pointer;
                    "
                    class="radius-border"
                    @click="onPickerClicked"
                >
                    <span class="setting-content">
                        {{ preference.appLibFolder }}
                    </span>
                </div>
            </div>
        </div>
        <div class="row setting-title" style="text-align: left !important">
            <i>
                * A empty folder
                isn't allowed here due to the limitation of the development
                framework. Please create a temporary file inside the selected
                folder first if there is nothing inside. *
            </i>
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
                    v-model="preference.deleteSourceFile"
                    @update:model-value="onToggleDeleteSourceFile"
                />
            </div>
        </div>
    </q-tab-panel>
</template>

<style lang="sass">
@import 'src/css/settingview.scss'
</style>

<script>
import { defineComponent, ref, toRefs } from "vue";

export default defineComponent({
    name: "GeneralTab",
    props: {
        preference: Object,
    },
    setup(props, { emit }) {

        const folderPicker = ref(null);

        const onPickerClicked = () => {
            folderPicker.value.pickFiles();
        };

        const onFolderConfirmed = (file) => {
            let newFolderPath = file.path.split("/").slice(0, -1).join("/");
            window.api.updatePreference("appLibFolder", newFolderPath);
            window.api.openLib()
        };

        const onToggleDeleteSourceFile = (value) => {
            window.api.updatePreference("deleteSourceFile", value);
        };

        return {
            folderPicker,
            onPickerClicked,
            onFolderConfirmed,
            onToggleDeleteSourceFile,
            ...toRefs(props),
        };
    },
});
</script>
