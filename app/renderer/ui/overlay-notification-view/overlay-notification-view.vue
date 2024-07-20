<script setup lang="ts">
// ======================
// State
// ======================
const uiSlotState = PLUIAPILocal.uiSlotService.useState();

// ======================
// Event Handler
// ======================
const onClick = () => {
  PLUIAPILocal.uiStateService.setUIState({
    overlayNoticationShown: false,
  });
};
</script>

<template>
  <div
    id="overlay-notification-view"
    class="absolute w-full h-full top-0 left-0"
  >
    <div
      class="flex flex-col justify-center items-center w-full h-full bg-neutral-800 bg-opacity-50 dark:bg-neutral-900 dark:bg-opacity-80 dark:text-neutral-300"
    >
      <div
        class="m-auto flex flex-col justify-between px-6 py-6 border-[1px] dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 w-[80%] h-[80%] rounded-lg shadow-lg select-none space-y-5"
      >
        <div class="mx-auto font-semibold text-xl flex-none">Notifications</div>
        <div class="grow overflow-scroll">
          <div
            v-for="notification in uiSlotState.overlayNotifications"
            class="flex flex-col p-2 border-t-[1px] space-y-1"
          >
            <div class="flex space-x-2">
              <div class="bg-accentlight rounded-md w-1 h-4 my-auto"></div>
              <div class="font-semibold my-auto">{{ notification.title }}</div>
            </div>
            <div class="pl-3 text-sm" v-html="notification.content"></div>
          </div>
        </div>
        <div
          id="delete-confirm-btn"
          class="flex h-6 rounded-md bg-neutral-300 dark:bg-neutral-500 dark:text-neutral-300 hover:shadow-sm w-20 mx-auto flex-none"
          @click.stop="onClick"
        >
          <span class="m-auto text-xs">
            {{ $t("confirmation.ok") }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
