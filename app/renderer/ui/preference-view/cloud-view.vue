<script setup lang="ts">
import { ref } from "vue";

import { IPreferenceStore } from "@/renderer/services/preference-service";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import Options from "./components/options.vue";

const prefState = preferenceService.useState();
const viewState = MainRendererStateStore.useViewState();

const syncAPPID = ref(prefState.syncAPPID);
const syncEmail = ref(prefState.syncEmail);
const syncPassword = ref("");
const syncFileStorage = ref(prefState.syncFileStorage);

const webdavURL = ref(prefState.webdavURL);
const webdavUsername = ref(prefState.webdavUsername);
const webdavPassword = ref("");

// TODO: here is an error in console.

const onUpdate = (key: keyof IPreferenceStore, value: unknown) => {
  preferenceService.set({ [key]: value });
};

const onLoginClicked = async () => {
  preferenceService.set({ useSync: true });
  preferenceService.set({ syncAPPID: syncAPPID.value });
  preferenceService.set({ syncEmail: syncEmail.value });
  await preferenceService.setPassword("realmSync", syncPassword.value);

  viewState.realmReiniting = Date.now();
};

const onLogoutClicked = () => {
  preferenceService.set({ useSync: false });

  viewState.realmReiniting = Date.now();
};

const onClickGuide = () => {
  fileService.open("https://paperlib.app/en/blog/sync/");
};

const onMigrateClicked = () => {
  databaseService.migrateLocaltoCloud();
};

preferenceService.getPassword("realmSync").then((password) => {
  syncPassword.value = password ? (password as string) : "";
});

// =============================================================================
// WebDAV

const onWebdavConnectClicked = async () => {
  preferenceService.set({ webdavURL: webdavURL.value });
  preferenceService.set({ webdavUsername: webdavUsername.value });
  await preferenceService.setPassword("webdav", webdavPassword.value);
  preferenceService.set({ syncFileStorage: "webdav" });

  viewState.storageBackendReinited = Date.now();
};

const onWebdavDisconnectClicked = () => {
  preferenceService.set({ syncFileStorage: "local" });
  viewState.storageBackendReinited = Date.now();
};
</script>

<template>
  <div class="flex flex-col w-full text-neutral-800 dark:text-neutral-300">
    <div class="text-base font-semibold mb-1">
      {{ $t("preference.cloud") }} Metadata
    </div>
    <div class="text-xxs mb-3" @click="onClickGuide">
      <span
        class="underline hover:text-accentlight hover:dark:text-accentdark cursor-pointer"
      >
        Learn How to Use
      </span>
    </div>
    <input
      class="p-2 rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none mb-2"
      type="text"
      placeholder="Realm APP ID of the custom MongoDB Atlas"
      v-model="syncAPPID"
    />

    <div class="flex space-x-2 justify-between mb-5">
      <input
        class="p-2 rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none w-56"
        type="text"
        placeholder="Username"
        v-model="syncEmail"
        :disabled="prefState.useSync"
        :class="prefState.useSync ? 'text-neutral-400' : ''"
      />
      <input
        class="p-2 rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none w-56"
        type="password"
        placeholder="Password"
        v-model="syncPassword"
        :disabled="prefState.useSync"
        :class="prefState.useSync ? 'text-neutral-400' : ''"
      />
      <div class="flex justify-between text-xs">
        <button
          class="flex h-full w-[5.5rem] my-auto text-center rounded-md bg-neutral-200 dark:bg-neutral-600"
          v-if="!prefState.useSync"
          @click="onLoginClicked"
          :disabled="
            syncAPPID.length === 0 &&
            syncEmail.length === 0 &&
            syncPassword.length === 0
          "
          :class="
            syncAPPID.length !== 0 &&
            syncEmail.length !== 0 &&
            syncPassword.length !== 0
              ? 'hover:bg-neutral-300 hover:dark:bg-neutral-500'
              : 'text-neutral-400 '
          "
        >
          <span class="m-auto">{{ $t("preference.login") }}</span>
        </button>
        <button
          class="flex h-full w-[5.5rem] my-auto text-center rounded-md bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-600 hover:dark:bg-neutral-500"
          v-if="prefState.useSync"
          @click="onLogoutClicked"
        >
          <span class="m-auto">{{ $t("preference.logout") }}</span>
        </button>
      </div>
    </div>

    <div class="flex justify-between mb-5" v-if="prefState.useSync">
      <div class="flex flex-col">
        <div class="text-xs font-semibold">
          {{ $t("preference.migratetitle") }}
        </div>
        <div class="text-xxs text-neutral-600 dark:text-neutral-500">
          {{ $t("preference.migrateintro") }}
        </div>
      </div>
      <button
        class="flex h-full w-[5.5rem] my-auto text-center rounded-md bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-600 hover:dark:bg-neutral-500"
        @click="onMigrateClicked"
      >
        <span class="m-auto text-xs">{{ $t("preference.migrate") }}</span>
      </button>
    </div>

    <hr class="mb-5 dark:border-neutral-600" />

    <div class="text-base font-semibold mb-4">
      {{ $t("preference.filestorage") }}
    </div>
    <Options
      class="mb-4"
      :title="$t('preference.filestoragebackend')"
      :info="$t('preference.filestoragebackendintro')"
      :selected="syncFileStorage"
      :options="{ local: $t('preference.local'), webdav: 'WebDAV' }"
      @update="
        (value) => {
          syncFileStorage = value;
          onUpdate('syncFileStorage', value);
        }
      "
    />

    <div class="flex flex-col" v-if="syncFileStorage === 'webdav'">
      <input
        class="p-2 rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none mb-2"
        type="text"
        placeholder="WebDAV URL"
        v-model="webdavURL"
        :disabled="viewState.syncFileStorageAvaliable"
        :class="viewState.syncFileStorageAvaliable ? 'text-neutral-400' : ''"
      />

      <div class="flex space-x-2 justify-between">
        <input
          class="p-2 rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none w-56"
          type="text"
          placeholder="Username"
          v-model="webdavUsername"
          :disabled="viewState.syncFileStorageAvaliable"
          :class="viewState.syncFileStorageAvaliable ? 'text-neutral-400' : ''"
        />
        <input
          class="p-2 rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none w-56"
          type="password"
          placeholder="Password"
          v-model="webdavPassword"
          :disabled="viewState.syncFileStorageAvaliable"
          :class="viewState.syncFileStorageAvaliable ? 'text-neutral-400' : ''"
        />
        <div class="flex text-xs">
          <div
            class="flex h-full w-[5.5rem] my-auto text-center rounded-md bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 hover:dark:bg-neutral-500"
            v-if="!viewState.syncFileStorageAvaliable"
            @click="onWebdavConnectClicked"
          >
            <span class="m-auto">{{ $t("preference.connect") }}</span>
          </div>
          <div
            class="flex h-full w-[5.5rem] my-auto text-center rounded-md bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 hover:dark:bg-neutral-500"
            v-if="viewState.syncFileStorageAvaliable"
            @click="onWebdavDisconnectClicked"
          >
            <span class="m-auto">{{ $t("preference.disconnect") }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
@/renderer/services/preference-service @/common/services/preference-service
