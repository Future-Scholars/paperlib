<script setup lang="ts">
import { ref } from "vue";

const show = ref(false);

window.appInteractor.registerState("viewState.isModalShown", (value) => {
  show.value = value as boolean;
});
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-75"
    enter-from-class="transform opacity-0"
    enter-to-class="transform opacity-100"
    leave-active-class="transition ease-in duration-75"
    leave-from-class="transform opacity-100"
    leave-to-class="transform opacity-0"
  >
    <div
      id="modal-view"
      class="absolute w-full h-full top-0 left-0"
      v-show="show"
    ></div>
  </Transition>
</template>
