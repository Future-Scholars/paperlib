<script setup lang="ts">
import {
  BIconArrowCounterclockwise,
  BIconTrash,
  BIconPencilSquare,
  BIconFlag,
  BIconTags,
  BIconFolderPlus,
  BIconCardText,
  BIconListUl,
  BIconGrid3x2,
  BIconGear,
  BIconFonts,
  BIconPerson,
  BIconCalendar3,
  BIconBook,
  BIconClock,
  BIconSortDown,
  BIconSortUp,
  BIconFilterRight,
} from "bootstrap-icons-vue";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";

const emit = defineEmits(["click"]);
</script>

<template>
  <div class="flex w-full h-12 px-4 justify-between space-x-2 draggable-title">
    <div class="w-3 h-3 my-auto">
      <BIconGear class="text-sm text-gray-700" />
    </div>
    <div class="flex space-x-1 my-auto">
      <button
        class="flex w-7 h-6 rounded-md hover:bg-neutral-200"
        @click="emit('click', 'rescrape')"
      >
        <BIconArrowCounterclockwise class="text-sm m-auto text-neutral-700" />
      </button>
      <button
        class="flex w-7 h-6 rounded-md hover:bg-neutral-200"
        @click="emit('click', 'delete')"
      >
        <BIconTrash class="text-sm m-auto text-neutral-700" />
      </button>
      <button
        class="flex w-7 h-6 rounded-md hover:bg-neutral-200"
        @click="emit('click', 'edit')"
      >
        <BIconPencilSquare class="text-sm m-auto text-neutral-700" />
      </button>
      <button
        class="flex w-7 h-6 rounded-md hover:bg-neutral-200"
        @click="emit('click', 'flag')"
      >
        <BIconFlag class="text-sm m-auto text-neutral-700" />
      </button>
      <button
        class="flex w-7 h-6 rounded-md hover:bg-neutral-200"
        @click="emit('click', 'tag')"
      >
        <BIconTags class="text-sm m-auto text-neutral-700" />
      </button>
      <button
        class="flex w-7 h-6 rounded-md hover:bg-neutral-200"
        @click="emit('click', 'folder')"
      >
        <BIconFolderPlus class="text-sm m-auto text-neutral-700" />
      </button>
      <button
        class="flex w-7 h-6 rounded-md hover:bg-neutral-200"
        @click="emit('click', 'note')"
      >
        <BIconCardText class="text-sm m-auto text-neutral-700" />
      </button>
      <div class="flex px-2">
        <button
          class="flex w-7 h-6 rounded-md hover:bg-neutral-200"
          @click="emit('click', 'list-view')"
        >
          <BIconListUl class="text-sm m-auto text-neutral-700" />
        </button>
        <button
          class="flex w-7 h-6 rounded-md hover:bg-neutral-200"
          @click="emit('click', 'table-view')"
        >
          <BIconGrid3x2 class="text-sm m-auto text-neutral-700" />
        </button>
      </div>

      <Menu as="div" class="relative inline-block text-left">
        <div>
          <MenuButton
            class="inline-flex justify-center w-7 h-6 rounded-md hover:bg-neutral-200 cursor-default"
          >
            <BIconFilterRight class="text-sm m-auto text-neutral-700" />
          </MenuButton>
        </div>

        <transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="transform opacity-0 scale-95"
          enter-to-class="transform opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="transform opacity-100 scale-100"
          leave-to-class="transform opacity-0 scale-95"
        >
          <MenuItems
            class="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg p-1 text-xs bg-white divide-y focus:outline-none"
          >
            <div class="py-1">
              <MenuItem
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200"
                @click="emit('click', 'sort-by-title')"
              >
                <div class="flex space-x-2 px-2">
                  <BIconFonts class="my-auto" />
                  <span>Title</span>
                </div>
              </MenuItem>
              <MenuItem
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200"
                @click="emit('click', 'sort-by-authors')"
              >
                <div class="flex space-x-2 px-2">
                  <BIconPerson class="my-auto" />
                  <span>Authors</span>
                </div>
              </MenuItem>
              <MenuItem
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200"
                @click="emit('click', 'sort-by-year')"
              >
                <div class="flex space-x-2 px-2">
                  <BIconCalendar3 class="my-auto" />
                  <span>Year</span>
                </div>
              </MenuItem>
              <MenuItem
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200"
                @click="emit('click', 'sort-by-publication')"
              >
                <div class="flex space-x-2 px-2">
                  <BIconBook class="my-auto" />
                  <span>Publication</span>
                </div>
              </MenuItem>
              <MenuItem
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200"
                @click="emit('click', 'sort-by-addTime')"
              >
                <div class="flex space-x-2 px-2">
                  <BIconClock class="my-auto" />
                  <span>Add Time</span>
                </div>
              </MenuItem>
            </div>
            <div class="py-1">
              <MenuItem
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200"
                @click="emit('click', 'sort-desc')"
              >
                <div class="flex space-x-2 px-2">
                  <BIconSortDown class="my-auto" />
                  <span>Descending</span>
                </div>
              </MenuItem>
              <MenuItem
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200"
                @click="emit('click', 'sort-asce')"
              >
                <div class="flex space-x-2 px-2">
                  <BIconSortUp class="my-auto" />
                  <span>Ascending</span>
                </div>
              </MenuItem>
            </div>
          </MenuItems>
        </transition>
      </Menu>

      <div
        class="flex w-7 h-6 rounded-md hover:bg-neutral-200"
        @click="emit('click', 'preference')"
      >
        <BIconGear class="text-xs m-auto text-neutral-700" />
      </div>
    </div>
  </div>
</template>
