<script setup lang="ts">
import { ipcRenderer } from "electron";

const render = async (fileURL: string) => {
  await window.renderInteractor.render(fileURL);
};

ipcRenderer.on("preview-file", (event, fileURL) => {
  render(fileURL);
});
</script>

<template>
  <canvas id="preview-canvas" class="w-full h-full" />
</template>
