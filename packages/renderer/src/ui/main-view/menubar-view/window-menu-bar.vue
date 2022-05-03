<script setup lang="ts">
import {
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
import SearchInput from "./components/search-input.vue";
import MenuBarBtn from "./components/menu-bar-btn.vue";

const props = defineProps({
  sortBy: {
    type: String,
    required: true,
  },
  sortOrder: {
    type: String,
    required: true,
  },
  disableSingleBtn: {
    type: Boolean,
    default: true,
  },
  disableMultiBtn: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["click"]);
</script>

<template>
  <div class="flex w-full h-12 justify-between draggable-title">
    <div class="grow my-auto px-2"><SearchInput /></div>

    <div class="flex flex-none justify-end space-x-1 my-auto w-80 pl-8 pr-2">
      <MenuBarBtn
        btnName="Rescrape"
        @click="emit('click', 'rescrape')"
        :disabled="disableMultiBtn"
      />
      <MenuBarBtn
        btnName="Delete"
        @click="emit('click', 'delete')"
        :disabled="disableMultiBtn"
      />
      <MenuBarBtn
        btnName="Edit"
        @click="emit('click', 'edit')"
        :disabled="disableSingleBtn"
      />
      <MenuBarBtn
        btnName="Flag"
        @click="emit('click', 'flag')"
        :disabled="disableMultiBtn"
      />
      <div
        class="flex rounded-md hover:bg-neutral-100 hover:dark:bg-neutral-600"
        style="margin-left: 0.5rem !important; margin-right: 0.5rem !important"
      >
        <MenuBarBtn btnName="ListView" @click="emit('click', 'list-view')" />
        <MenuBarBtn btnName="TableView" @click="emit('click', 'table-view')" />
      </div>

      <Menu as="div" class="relative inline-block text-left z-50">
        <div>
          <MenuButton
            class="inline-flex justify-center w-7 h-6 rounded-md hover:bg-neutral-200 hover:dark:bg-neutral-700 cursor-default"
          >
            <BIconFilterRight
              class="text-sm m-auto text-neutral-700 dark:text-neutral-300"
            />
          </MenuButton>
        </div>

        <Transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="transform opacity-0 scale-95"
          enter-to-class="transform opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="transform opacity-100 scale-100"
          leave-to-class="transform opacity-0 scale-95"
        >
          <MenuItems
            class="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg p-1 text-xs bg-white dark:bg-neutral-800 dark:drop-shadow-xl divide-y dark:divide-neutral-700 focus:outline-none"
          >
            <div class="pb-1">
              <MenuItem
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200 hover:dark:bg-neutral-700"
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
                class="w-full rounded-md p-1 hover:bg-neutral-200 hover:dark:bg-neutral-700"
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
                class="w-full rounded-md p-1 hover:bg-neutral-200 hover:dark:bg-neutral-700"
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
                class="w-full rounded-md p-1 hover:bg-neutral-200 hover:dark:bg-neutral-700"
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
                class="w-full rounded-md p-1 hover:bg-neutral-200 hover:dark:bg-neutral-700"
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
                class="w-full rounded-md p-1 hover:bg-neutral-200hover:dark:bg-neutral-700"
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
                class="w-full rounded-md p-1 hover:bg-neutral-200 hover:dark:bg-neutral-700"
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
        </Transition>
      </Menu>

      <MenuBarBtn
        btnName="Preference"
        @click="emit('click', 'preference')"
        :with-tooltip="false"
      />
    </div>
  </div>
</template>
