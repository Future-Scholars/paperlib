<script setup lang="ts">
import Input from "./Input.vue";
import PathPicker from "./path-picker.vue";
import Select from "./select.vue";
import Toggle from "./toggle.vue";
import Button from "./button.vue";

const props = defineProps({
  pref: {
    type: Object as () => {
      name: string;
      description: string;
      type: string;
      value: any;
      options?: Record<string, string>;
    },
    required: true,
  },
  name: { type: String, required: true },
});

const emits = defineEmits(["event:change"]);

const onButtonClick = () => {
  PLAPI.logService.info(
    props.name,
    `${props.pref?.name} and will take effect the next time you open AiChat.`,
    true
  );
  emits("event:change", true);
};
</script>

<template>
  <div class="flex flex-col space-y-6">
    <div class="flex flex-col space-y-1" v-if="pref.type === 'pathpicker'">
      <div class="flex flex-col">
        <div class="text-xs font-semibold">{{ pref.name }}</div>
        <div class="text-xxs text-neutral-600 dark:text-neutral-500">
          {{ pref.description }}
        </div>
      </div>
      <PathPicker
        class="h-8"
        type="folder"
        :picked-path="pref.value as string"
        @event:picked-path="
          (value) => {
            emits('event:change', value);
          }
        "
      />
    </div>

    <Toggle
      :title="pref.name"
      :info="pref.description"
      :enable="pref.value as boolean"
      v-if="pref.type === 'boolean'"
      @event:change="
        (value) => {
          emits('event:change', value);
        }
      "
    />
    <Input
      :title="pref.name"
      :info="pref.description"
      :value="(pref.value as string)"
      placeholder=""
      type="text"
      :show-saving-status="true"
      v-if="pref.type === 'string'"
      @event:submit="
        (value) => {
          emits('event:change', value);
        }
      "
    />
    <Select
      :title="pref.name"
      :info="pref.description"
      :selected="pref.value as string"
      :options="pref.options as Record<string, string>"
      v-if="pref.type === 'options'"
      @event:change="
        (value) => {
          emits('event:change', value);
        }
      "
    />
    <Button
      :title="pref.name"
      :info="pref.description"
      v-if="pref.type === 'button'"
      @event:change="onButtonClick"
    />
  </div>
</template>
