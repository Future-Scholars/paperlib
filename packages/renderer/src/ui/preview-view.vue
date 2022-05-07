<script setup lang="ts">
const render = async (fileURL: string) => {
  await window.renderInteractor.render(fileURL);
};
</script>

<template>
  <canvas id="preview-canvas" class="w-full h-full" />
</template>
