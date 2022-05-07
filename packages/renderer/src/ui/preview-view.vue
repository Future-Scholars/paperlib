<script setup lang="ts">
window.quicklookInteractor.preview();

function shortcutHandler(event: KeyboardEvent) {
  if (event.code === "Escape") {
    event.preventDefault();
    window.quicklookInteractor.closePreview();
  }
}
window.addEventListener("keydown", shortcutHandler, true);
</script>

<template>
  <canvas id="preview-canvas" class="w-full h-full" />
</template>
