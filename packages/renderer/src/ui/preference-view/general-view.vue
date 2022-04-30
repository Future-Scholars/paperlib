<script setup lang="ts">
import { Switch } from "@headlessui/vue";
import { ref } from "vue";

const enabled = ref(false);
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
    <div class="flex flex-col w-full text-neutral-800">
      <div class="text-base font-semibold mb-4">Paperlib Library</div>
      <div class="text-xs font-semibold">Storage Folder</div>
      <div class="text-xxs text-neutral-600">
        Choose a folder to store paper files (e.g., PDF etc.) and the database
        files.
      </div>
      <div
        class="bg-neutral-200 hover:bg-neutral-300 cursor-pointer rounded-md px-3 py-2 text-xs text-neutral-700 mb-5"
      >
        <span> /User/lib/sdfsad/sdafsdaf/sdfasa </span>
      </div>

      <div class="flex justify-between">
        <div class="flex flex-col">
          <div class="text-xs font-semibold">Delete Source File</div>
          <div class="text-xxs text-neutral-600">
            Automatically delete the source file of the imported papers.
          </div>
        </div>
        <Switch
          v-model="enabled"
          :class="enabled ? 'bg-neutral-500' : 'bg-neutral-300'"
          class="my-auto relative inline-flex h-5 w-10 items-center rounded-full"
        >
          <span
            :class="enabled ? 'translate-x-5.5' : 'translate-x-0.5'"
            class="inline-block h-4 w-4 transform rounded-full bg-neutral-100"
          />
        </Switch>
      </div>

      <hr class="mt-5 mb-5" />
      <div class="text-base font-semibold mb-4">General Options</div>

      <div class="flex justify-between mb-5">
        <div class="flex flex-col">
          <div class="text-xs font-semibold">Color Theme</div>
          <div class="text-xxs text-neutral-600">
            Choose a theme for Paperlib UI.
          </div>
        </div>
        <div class="flex bg-neutral-200 rounded-md w-40">
          <div
            class="flex w-1/3 h-full my-auto text-center text-xs rounded-md hover:bg-neutral-300"
          >
            <span class="m-auto">Light</span>
          </div>
          <div
            class="flex w-1/3 h-full my-auto text-center text-xs rounded-md hover:bg-neutral-300"
          >
            <span class="m-auto">Dark</span>
          </div>
          <div
            class="flex w-1/3 h-full my-auto text-center text-xs rounded-md hover:bg-neutral-300"
          >
            <span class="m-auto"> System </span>
          </div>
        </div>
      </div>

      <div class="flex justify-between mb-5">
        <div class="flex flex-col">
          <div class="text-xs font-semibold">Invert Preview Color</div>
          <div class="text-xxs text-neutral-600">
            Invert PDF preview colors in the detail panel if the current theme
            is Dark.
          </div>
        </div>
        <Switch
          v-model="enabled"
          :class="enabled ? 'bg-neutral-500' : 'bg-neutral-300'"
          class="my-auto relative inline-flex h-5 w-10 items-center rounded-full"
        >
          <span
            :class="enabled ? 'translate-x-5.5' : 'translate-x-0.5'"
            class="inline-block h-4 w-4 transform rounded-full bg-neutral-100"
          />
        </Switch>
      </div>

      <div class="flex justify-between">
        <div class="flex flex-col">
          <div class="text-xs font-semibold">Display Count Number</div>
          <div class="text-xxs text-neutral-600">
            Show the count badges in the sidebar.
          </div>
        </div>
        <Switch
          v-model="enabled"
          :class="enabled ? 'bg-neutral-500' : 'bg-neutral-300'"
          class="my-auto relative inline-flex h-5 w-10 items-center rounded-full"
        >
          <span
            :class="enabled ? 'translate-x-5.5' : 'translate-x-0.5'"
            class="inline-block h-4 w-4 transform rounded-full bg-neutral-100"
          />
        </Switch>
      </div>
    </div>
  </Transition>
</template>
