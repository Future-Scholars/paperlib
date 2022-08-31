<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  title: String,
  info: String,
  cancelBtn: Boolean,
  okBtn: Boolean,
});

const show = ref(false);

window.appInteractor.registerState("viewState.isModalShown", (value) => {
  show.value = value as boolean;
});

const onClick = () => {
  window.appInteractor.setState("viewState.isModalShown", false);
};

const emit = defineEmits(["confirm", "cancel"]);

const keyDownListener = (e: KeyboardEvent) => {
  e.preventDefault();
  if (e.key === "Enter") {
    onConfirm();
  } else if (e.key === "Escape") {
    onCancel();
  }
};

document.addEventListener("keydown", keyDownListener, { once: true });

const onCancel = () => {
  onClick();
};

const onConfirm = () => {
  emit("confirm");
};
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
      @click="onClick"
    >
      <div
        class="fixed top-0 right-0 left-0 z-50 w-screen h-screen bg-neutral-800 bg-opacity-50 dark:bg-neutral-900 dark:bg-opacity-80 dark:text-neutral-300"
        @click.stop="onCancel"
      >
        <div class="flex flex-col justify-center items-center w-full h-full">
          <div
            class="m-auto flex flex-col justify-between px-3 pt-3 pb-4 border-[1px] dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 w-64 rounded-lg shadow-lg select-none space-y-5"
            @click.stop=""
          >
            <div>
              <img class="mx-auto mt-2 w-16 h-16" src="../assets/icon.png" />
              <div class="mt-1 text-center text-sm font-semibold">
                {{ title }}
              </div>
              <div class="text-xxs mt-4 px-2 text-center overflow-hidden">
                {{ info }}
              </div>
            </div>

            <div class="flex justify-between px-2">
              <div
                class="flex h-8 rounded-lg bg-neutral-300 dark:bg-neutral-600 hover:shadow-sm"
                :class="okBtn ? 'w-24' : 'w-full'"
                @click.stop="onCancel"
                v-if="cancelBtn"
              >
                <span class="m-auto text-xs">Cancel</span>
              </div>
              <div
                class="flex h-8 rounded-lg bg-accentlight dark:bg-accentdark hover:shadow-sm"
                :class="cancelBtn ? 'w-24' : 'w-full'"
                @click.stop="onConfirm"
                v-if="okBtn"
              >
                <span class="m-auto text-xs text-white">OK</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
