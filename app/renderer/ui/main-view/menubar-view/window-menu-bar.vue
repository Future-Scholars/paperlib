<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import {
  BIconAspectRatio,
  BIconBook,
  BIconCalendar3,
  BIconCheck2,
  BIconClock,
  BIconDash,
  BIconFilterRight,
  BIconFonts,
  BIconGear,
  BIconGrid3x2,
  BIconListUl,
  BIconPerson,
  BIconSortDown,
  BIconSortUp,
  BIconThreeDots,
  BIconX,
} from "bootstrap-icons-vue";

import { MainRendererStateStore } from "@/state/renderer/appstate";

import MenuBarBtn from "./components/menu-bar-btn.vue";
import SearchInput from "./components/search-input.vue";

const props = defineProps({
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

// ================================
// State
// ================================
const viewState = MainRendererStateStore.useViewState();
const prefState = MainRendererStateStore.usePreferenceState();

const onCloseClicked = () => {
  window.appInteractor.close();
};

const onMinimizeClicked = () => {
  window.appInteractor.minimize();
};

const onMaximizeClicked = () => {
  window.appInteractor.maximize();
};
</script>

<template>
  <div
    class="flex w-full justify-between draggable-title"
    :class="viewState.os !== 'win32' ? 'h-12' : 'h-10 mb-1'"
  >
    <div class="grow my-auto px-2 nodraggable-item">
      <SearchInput
        id="search-input"
        @focusin="viewState.inputFieldFocused = true"
        @focusout="viewState.inputFieldFocused = false"
      />
    </div>

    <div
      class="flex flex-none justify-end space-x-1 my-auto pr-2 nodraggable-item"
      :class="viewState.os !== 'win32' ? 'w-80 pl-8' : 'w-48 pl-2'"
    >
      <MenuBarBtn
        id="scrape-selected-btn"
        btnName="rescrape"
        @click="emit('click', 'rescrape')"
        :disabled="disableMultiBtn"
      />
      <MenuBarBtn
        id="delete-selected-btn"
        btnName="delete"
        @click="emit('click', 'delete')"
        :disabled="disableMultiBtn"
      />
      <MenuBarBtn
        id="edit-selected-btn"
        btnName="edit"
        @click="emit('click', 'edit')"
        :disabled="disableSingleBtn"
      />
      <MenuBarBtn
        id="flag-selected-btn"
        btnName="flag"
        @click="emit('click', 'flag')"
        :disabled="disableMultiBtn"
      />
      <div
        class="flex rounded-md hover:bg-neutral-100 hover:dark:bg-neutral-600"
        style="margin-left: 0.5rem !important; margin-right: 0.5rem !important"
        v-if="viewState.os !== 'win32'"
      >
        <MenuBarBtn
          id="list-view-btn"
          class="my-auto"
          btnName="listview"
          @click="emit('click', 'list-view')"
        />
        <MenuBarBtn
          id="table-view-btn"
          class="my-auto"
          btnName="tableview"
          @click="emit('click', 'table-view')"
        />
        <MenuBarBtn
          id="table-reader-view-btn"
          class="my-auto"
          btnName="aspectratio"
          @click="emit('click', 'tableandpreview-view')"
        />
      </div>

      <Menu as="div" class="relative inline-block text-left">
        <div>
          <MenuButton
            id="sort-menu-btn"
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
            class="origin-top-right z-50 absolute right-0 mt-2 w-40 rounded-md shadow-lg p-1 text-xs bg-white dark:bg-neutral-800 dark:drop-shadow-xl divide-y dark:divide-neutral-700 focus:outline-none"
          >
            <div class="pb-1">
              <MenuItem
                id="sort-by-title-btn"
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200 hover:dark:bg-neutral-700"
                @click="emit('click', 'sort-by-title')"
              >
                <div class="flex justify-between px-2">
                  <div class="flex space-x-2">
                    <BIconFonts class="my-auto" />
                    <span>{{ $t("menu.title") }}</span>
                  </div>
                  <BIconCheck2
                    class="my-auto"
                    v-if="prefState.mainviewSortBy === 'title'"
                  />
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
                    <span>{{ $t("menu.authors") }}</span>
                  </div>
                  <BIconCheck2
                    class="my-auto"
                    v-if="prefState.mainviewSortBy === 'authors'"
                  />
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
                    <span>{{ $t("menu.year") }}</span>
                  </div>
                  <BIconCheck2
                    class="my-auto"
                    v-if="prefState.mainviewSortBy === 'pubTime'"
                  />
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
                    <span>{{ $t("menu.publication") }}</span>
                  </div>
                  <BIconCheck2
                    class="my-auto"
                    v-if="prefState.mainviewSortBy === 'publication'"
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
                    <span>{{ $t("menu.addtime") }}</span>
                  </div>
                  <BIconCheck2
                    class="my-auto"
                    v-if="prefState.mainviewSortBy === 'addTime'"
                  />
                </div>
              </MenuItem>
            </div>
            <div class="pt-1">
              <MenuItem
                id="sort-desc-btn"
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200 hover:dark:bg-neutral-700"
                @click="emit('click', 'sort-order-desc')"
              >
                <div class="flex justify-between px-2">
                  <div class="flex space-x-2">
                    <BIconSortDown class="my-auto" />
                    <span>{{ $t("menu.desc") }}</span>
                  </div>
                  <BIconCheck2
                    class="my-auto"
                    v-if="prefState.mainviewSortOrder === 'desc'"
                  />
                </div>
              </MenuItem>
              <MenuItem
                id="sort-asce-btn"
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200 hover:dark:bg-neutral-700"
                @click="emit('click', 'sort-order-asce')"
              >
                <div class="flex justify-between px-2">
                  <div class="flex space-x-2">
                    <BIconSortUp class="my-auto" />
                    <span>{{ $t("menu.asc") }}</span>
                  </div>
                  <BIconCheck2
                    class="my-auto"
                    v-if="prefState.mainviewSortOrder === 'asce'"
                  />
                </div>
              </MenuItem>
            </div>
          </MenuItems>
        </Transition>
      </Menu>

      <Menu
        as="div"
        class="relative inline-block text-left"
        v-if="viewState.os === 'win32'"
      >
        <div>
          <MenuButton
            class="inline-flex justify-center w-7 h-6 rounded-md hover:bg-neutral-200 hover:dark:bg-neutral-700 cursor-default"
          >
            <BIconThreeDots
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
            class="origin-top-right z-50 absolute right-0 mt-2 w-48 rounded-md shadow-lg p-1 text-xs bg-white dark:bg-neutral-800 dark:drop-shadow-xl divide-y dark:divide-neutral-700 focus:outline-none"
          >
            <div class="pb-1">
              <MenuItem
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200 hover:dark:bg-neutral-700"
                @click="emit('click', 'list-view')"
              >
                <div class="flex justify-between px-2">
                  <div class="flex space-x-2">
                    <BIconListUl class="my-auto" />
                    <span>List View</span>
                  </div>
                  <BIconCheck2
                    class="my-auto"
                    v-if="prefState.mainviewType === 'list'"
                  />
                </div>
              </MenuItem>
              <MenuItem
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200 hover:dark:bg-neutral-700"
                @click="emit('click', 'table-view')"
              >
                <div class="flex justify-between px-2">
                  <div class="flex space-x-2">
                    <BIconGrid3x2 class="my-auto" />
                    <span>Table View</span>
                  </div>
                  <BIconCheck2
                    class="my-auto"
                    v-if="prefState.mainviewType === 'table'"
                  />
                </div>
              </MenuItem>
              <MenuItem
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200 hover:dark:bg-neutral-700"
                @click="emit('click', 'tableandpreview-view')"
              >
                <div class="flex justify-between px-2">
                  <div class="flex space-x-2">
                    <BIconAspectRatio class="my-auto" />
                    <span>Table and Reader View</span>
                  </div>
                  <BIconCheck2
                    class="my-auto"
                    v-if="prefState.mainviewType === 'tableandpreview'"
                  />
                </div>
              </MenuItem>

              <MenuItem
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200 hover:dark:bg-neutral-700"
                @click="emit('click', 'preference')"
              >
                <div class="flex justify-between px-2">
                  <div class="flex space-x-2">
                    <BIconGear class="my-auto" />
                    <span>Preference</span>
                  </div>
                </div>
              </MenuItem>
            </div>
          </MenuItems>
        </Transition>
      </Menu>

      <MenuBarBtn
        btnName="preference"
        @click="emit('click', 'preference')"
        :with-tooltip="false"
        v-if="viewState.os !== 'win32'"
      />
    </div>

    <div class="flex nodraggable-item mx-1" v-if="viewState.os === 'win32'">
      <div
        class="flex w-10 h-8 hover:bg-neutral-300 transition ease-in-out"
        @click="onMinimizeClicked"
      >
        <BIconDash class="m-auto mt-2.5 text-lg text-neutral-500" />
      </div>
      <div
        class="flex w-10 h-8 hover:bg-neutral-300 transition ease-in-out"
        @click="onMaximizeClicked"
      >
        <div
          class="m-auto mt-[14px] w-[10px] h-[10px] border-[1.5px] border-neutral-500"
        ></div>
      </div>
      <div
        class="flex w-10 h-8 text-neutral-500 hover:bg-red-600 transition ease-in-out hover:text-neutral-200"
        @click="onCloseClicked"
      >
        <BIconX class="m-auto mt-2.5 text-lg" />
      </div>
    </div>
  </div>
</template>
