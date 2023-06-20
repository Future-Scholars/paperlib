<script setup lang="ts">
import {
  BIconArrowBarUp,
  BIconBug,
  BIconExclamationTriangle,
  BIconInfoCircle,
} from "bootstrap-icons-vue";
import { Ref, ref, watch } from "vue";

import { disposable } from "@/base/dispose";
import { useProcessingState } from "@/renderer/services/state-service/processing";

const logState = logService.useState();
const processingState = useProcessingState();

const isShown = ref(false);
const showingInfo = ref("");

const historyMsgs = ref([]) as Ref<
  Array<{
    id: string;
    level: "info" | "warn" | "error" | "progress";
    msg: string;
    additional: string;
    value?: number;
    show: boolean;
  }>
>;

watch(
  () => processingState.general,
  (value) => {
    if (value > 0) {
      isShown.value = true;
    } else {
      isShown.value = false;
    }
  }
);

const pushMsgToHistory = (
  level: "info" | "warn" | "error" | "progress",
  logMessage: { id: string; msg: string; additional?: string; value?: number }
) => {
  const newMsg = {
    id: logMessage.id,
    level: level,
    msg: `${new Date().getHours().toString().padStart(2, "0")}:${new Date()
      .getMinutes()
      .toString()
      .padStart(2, "0")} [${
      logMessage.id === "default" ? "Paperlib" : logMessage.id
    }] ${logMessage.msg}`,
    additional: logMessage.additional || "",
    value: logMessage.value || 0,
    show: level === "warn" || level === "error" || level === "progress",
  };

  if (level === "info") {
    showingInfo.value =
      (logMessage.id === "default" ? "" : `[${logMessage.id}] `) +
      `${logMessage.msg}`;
  }

  if (level === "progress") {
    if (newMsg.value > 99) {
      historyMsgs.value = historyMsgs.value.filter(
        (msg) => msg.id !== newMsg.id
      );
    } else {
      let updated = false;
      for (const msg of historyMsgs.value) {
        if (msg.level === "progress" && msg.id === newMsg.id) {
          msg.value = newMsg.value;
          msg.show = true;
          updated = true;
        }
      }
      if (!updated) {
        historyMsgs.value.push(newMsg);
      }
    }
  } else {
    historyMsgs.value.push(newMsg);
  }

  if (historyMsgs.value.length > 5) {
    historyMsgs.value.shift();
  }
};

disposable(
  logService.on("infoLogMessage", (payload) => {
    pushMsgToHistory("info", payload.value);
  })
);

disposable(
  logService.on("warnLogMessage", (payload) => {
    pushMsgToHistory("warn", payload.value);
    debounce(() => {
      historyMsgs.value = historyMsgs.value.map((msg) => {
        msg.show = false;
        return msg;
      });
    }, 3000)();
  })
);

disposable(
  logService.on("errorLogMessage", (payload) => {
    pushMsgToHistory("error", payload.value);
    debounce(() => {
      historyMsgs.value = historyMsgs.value.map((msg) => {
        msg.show = false;
        return msg;
      });
    }, 3000)();
  })
);

disposable(
  logService.on("progressLogMessage", (payload) => {
    pushMsgToHistory("progress", payload.value);
  })
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
  historyMsgs.value = historyMsgs.value.map((msg) => {
    msg.show = true;
    return msg;
  });
  debounce(() => {
    historyMsgs.value = historyMsgs.value.map((msg) => {
      msg.show = false;
      return msg;
    });
  }, 2000)();
};

const onEnter = () => {
  clearTimeout(timeoutID.value);
};

const onLeave = () => {
  debounce(() => {
    historyMsgs.value = historyMsgs.value.map((msg) => {
      msg.show = false;
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
        v-show="historyMsgs.filter((msg) => msg.show).length > 0"
      >
        <div
          class="flex flex-col text-xxs py-1 px-2 rounded-md shadow-md text-neutral-500 bg-neutral-300 dark:text-neutral-300 dark:bg-neutral-700 backdrop-blur-xl space-x-2 pointer-events-auto"
          v-for="historyMsg of historyMsgs"
          v-show="historyMsg.show"
          @mouseleave="onLeave"
          @mouseenter="onEnter"
        >
          <div class="flex space-x-2">
            <div class="w-2 my-auto">
              <BIconBug
                class="my-auto text-red-600"
                v-if="historyMsg.level === 'error'"
              />
              <BIconExclamationTriangle
                class="my-auto text-yellow-600"
                v-if="historyMsg.level === 'warn'"
              />
              <BIconInfoCircle
                class="my-auto"
                v-if="
                  historyMsg.level === 'info' || historyMsg.level === 'progress'
                "
              />
            </div>
            <span class="my-auto truncate hover:whitespace-normal">{{
              historyMsg.msg
            }}</span>
          </div>
          <span
            class="truncate hover:whitespace-normal pl-2"
            v-if="historyMsg.additional !== ''"
            >{{ historyMsg.additional }}</span
          >
          <div
            class="rounded-full h-0.5 my-1 pl-2"
            v-if="historyMsg.level === 'progress'"
          >
            <div
              class="bg-accentlight h-0.5 rounded-full dark:bg-accentdark transition-all duration-100"
              :style="`width: ${historyMsg.value}%`"
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
      <span class="my-auto" v-show="isShown">
        {{ showingInfo }}
      </span>
    </div>
    <BIconArrowBarUp
      class="text-neutral-500 w-1/12 my-auto text-xs invisible peer-hover:visible"
    />
  </div>
</template>
@/renderer/services/state-service/processing
