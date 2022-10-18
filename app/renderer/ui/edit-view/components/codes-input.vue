<script setup lang="ts">
import { BIconDashCircle, BIconPlusLg } from "bootstrap-icons-vue";
import { ref } from "vue";

const props = defineProps({
  codes: {
    type: Object as () => Array<string>,
    required: true,
  },
});

const codes = ref(props.codes.map((code) => JSON.parse(code)));
console.log(codes);
const emit = defineEmits(["changed"]);

const onInput = (payload: Event, index: number, key: string) => {
  let value;
  if (key === "url") {
    value = (payload.target as HTMLInputElement).value;
  } else {
    value = (payload.target as HTMLInputElement).checked;
  }
  codes.value[index][key] = value;
  emit(
    "changed",
    codes.value.map((code) => JSON.stringify(code))
  );
};

const onAddClicked = () => {
  codes.value.unshift({
    code: "",
    name: "",
  });
};

const onDeleteClicked = (index: number) => {
  codes.value.splice(index, 1);
  emit(
    "changed",
    codes.value.map((code) => JSON.stringify(code))
  );
};
</script>

<template>
  <div
    class="flex flex-col rounded-md px-3 py-1 bg-neutral-200 dark:bg-neutral-700"
  >
    <div class="flex justify-between">
      <label class="text-xxs text-neutral-500 dark:text-neutral-400">
        {{ $t("mainview.codes") }}
      </label>

      <BIconPlusLg
        class="text-xs my-auto cursor-pointer"
        @click="onAddClicked"
      />
    </div>
    <div class="overflow-scroll">
      <div
        v-for="(code, index) in codes"
        :key="index"
        class="flex space-x-2 bg-neutral-300 dark:bg-neutral-600 rounded-md px-2 py-1 my-1"
      >
        <div class="flex flex-col grow">
          <label class="text-xxs text-neutral-500 dark:text-neutral-400">
            URL
          </label>
          <input
            type="text"
            class="text-xs dark:text-neutral-300 bg-transparent border-none focus:outline-none"
            :value="code.url"
            @input="(payload) => onInput(payload, index, 'url')"
          />
        </div>
        <div class="flex flex-col w-12">
          <label class="text-xxs text-neutral-500 dark:text-neutral-400">
            Official
          </label>
          <input
            type="checkbox"
            class="text-xs dark:text-neutral-300 bg-transparent border-none focus:outline-none"
            :checked="code.isOfficial"
            @change="(payload) => onInput(payload, index, 'isOfficial')"
          />
        </div>
        <div
          class="flex w-3 hover:text-neutral-800 dark:hover:text-neutral-100 cursor-pointer"
          @click="onDeleteClicked(index)"
        >
          <BIconDashCircle class="my-auto" />
        </div>
      </div>
    </div>
  </div>
</template>
