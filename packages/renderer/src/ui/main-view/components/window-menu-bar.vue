<script setup lang="ts">
import {
  BIconArrowCounterclockwise,
  BIconTrash,
  BIconPencilSquare,
  BIconFlag,
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
  BIconCheck2,
} from "bootstrap-icons-vue";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";

const props = defineProps({
  sortBy: {
    type: String,
    required: true,
  },
  sortOrder: {
    type: String,
    required: true,
  },
});

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

      <Menu as="div" class="relative inline-block text-left z-50">
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
            <div class="pb-1">
              <MenuItem
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200"
                @click="emit('click', 'sort-by-title')"
              >
                <div class="flex justify-between px-2">
                  <div class="flex space-x-2">
                    <BIconFonts class="my-auto" />
                    <span>Title</span>
                  </div>
                  <BIconCheck2 class="my-auto" v-if="sortBy === 'title'" />
                </div>
              </MenuItem>
              <MenuItem
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200"
                @click="emit('click', 'sort-by-authors')"
              >
                <div class="flex justify-between px-2">
                  <div class="flex space-x-2">
                    <BIconPerson class="my-auto" />
                    <span>Authors</span>
                  </div>
                  <BIconCheck2 class="my-auto" v-if="sortBy === 'authors'" />
                </div>
              </MenuItem>
              <MenuItem
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200"
                @click="emit('click', 'sort-by-pubTime')"
              >
                <div class="flex justify-between px-2">
                  <div class="flex space-x-2">
                    <BIconCalendar3 class="my-auto" />
                    <span>Year</span>
                  </div>
                  <BIconCheck2 class="my-auto" v-if="sortBy === 'pubTime'" />
                </div>
              </MenuItem>
              <MenuItem
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200"
                @click="emit('click', 'sort-by-publication')"
              >
                <div class="flex justify-between px-2">
                  <div class="flex space-x-2">
                    <BIconBook class="my-auto" />
                    <span>Publication</span>
                  </div>
                  <BIconCheck2
                    class="my-auto"
                    v-if="sortBy === 'publication'"
                  />
                </div>
              </MenuItem>
              <MenuItem
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200"
                @click="emit('click', 'sort-by-addTime')"
              >
                <div class="flex justify-between px-2">
                  <div class="flex space-x-2">
                    <BIconClock class="my-auto" />
                    <span>Add Time</span>
                  </div>
                  <BIconCheck2 class="my-auto" v-if="sortBy === 'addTime'" />
                </div>
              </MenuItem>
            </div>
            <div class="pt-1">
              <MenuItem
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200"
                @click="emit('click', 'sort-order-desc')"
              >
                <div class="flex justify-between px-2">
                  <div class="flex space-x-2">
                    <BIconSortDown class="my-auto" />
                    <span>Descending</span>
                  </div>
                  <BIconCheck2 class="my-auto" v-if="sortOrder === 'desc'" />
                </div>
              </MenuItem>
              <MenuItem
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200"
                @click="emit('click', 'sort-order-asce')"
              >
                <div class="flex justify-between px-2">
                  <div class="flex space-x-2">
                    <BIconSortUp class="my-auto" />
                    <span>Ascending</span>
                  </div>
                  <BIconCheck2 class="my-auto" v-if="sortOrder === 'asce'" />
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
