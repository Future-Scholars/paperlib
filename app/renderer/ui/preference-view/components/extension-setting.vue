<script setup lang="ts">
import Input from "./Input.vue";
import PathPicker from "./path-picker.vue";
import Select from "./select.vue";
import Toggle from "./toggle.vue";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Boolean, Number, Object, Array],
    required: true,
  },
  options: {
    type: Object as () => Record<string, string>,
    required: false,
  },
});

const emits = defineEmits(["event:change"]);
</script>

<template>
  <div class="flex flex-col space-y-6">
    <div class="flex flex-col space-y-1" v-if="type === 'pathpicker'">
      <div class="flex flex-col">
        <div class="text-xs font-semibold">{{ title }}</div>
        <div class="text-xxs text-neutral-600 dark:text-neutral-500">
          {{ description }}
        </div>
      </div>
      <PathPicker
        class="h-8"
        type="folder"
        :picked-path="value as string"
        @event:picked-path="
          (value) => {
            emits('event:change', value);
          }
        "
      />
    </div>

    <Toggle
      :title="title"
      :info="description"
      :enable="value as boolean"
      v-if="type === 'boolean'"
      @event:change="
        (value) => {
          emits('event:change', value);
        }
      "
    />
    <Input
      :title="title"
      :info="description"
      :value="(value as string)"
      placeholder=""
      type="text"
      v-if="type === 'string'"
      @event:change="
        (value) => {
          emits('event:change', value);
        }
      "
    />
    <Select
      :title="title"
      :info="description"
      :selected="value as string"
      :options="options as Record<string, string>"
      v-if="type === 'options'"
      @event:change="
        (value) => {
          emits('event:change', value);
        }
      "
    />
  </div>
</template>
