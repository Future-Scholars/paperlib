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
 * This is updated periodically to reflect the current zoom level of the renderer.
 */
const state = reactive({
  zoomFactor: 1,
});

/**
 * Interval ID for the zoom factor polling timer.
 * Used to clear the interval when the component is unmounted.
 */
let intervalId: number | null = null;

onMounted(() => {
  let webFrame: any = null;
  try {
    // Try to get Electron's webFrame module from the renderer process.
    // This is used to read the current zoom factor.
    // @ts-ignore
    webFrame = window.require ? window.require("electron").webFrame : null;
  } catch (e) {
    webFrame = null;
  }
  if (!webFrame) return;

  /**
   * Updates the zoom factor and applies a reverse scale transform
   * to the window control bar so that its size remains constant
   * regardless of the page zoom level.
   */
  const updateZoom = () => {
    // Get the current zoom factor from Electron's webFrame.
    const factor = webFrame.getZoomFactor ? webFrame.getZoomFactor() : 1;
    state.zoomFactor = factor;
    if (barRef.value) {
      // Apply a reverse scale transform to counteract the page zoom.
      barRef.value.style.transform = `scale(${1 / factor})`;
      // Set the transform origin to the top left so the bar stays in place.
      barRef.value.style.transformOrigin = "top left";
    }
  };

  // Initialize the zoom factor and apply the transform immediately.
  updateZoom();

  // Set up a polling interval to check for zoom changes every 200ms.
  // Electron does not provide a zoom change event, so polling is necessary.
  intervalId = window.setInterval(updateZoom, 200);
});

onBeforeUnmount(() => {
  // Clean up the polling interval when the component is destroyed.
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
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
