<script setup lang="ts">
import { BIconPlus, BIconDash, BIconX } from "bootstrap-icons-vue";

const onCloseClicked = () => {
  window.appInteractor.close();
};

const onMinimizeClicked = () => {
  window.appInteractor.minimize();
};

const onMaximizeClicked = () => {
  window.appInteractor.maximize();
};
</script>

<template>
  <div class="flex w-full h-12 p-5 space-x-2 draggable-title">
    <div class="group w-3 h-3 rounded-md bg-red-400" @click="onCloseClicked">
      <BIconX class="group-hover:visible invisible w-3 h-3 text-gray-700" />
    </div>
    <div
      class="group w-3 h-3 rounded-md bg-yellow-500"
      @click="onMinimizeClicked"
    >
      <BIconDash class="group-hover:visible invisible w-3 h-3 text-gray-700" />
    </div>
    <div
      class="group w-3 h-3 rounded-md bg-green-500"
      @click="onMaximizeClicked"
    >
      <BIconPlus class="group-hover:visible invisible w-3 h-3 text-gray-700" />
    </div>
    <i class="bi-alarm"></i>
  </div>
</template>
