<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, reactive } from "vue";
import { Process } from "@/base/process-id";
import { BIconDash, BIconPlus, BIconX } from "bootstrap-icons-vue";

/**
 * Handles the close button click event.
 */
const onCloseClicked = () => {
  PLMainAPI.windowProcessManagementService.close(Process.renderer);
};

/**
 * Handles the minimize button click event.
 */
const onMinimizeClicked = () => {
  PLMainAPI.windowProcessManagementService.minimize(Process.renderer);
};

/**
 * Handles the maximize button click event.
 */
const onMaximizeClicked = () => {
  PLMainAPI.windowProcessManagementService.maximize(Process.renderer);
};

/**
 * Reference to the window control bar DOM element.
 * This will be used to apply a reverse scale transform so that
 * the window control buttons do not scale with the rest of the page content.
 */
const barRef = ref<HTMLElement | null>(null);

/**
 * State object to store the current zoom factor.
 * This is updated when the zoom level changes in the renderer.
 */
const state = reactive({
  zoomFactor: 1,
});

onMounted(() => {
  let webFrame: any = null;
  try {
    // Try to get Electron's webFrame module from the renderer process
    // @ts-ignore
    webFrame = window.require ? window.require("electron").webFrame : null;
  } catch (e) {
    webFrame = null;
  }
  if (!webFrame) return;

  // Function to update the scale based on current zoom factor
  const updateScale = () => {
    const zoomFactor = webFrame.getZoomFactor ? webFrame.getZoomFactor() : 1;
    state.zoomFactor = zoomFactor;
    if (barRef.value) {
      const scaleValue = 1 / zoomFactor;
      barRef.value.style.transform = `scale(${scaleValue})`;
      barRef.value.style.transformOrigin = "top left";
    }
  };

  // Get initial zoom factor and apply scale
  updateScale();

  // Listen for zoom change notifications from the main process
  // @ts-ignore
  window.require("electron").ipcRenderer.on("zoom-did-change", () => {
    // When notified, get the current zoom factor directly and update scale
    updateScale();
  });
});

onBeforeUnmount(() => {
  // Clean up the zoom-did-change event listener
  try {
    // @ts-ignore
    window.require("electron").ipcRenderer.removeAllListeners("zoom-did-change");
  } catch (e) {
    // Ignore errors if electron is not available
  }
});
</script>

<template>
  <div
    class="flex w-full h-12 p-5 space-x-2 draggable-title"
    ref="barRef"
  >
    <div
      id="window-close-btn"
      class="group w-3 h-3 rounded-md bg-red-400 nodraggable-item"
      @click="onCloseClicked"
    >
      <BIconX class="group-hover:visible invisible w-3 h-3 text-gray-700" />
    </div>
    <div
      id="window-minimize-btn"
      class="group w-3 h-3 rounded-md bg-yellow-500 nodraggable-item"
      @click="onMinimizeClicked"
    >
      <BIconDash class="group-hover:visible invisible w-3 h-3 text-gray-700" />
    </div>
    <div
      id="window-maximize-btn"
      class="group w-3 h-3 rounded-md bg-green-500 nodraggable-item"
      @click="onMaximizeClicked"
    >
      <BIconPlus class="group-hover:visible invisible w-3 h-3 text-gray-700" />
    </div>
    <i class="bi-alarm"></i>
  </div>
</template>
