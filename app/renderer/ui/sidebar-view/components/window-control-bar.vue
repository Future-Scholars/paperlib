<script setup lang="ts">
import { Process } from "@/base/process-id";
import { BIconDash, BIconPlus, BIconX } from "bootstrap-icons-vue";

const onCloseClicked = () => {
  PLMainAPI.windowProcessManagementService.close(Process.renderer);
};

const onMinimizeClicked = () => {
  PLMainAPI.windowProcessManagementService.minimize(Process.renderer);
};

const onMaximizeClicked = () => {
  PLMainAPI.windowProcessManagementService.maximize(Process.renderer);
};
</script>

<template>
  <div class="flex w-full h-12 p-5 space-x-2 draggable-title">
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
