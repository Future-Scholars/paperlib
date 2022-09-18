<script setup lang="ts">
import {
  BIconArrowBarUp,
  BIconExclamationTriangle,
  BIconInfoCircle,
} from "bootstrap-icons-vue";
import { Ref, ref, watch } from "vue";

import { MainRendererStateStore } from "@/state/renderer/appstate";

const logState = MainRendererStateStore.useLogState();
const viewState = MainRendererStateStore.useViewState();

const isShown = ref(false);
const isHistoryShown = ref(false);
const historyMsgs = ref([]) as Ref<Array<Record<string, string | boolean>>>;
const historyProgresses = ref([]) as Ref<
  Array<Record<string, number | string | boolean>>
>;

watch(
  () => viewState.processingQueueCount,
  (value) => {
    if (value > 0) {
      isShown.value = true;
    } else {
      isShown.value = false;
    }
  }
);

const pushMsgToHistory = (type: string, msg: string) => {
  if (msg) {
    historyMsgs.value.push({
      type: type,
      msg: `${new Date().getHours().toString().padStart(2, "0")}:${new Date()
        .getMinutes()
        .toString()
        .padStart(2, "0")} ${msg}`,
      forceShow: type === "warning",
    });
    if (historyMsgs.value.length > 20) {
      historyMsgs.value.shift();
    }
  }
};

watch(
  () => logState.processLog,
  (value) => {
    pushMsgToHistory("info", value);
  }
);

watch(
  () => logState.alertLog,
  (value) => {
    pushMsgToHistory("warning", value as string);
    isHistoryShown.value = true;
    debounce(() => {
      isHistoryShown.value = false;
      historyMsgs.value = historyMsgs.value.map((msg) => {
        msg.forceShow = false;
        return msg;
      });
    }, 3000)();
  }
);

const pushProgressToHistory = (
  progress: Record<string, number | string | boolean>
) => {
  for (let i = 0; i < historyProgresses.value.length; i++) {
    if (historyProgresses.value[i].id === progress.id) {
      historyProgresses.value[i] = progress;

      if (progress.value === 100) {
        historyProgresses.value.splice(i, 1);
      }

      return;
    }
  }
  historyProgresses.value.push(progress);
};

watch(
  () => logState.progressLog,
  (value) => {
    pushProgressToHistory(value);
    isHistoryShown.value = true;
    debounce(() => {
      isHistoryShown.value = false;
    }, 3000)();
  },
  { deep: true }
);

const timeoutID = ref();
const debounce = (fn: Function, delay: number) => {
  return () => {
    clearTimeout(timeoutID.value);
    // @ts-ignore
    var that = this;
    timeoutID.value = setTimeout(function () {
      fn.apply(that, null);
    }, delay);
  };
};

const onClicked = () => {
  isHistoryShown.value = !isHistoryShown.value;
  historyMsgs.value = historyMsgs.value.map((msg) => {
    msg.forceShow = true;
    return msg;
  });
  debounce(() => {
    isHistoryShown.value = false;
  }, 4000)();
};

const onEnter = () => {
  clearTimeout(timeoutID.value);
};

const onLeave = () => {
  debounce(() => {
    isHistoryShown.value = false;
    historyMsgs.value = historyMsgs.value.map((msg) => {
      msg.forceShow = false;
      return msg;
    });
  }, 2000)();
};
</script>

<template>
  <div class="flex w-full h-8 cursor-pointer">
    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <div
        class="flex flex-col justify-end fixed top-0 space-y-1 h-full pl-3 pb-8 w-64 pointer-events-none overflow-auto"
        v-show="isHistoryShown"
      >
        <div
          class="flex text-xxs p-1 px-2 rounded-md shadow-md text-neutral-500 bg-neutral-300 dark:text-neutral-300 dark:bg-neutral-700 backdrop-blur-xl space-x-2 pointer-events-auto"
          v-for="historyMsg of historyMsgs"
          v-show="historyMsg.forceShow"
          @mouseleave="onLeave"
          @mouseenter="onEnter"
        >
          <div class="w-2 my-auto">
            <BIconExclamationTriangle
              class="my-auto text-red-600"
              v-if="historyMsg.type === 'warning'"
            />
            <BIconInfoCircle
              class="my-auto"
              v-if="historyMsg.type === 'info'"
            />
          </div>
          <span
            class="my-auto truncate hover:whitespace-normal"
            :class="historyMsg.type === 'warning' ? 'text-red-600' : ''"
            >{{ historyMsg.msg }}</span
          >
        </div>
        <div
          class="flex flex-col text-xxs py-1 px-2 rounded-md shadow-md text-neutral-500 bg-neutral-300 dark:text-neutral-300 dark:bg-neutral-700 backdrop-blur-xl space-y-1 pointer-events-auto"
          v-for="progress of historyProgresses"
        >
          <div class="my-auto">{{ progress.msg }}</div>
          <div class="rounded-full h-0.5">
            <div
              class="bg-accentlight h-0.5 rounded-full dark:bg-accentdark"
              :style="`width: ${progress.value}%`"
            ></div>
          </div>
        </div>
      </div>
    </Transition>
    <div class="w-1/12"></div>
    <div
      class="flex justify-center my-auto w-5/6 h-8 truncate text-center text-xxs text-neutral-500 peer"
      @click="onClicked"
    >
      <span class="my-auto" v-show="isShown"> {{ logState.processLog }}</span>
    </div>
    <BIconArrowBarUp
      class="text-neutral-500 w-1/12 my-auto text-xs invisible peer-hover:visible"
    />
  </div>
</template>
