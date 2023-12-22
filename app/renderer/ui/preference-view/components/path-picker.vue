<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  type: {
    type: String,
    required: true,
  },
  pickedPath: {
    type: String,
    required: true,
  },
});
const emits = defineEmits(["event:picked-path"]);

const pickedPathRef = ref(props.pickedPath);

const onPickerClicked = async () => {
  let newPickedPath = "";
  if (props.type === "folder") {
    newPickedPath = (await PLMainAPI.fileSystemService.showFolderPicker())
      .filePaths[0];
  } else {
    newPickedPath = (await PLMainAPI.fileSystemService.showFilePicker())
      .filePaths[0];
  }

  if (newPickedPath) {
    pickedPathRef.value = newPickedPath;
    emits("event:picked-path", newPickedPath);
  }
};
</script>

<template>
  <div
    class="bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 hover:dark:bg-neutral-600 cursor-pointer rounded-md px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 mb-5"
    @click="onPickerClicked"
  >
    <span class="w-full"> {{ pickedPathRef }} </span>
  </div>
</template>
