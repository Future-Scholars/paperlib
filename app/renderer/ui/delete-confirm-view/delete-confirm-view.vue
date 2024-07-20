<script setup lang="ts">
import { disposable } from "@/base/dispose";
import { useCreateDeleteConfirmView } from "./useDeleteConfirmView.ts";

const { onResolve, onReject } = useCreateDeleteConfirmView();

// ======================
// Event Handler
// ======================

const onCancel = () => {
  onReject();
};

const onConfirm = () => {
  onResolve();
};

disposable(
  shortcutService.updateWorkingViewScope(shortcutService.viewScope.OVERLAY)
);

disposable(shortcutService.register("Escape", onCancel));
disposable(shortcutService.register("Enter", onConfirm));
</script>

<template>
  <div
    id="modal-view"
    class="absolute w-full h-full top-0 left-0"
    @click="onCancel"
  >
    <div
      class="fixed top-0 right-0 left-0 z-50 w-screen h-screen bg-neutral-800 bg-opacity-50 dark:bg-neutral-900 dark:bg-opacity-80 dark:text-neutral-300"
      @click.stop="onCancel"
    >
      <div class="flex flex-col justify-center items-center w-full h-full">
        <div
          class="m-auto flex flex-col justify-between px-2 pt-3 pb-4 border-[1px] dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 w-60 rounded-lg shadow-lg select-none space-y-5"
          @click.stop=""
        >
          <div>
            <img
              class="mx-auto mt-2 w-14 h-14"
              src="@/renderer/assets/icon.png"
            />
            <div class="mt-1 text-center text-sm font-semibold">
              {{ $t("confirmation.title") }}
            </div>
            <div class="text-xxs mt-4 px-2 text-center overflow-hidden">
              {{ $t("confirmation.message") }}
            </div>
          </div>

          <div class="flex justify-between px-4">
            <div
              class="flex h-6 rounded-md bg-neutral-300 dark:bg-neutral-600 hover:shadow-sm w-20"
              @click.stop="onCancel"
            >
              <span class="m-auto text-xs">
                {{ $t("confirmation.cancel") }}
              </span>
            </div>
            <div
              id="delete-confirm-btn"
              class="flex h-6 rounded-md bg-accentlight dark:bg-accentdark hover:shadow-sm w-20"
              @click.stop="onConfirm"
            >
              <span class="m-auto text-xs text-white">
                {{ $t("confirmation.ok") }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
