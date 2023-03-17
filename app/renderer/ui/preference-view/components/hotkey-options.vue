<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  choosedKey: {
    type: String,
    required: true,
  },
});

// From a to z and 0 to 9
const baseKeys = ref({
  none: "none",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  E: "E",
  F: "F",
  G: "G",
  H: "H",
  I: "I",
  J: "J",
  K: "K",
  L: "L",
  M: "M",
  N: "N",
  O: "O",
  P: "P",
  Q: "Q",
  R: "R",
  S: "S",
  T: "T",
  U: "U",
  V: "V",
  W: "W",
  X: "X",
  Y: "Y",
  Z: "Z",
  0: "0",
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  Enter: "Enter",
});

const keyPart = props.choosedKey.split("+");

const key = ref(keyPart.pop() || "none");
let modifier1 = ref("none");
let modifier2 = ref("none");
if (keyPart.length > 1) {
  modifier2.value = keyPart.pop() || "none";
}
if (keyPart.length > 0) {
  modifier1.value = keyPart.pop() || "none";
}

const emit = defineEmits(["update"]);
</script>

<template>
  <div class="flex justify-between">
    <div class="flex flex-col my-auto">
      <div class="text-xs font-semibold">{{ title }}</div>
    </div>
    <div class="flex space-x-2">
      <div
        class="flex bg-neutral-200 dark:bg-neutral-700 rounded-md w-28 h-6"
        :class="modifier1 === 'none' ? 'opacity-50' : ''"
      >
        <select
          id="countries"
          class="bg-gray-50 cursor-pointer border text-xxs border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          @change="
            (e) => {
              // @ts-ignore
              modifier1 = e.target.value;
              emit('update', `${modifier1}+${modifier2}+${key}`);
            }
          "
        >
          <option :selected="modifier1 === 'none'" value="none">none</option>
          <option
            :selected="modifier1 === 'CommandOrControl'"
            value="CommandOrControl"
          >
            CMD / CTRL
          </option>
        </select>
      </div>
      <div
        class="flex bg-neutral-200 dark:bg-neutral-700 rounded-md w-28 h-6"
        :class="modifier2 === 'none' ? 'opacity-50' : ''"
      >
        <select
          id="countries"
          class="bg-gray-50 cursor-pointer border text-xxs border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          @change="
            (e) => {
              // @ts-ignore
              modifier2 = e.target.value;
              emit('update', `${modifier1}+${modifier2}+${key}`);
            }
          "
        >
          <option :selected="modifier2 === 'none'" value="none">none</option>
          <option :selected="modifier2 === 'Shift'" value="Shift">Shift</option>
        </select>
      </div>
      <div
        class="flex bg-neutral-200 dark:bg-neutral-700 rounded-md w-28 h-6"
        :class="key === 'none' ? 'opacity-50' : ''"
      >
        <select
          id="countries"
          class="bg-gray-50 cursor-pointer border text-xxs border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          @change="
            (e) => {
              // @ts-ignore
              key = e.target.value;
              emit('update', `${modifier1}+${modifier2}+${key}`);
            }
          "
        >
          <option
            :value="v"
            :selected="key === k"
            v-for="[k, v] of Object.entries(baseKeys)"
          >
            {{ k }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>
