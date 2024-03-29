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

import { Process } from "@/base/process-id";
import CommandBar from "./components/command-bar.vue";
import MenuBarBtn from "./components/menu-bar-btn.vue";
import { disposable } from "@/base/dispose.ts";
import { ref } from "vue";

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

const emits = defineEmits(["event:click"]);

// ================================
// State
// ================================
const uiState = uiStateService.useState();
const prefState = preferenceService.useState();

const isMaximized = ref(false)

const onCloseClicked = () => {
  PLMainAPI.windowProcessManagementService.close(Process.renderer);
};

const onMinimizeClicked = () => {
  PLMainAPI.windowProcessManagementService.minimize(Process.renderer);
};

const onUnmaximizeClicked = () => {
  PLMainAPI.windowProcessManagementService.unmaximize(Process.renderer);
};

const onMaximizeClicked = () => {
  PLMainAPI.windowProcessManagementService.maximize(Process.renderer);
};


disposable(
  PLMainAPI.windowProcessManagementService.on(
    Process.renderer,
    (newValue: { value: string }) => {
      if (newValue.value === "unmaximize") {
        isMaximized.value = false
      } else if (newValue.value === "maximize") {
        isMaximized.value = true
      }
    }
  )
)

</script>

<template>
  <div
    class="flex w-full justify-between draggable-title"
    :class="uiState.os !== 'win32' ? 'h-12' : 'h-10 mb-1'"
  >
    <div class="grow my-auto px-2 nodraggable-item">
      <CommandBar id="command-bar" />
    </div>

    <div
      class="flex flex-none justify-end space-x-1 my-auto pr-2 nodraggable-item"
      :class="uiState.os !== 'win32' ? 'w-80 pl-8' : 'w-48 pl-2'"
    >
      <MenuBarBtn
        id="scrape-selected-btn"
        btnName="rescrape"
        @event:click="emits('event:click', 'rescrape')"
        :disabled="disableMultiBtn"
      />
      <MenuBarBtn
        id="delete-selected-btn"
        btnName="delete"
        @event:click="emits('event:click', 'delete')"
        :disabled="disableMultiBtn"
      />
      <MenuBarBtn
        id="edit-selected-btn"
        btnName="edit"
        @event:click="emits('event:click', 'edit')"
        :disabled="disableSingleBtn"
      />
      <MenuBarBtn
        id="flag-selected-btn"
        btnName="flag"
        @event:click="emits('event:click', 'flag')"
        :disabled="disableMultiBtn"
      />
      <div
        class="flex rounded-md hover:bg-neutral-100 hover:dark:bg-neutral-600"
        style="margin-left: 0.5rem !important; margin-right: 0.5rem !important"
        v-if="uiState.os !== 'win32'"
      >
        <MenuBarBtn
          id="list-view-btn"
          class="my-auto"
          btnName="listview"
          @event:click="emits('event:click', 'list-view')"
        />
        <MenuBarBtn
          id="table-view-btn"
          class="my-auto"
          btnName="tableview"
          @event:click="emits('event:click', 'table-view')"
        />
        <MenuBarBtn
          id="table-reader-view-btn"
          class="my-auto"
          btnName="tablereaderview"
          @event:click="emits('event:click', 'tableandpreview-view')"
        />
      </div>

      <Menu as="div" class="relative inline-block text-left cursor-pointer">
        <div>
          <MenuButton
            id="sort-menu-btn"
            class="inline-flex justify-center w-7 h-6 rounded-md hover:bg-neutral-200 hover:dark:bg-neutral-700 cursor-pointer"
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
                @click="emits('event:click', 'sort-by-title')"
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
                @click="emits('event:click', 'sort-by-authors')"
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
                @click="emits('event:click', 'sort-by-pubTime')"
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
                @click="emits('event:click', 'sort-by-publication')"
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
                @click="emits('event:click', 'sort-by-addTime')"
              >
                <div class="flex justify-between px-2">
                  <div class="flex space-x-2">
                    <BIconClock class="my-auto" />
                    <span>{{ $t("menu.addTime") }}</span>
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
                @click="emits('event:click', 'sort-order-desc')"
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
                @click="emits('event:click', 'sort-order-asce')"
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
        class="relative inline-block text-left cursor-pointer"
        v-if="uiState.os === 'win32'"
      >
        <div>
          <MenuButton
            id="win-more-menu-btn"
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
                id="list-view-btn"
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200 hover:dark:bg-neutral-700"
                @click="emits('event:click', 'list-view')"
              >
                <div class="flex justify-between px-2">
                  <div class="flex space-x-2">
                    <BIconListUl class="my-auto" />
                    <span>{{ $t("menu.listview") }}</span>
                  </div>
                  <BIconCheck2
                    class="my-auto"
                    v-if="prefState.mainviewType === 'list'"
                  />
                </div>
              </MenuItem>
              <MenuItem
                id="table-view-btn"
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200 hover:dark:bg-neutral-700"
                @click="emits('event:click', 'table-view')"
              >
                <div class="flex justify-between px-2">
                  <div class="flex space-x-2">
                    <BIconGrid3x2 class="my-auto" />
                    <span>{{ $t("menu.tableview") }}</span>
                  </div>
                  <BIconCheck2
                    class="my-auto"
                    v-if="prefState.mainviewType === 'table'"
                  />
                </div>
              </MenuItem>
              <MenuItem
                id="table-reader-view-btn"
                v-slot="{ active }"
                class="w-full rounded-md p-1 hover:bg-neutral-200 hover:dark:bg-neutral-700"
                @click="emits('event:click', 'tableandpreview-view')"
              >
                <div class="flex justify-between px-2">
                  <div class="flex space-x-2">
                    <BIconAspectRatio class="my-auto" />
                    <span>{{ $t("menu.tablereaderview") }}</span>
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
                @click="emits('event:click', 'preference')"
              >
                <div class="flex justify-between px-2">
                  <div class="flex space-x-2">
                    <BIconGear class="my-auto" />
                    <span>{{ $t("menu.preference") }}</span>
                  </div>
                </div>
              </MenuItem>
            </div>
          </MenuItems>
        </Transition>
      </Menu>

      <MenuBarBtn
        btnName="preference"
        @event:click="emits('event:click', 'preference')"
        :with-tooltip="false"
        v-if="uiState.os !== 'win32'"
      />
    </div>

    <div class="flex nodraggable-item mx-1 my-auto" v-if="uiState.os === 'win32'">
      <div
        class="flex w-10 h-8 hover:bg-neutral-300 transition ease-in-out justify-center items-center"
        @click="onMinimizeClicked"
      >
        <BIconDash class="text-lg text-neutral-500" />
      </div>
      <div
        v-if="isMaximized"
        class="flex w-10 h-8 hover:bg-neutral-300 transition ease-in-out justify-center items-center"
        @click="onUnmaximizeClicked"
      >
        <div class="h-[8px] w-[8px] border-[1px] border-neutral-500 rounded-sm">
          <div class="relative right-[-2px] top-[-3px] h-[8px] w-[8px] rounded-sm border-r-[1px] border-t-[1px] border-neutral-500"></div>
        </div>
      </div>
      <div
        v-else
        class="flex w-10 h-8 hover:bg-neutral-300 transition ease-in-out justify-center items-center"
        @click="onMaximizeClicked"
      >
        <div
          class="w-[10px] h-[10px] border-[1.5px] border-neutral-500"
        ></div>
      </div>
      <div
        class="flex w-10 h-8 text-neutral-500 hover:bg-red-600 transition ease-in-out hover:text-neutral-200 justify-center items-center"
        @click="onCloseClicked"
      >
        <BIconX class="text-lg" />
      </div>
    </div>
  </div>
</template>
