<script setup lang="ts">
import { ref } from "vue";
import Options from "./components/options.vue";

import { PreferenceStore } from "../../../../preload/utils/preference";

const props = defineProps({
  preference: {
    type: Object as () => PreferenceStore,
    required: true,
  },
});

const syncAPPID = ref(props.preference.syncAPPID);
const syncEmail = ref(props.preference.syncEmail);
const syncPassword = ref("");

const webdavURL = ref(props.preference.webdavURL);
const webdavUsername = ref(props.preference.webdavUsername);
const webdavPassword = ref("");

const onUpdate = (key: string, value: unknown) => {
  window.appInteractor.updatePreference(key, value);
};

const onLoginClicked = async () => {
  window.appInteractor.updatePreference("useSync", true);
  window.appInteractor.updatePreference("syncEmail", syncEmail.value);
  await window.appInteractor.setPassword("realmSync", syncPassword.value);
  window.entityInteractor.initDB();
};

const onLogoutClicked = () => {
  window.appInteractor.updatePreference("useSync", false);
  window.entityInteractor.initDB();
};

window.appInteractor.getPassword("realmSync").then((password) => {
  syncPassword.value = password as string;
});

// =============================================================================
// WebDAV

const syncFileStorageAvaliable = ref(
  JSON.parse(
    window.appInteractor.getState(
      "viewState.syncFileStorageAvaliable"
    ) as string
  ) as boolean
);

window.appInteractor.registerState(
  "viewState.syncFileStorageAvaliable",
  (value) => {
    syncFileStorageAvaliable.value = value as boolean;
  }
);

const onWebdavConnectClicked = async () => {
  window.appInteractor.updatePreference("webdavURL", webdavURL.value);
  window.appInteractor.updatePreference("webdavUsername", webdavUsername.value);
  await window.appInteractor.setPassword("webdav", webdavPassword.value);

  window.entityInteractor.initFileRepository();
};

const onWebdavDisconnectClicked = () => {
  window.appInteractor.updatePreference("syncFileStorage", "local");
  window.entityInteractor.initFileRepository();
};
</script>

<template>
  <div class="flex flex-col w-full text-neutral-800">
    <div class="text-base font-semibold mb-1">Sync Metadata</div>
    <div class="text-xxs mb-3">
      <span class="underline hover:text-accentlight cursor-pointer">
        Learn How to Use
      </span>
    </div>
    <input
      class="p-2 rounded-md text-xs bg-neutral-200 focus:outline-none mb-2"
      type="text"
      placeholder="Realm APP ID of the custom MongoDB Atlas"
      v-model="syncAPPID"
    />

    <div class="flex space-x-2 justify-between mb-5">
      <input
        class="p-2 rounded-md text-xs bg-neutral-200 focus:outline-none w-56"
        type="text"
        placeholder="Usearname"
        v-model="syncEmail"
        :disabled="preference.useSync"
        :class="preference.useSync ? 'text-neutral-400' : ''"
      />
      <input
        class="p-2 rounded-md text-xs bg-neutral-200 focus:outline-none w-56"
        type="password"
        placeholder="Password"
        v-model="syncPassword"
        :disabled="preference.useSync"
        :class="preference.useSync ? 'text-neutral-400' : ''"
      />
      <div class="flex justify-between text-xs">
        <button
          class="flex h-full w-[5.5rem] my-auto text-center rounded-md bg-neutral-200"
          v-if="!preference.useSync"
          @click="onLoginClicked"
          :disabled="
            syncAPPID.length !== 0 &&
            syncEmail.length !== 0 &&
            syncPassword.length !== 0
          "
          :class="
            syncAPPID.length !== 0 &&
            syncEmail.length !== 0 &&
            syncPassword.length !== 0
              ? 'hover:bg-neutral-300'
              : 'text-neutral-400 '
          "
        >
          <span class="m-auto">Login</span>
        </button>
        <button
          class="flex h-full w-[5.5rem] my-auto text-center rounded-md bg-neutral-200 hover:bg-neutral-300"
          v-if="preference.useSync"
          @click="onLogoutClicked"
        >
          <span class="m-auto">Logout</span>
        </button>
      </div>
    </div>

    <hr class="mb-5" />

    <div class="text-base font-semibold mb-4">File Storage</div>
    <Options
      class="mb-2"
      title="File Backend"
      info="Choose a backend to store the paper files such as PDF files."
      :selected="preference.syncFileStorage"
      :options="{ local: 'Local', webdav: 'WebDAV' }"
      @update="(value) => onUpdate('syncFileStorage', value)"
    />

    <div class="flex flex-col" v-if="preference.syncFileStorage === 'webdav'">
      <input
        class="p-2 rounded-md text-xs bg-neutral-200 focus:outline-none mb-2"
        type="text"
        placeholder="WebDAV URL"
        v-model="webdavURL"
        :disabled="syncFileStorageAvaliable"
        :class="syncFileStorageAvaliable ? 'text-neutral-400' : ''"
      />

      <div class="flex space-x-2 justify-between">
        <input
          class="p-2 rounded-md text-xs bg-neutral-200 focus:outline-none w-44"
          type="text"
          placeholder="Usearname"
          v-model="webdavUsername"
          :disabled="syncFileStorageAvaliable"
          :class="syncFileStorageAvaliable ? 'text-neutral-400' : ''"
        />
        <input
          class="p-2 rounded-md text-xs bg-neutral-200 focus:outline-none w-40"
          type="password"
          placeholder="Password"
          v-model="webdavPassword"
          :disabled="syncFileStorageAvaliable"
          :class="syncFileStorageAvaliable ? 'text-neutral-400' : ''"
        />
        <div class="flex justify-between w-40 text-xs">
          <div
            class="flex h-full w-[4.5rem] my-auto text-center rounded-md bg-neutral-200 hover:bg-neutral-300"
            v-if="!syncFileStorageAvaliable"
            @click="onWebdavConnectClicked"
          >
            <span class="m-auto">Connect</span>
          </div>
          <div
            class="flex h-full w-[4.5rem] my-auto text-center rounded-md bg-neutral-200 hover:bg-neutral-300"
            v-if="syncFileStorageAvaliable"
            @click="onWebdavDisconnectClicked"
          >
            <span class="m-auto">Disconnect</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
