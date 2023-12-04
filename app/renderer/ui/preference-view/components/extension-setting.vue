<script setup lang="ts">
import Input from "./Input.vue";
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

const emit = defineEmits(["update"]);
</script>

<template>
  <div>
    <Toggle
      :title="title"
      :info="description"
      :enable="value as boolean"
      v-if="type === 'boolean'"
      @update="
        (value) => {
          emit('update', value);
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
      @update="
        (value) => {
          emit('update', value);
        }
      "
    />
    <Select
      :title="title"
      :info="description"
      :selected="value as string"
      :options="options as Record<string, string>"
      v-if="type === 'options'"
      @update="
        (value) => {
          emit('update', value);
        }
      "
    />
  </div>
</template>
