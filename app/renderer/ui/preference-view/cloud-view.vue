<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";

import Options from "./components/options.vue";
import Toggle from "./components/toggle.vue";

const prefState = PLMainAPI.preferenceService.useState();
const filebackendState = PLAPI.fileService.useState();

const syncAPPID = ref(prefState.syncAPPID);
const syncCloudBackend = ref(prefState.syncCloudBackend);
const syncEmail = ref(prefState.syncEmail);
const syncPassword = ref("");
const syncFileStorage = ref(prefState.syncFileStorage);

const webdavURL = ref(prefState.webdavURL);
const webdavUsername = ref(prefState.webdavUsername);
const webdavPassword = ref("");

const onUpdate = (key: string, value: unknown) => {
  PLMainAPI.preferenceService.set({ [key]: value });
};

// =============================================================================
// Offical RESTful API Sync
const onOfficialLoginClicked = async () => {
  // await PLMainAPI.preferenceService.set({ syncCloudBackend: syncCloudBackend.value });
  // await PLMainAPI.preferenceService.set({ syncEmail: syncEmail.value });
  // await PLMainAPI.preferenceService.setPassword(
  //   "offcialApiSync",
  //   syncPassword.value
  // );
  await PLMainAPI.preferenceService.set({ useSync: "official" });

  await PLAPI.syncService.invokeLoginOfficial();
};

const onOfficialLogouClicked = async () => {
  await PLAPI.syncService.logoutOfficial();
  await PLMainAPI.preferenceService.set({ useSync: "none" });
}

// =============================================================================
// Legacy Realm Sync
const onRealmLoginClicked = async () => {
  await PLMainAPI.preferenceService.set({ syncAPPID: syncAPPID.value });
  await PLMainAPI.preferenceService.set({ syncEmail: syncEmail.value });
  await PLMainAPI.preferenceService.setPassword(
    "realmSync",
    syncPassword.value
  );
  await PLMainAPI.preferenceService.set({ useSync: 'realm' });

  await PLAPI.databaseService.initialize();
};

const onRealmLogouClicked = async () => {
  // TODO: test async
  await PLMainAPI.preferenceService.set({ useSync: 'none' });
  await PLAPI.databaseService.initialize();
  await PLAPI.databaseService.deleteSyncCache();
};

const onRealmClickGuide = () => {
  PLAPI.fileService.open("https://paperlib.app/en/doc/cloud-sync/setup.html");
};

const onRealmMigrateClicked = async () => {
  await PLAPI.categorizerService.migrateLocaltoCloud();
  await PLAPI.paperService.migrateLocaltoCloud();
  await PLAPI.feedService.migrateLocaltoCloud();
  await PLAPI.smartFilterService.migrateLocaltoCloud();
};

// =============================================================================
// WebDAV
const onWebdavConnectClicked = async () => {
  await PLMainAPI.preferenceService.set({ webdavURL: webdavURL.value });
  await PLMainAPI.preferenceService.set({
    webdavUsername: webdavUsername.value,
  });
  await PLMainAPI.preferenceService.setPassword("webdav", webdavPassword.value);
  await PLMainAPI.preferenceService.set({ syncFileStorage: "webdav" });

  PLAPI.fileService.initialize();
};

const onWebdavDisconnectClicked = async () => {
  await PLMainAPI.preferenceService.set({ syncFileStorage: "local" });
  PLAPI.fileService.initialize();
  syncFileStorage.value = "local";
};

onMounted(() => {
  nextTick(async () => {
    syncPassword.value =
      (await PLMainAPI.preferenceService.getPassword("realmSync")) || "";
  });
});
</script>

<template>
  <div
    class="flex flex-col text-neutral-800 dark:text-neutral-300 w-[400px] md:w-[500px] lg:w-[700px]"
  >
    <!-- Official RESTful API Sync -->
    <div class="text-base font-semibold mb-1">Paperlib Sync</div>
    <div class="text-xxs mb-3" @click="onRealmClickGuide">
      <span
        class="underline hover:text-accentlight hover:dark:text-accentdark cursor-pointer"
      >
        Paperlib Official Cloud Sync Service
        <!-- TODO: Translation -->
      </span>
    </div>

    <div class="flex space-x-2 justify-between mb-5">
      <div class="flex justify-between text-xs flex-none">
        <button
          class="flex h-full w-[5.5rem] my-auto text-center rounded-md bg-neutral-200 dark:bg-neutral-600"
          v-if="prefState.useSync!='official'"
          @click="onOfficialLoginClicked"
        >
          <span class="m-auto">{{ $t("preference.login") }}</span>
        </button>
        <button
          class="flex h-full w-[5.5rem] my-auto text-center rounded-md bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-600 hover:dark:bg-neutral-500"
          v-if="prefState.useSync=='official'"
          @click="onRealmLogouClicked"
        >
          <span class="m-auto">{{ $t("preference.logout") }}</span>
        </button>
      </div>
    </div>

    <Toggle
      class="mb-5"
      :title="$t('preference.flexibleSyncTitle')"
      :info="$t('preference.flexibleSyncIntro')"
      :enable="prefState.isFlexibleSync"
      @event:change="
        (value) => {
          onUpdate('isFlexibleSync', value);
        }
      "
    />

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
        class="flex h-8 w-[5.5rem] my-auto text-center rounded-md bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-600 hover:dark:bg-neutral-500"
        @click="onRealmMigrateClicked"
      >
        <span class="m-auto text-xs">{{ $t("preference.migrate") }}</span>
      </button>
    </div>

    <hr class="mb-5 dark:border-neutral-600" />
<!-- Legacy Realm Sync -->

    <div class="text-base font-semibold mb-1">
      {{ $t("preference.cloud") }} Metadata (Deprecated)
    </div>
    <div class="text-xxs mb-3" @click="onRealmClickGuide">
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
        class="p-2 rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none grow"
        type="text"
        placeholder="Username"
        v-model="syncEmail"
        :disabled="prefState.useSync!='realm'"
        :class="prefState.useSync=='realm' ? 'text-neutral-400' : ''"
      />
      <input
        class="p-2 rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none grow"
        type="password"
        placeholder="Password"
        v-model="syncPassword"
        :disabled="prefState.useSync!='realm'"
        :class="prefState.useSync=='realm' ? 'text-neutral-400' : ''"
      />
      <div class="flex justify-between text-xs flex-none">
        <button
          class="flex h-full w-[5.5rem] my-auto text-center rounded-md bg-neutral-200 dark:bg-neutral-600"
          v-if="prefState.useSync!='realm'"
          @click="onRealmLoginClicked"
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
          v-if="prefState.useSync=='realm'"
          @click="onRealmLogouClicked"
        >
          <span class="m-auto">{{ $t("preference.logout") }}</span>
        </button>
      </div>
    </div>

    <Toggle
      class="mb-5"
      :title="$t('preference.flexibleSyncTitle')"
      :info="$t('preference.flexibleSyncIntro')"
      :enable="prefState.useSync=='realm'&&prefState.isFlexibleSync"
      @event:change="
        (value) => {
          onUpdate('isFlexibleSync', value);
        }
      "
    />

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
        class="flex h-8 w-[5.5rem] my-auto text-center rounded-md bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-600 hover:dark:bg-neutral-500"
        @click="onRealmMigrateClicked"
      >
        <span class="m-auto text-xs">{{ $t("preference.migrate") }}</span>
      </button>
    </div>

    <hr class="mb-5 dark:border-neutral-600" />
<!--File Storage-->
    <div class="text-base font-semibold mb-4">
      {{ $t("preference.filestorage") }}
    </div>
    <Options
      class="mb-4"
      :title="$t('preference.filestoragebackend')"
      :info="$t('preference.filestoragebackendintro')"
      :selected="syncFileStorage"
      :options="{ local: $t('preference.local'), webdav: 'WebDAV' }"
      @event:change="
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
        :disabled="
          filebackendState.backend === 'webdav' && filebackendState.available
        "
        :class="
          filebackendState.backend === 'webdav' && filebackendState.available
            ? 'text-neutral-400'
            : ''
        "
      />

      <div class="flex space-x-2">
        <input
          class="p-2 rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none grow"
          type="text"
          placeholder="Username"
          v-model="webdavUsername"
          :disabled="
            filebackendState.backend === 'webdav' && filebackendState.available
          "
          :class="
            filebackendState.backend === 'webdav' && filebackendState.available
              ? 'text-neutral-400'
              : ''
          "
        />
        <input
          class="p-2 rounded-md text-xs bg-neutral-200 dark:bg-neutral-700 focus:outline-none grow"
          type="password"
          placeholder="Password"
          v-model="webdavPassword"
          :disabled="
            filebackendState.backend === 'webdav' && filebackendState.available
          "
          :class="
            filebackendState.backend === 'webdav' && filebackendState.available
              ? 'text-neutral-400'
              : ''
          "
        />
        <div class="flex text-xs flex-none">
          <div
            class="flex h-full w-[5.5rem] my-auto text-center rounded-md bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 hover:dark:bg-neutral-500"
            v-if="
              !(
                filebackendState.backend === 'webdav' &&
                filebackendState.available
              )
            "
            @click="onWebdavConnectClicked"
          >
            <span class="m-auto">{{ $t("preference.connect") }}</span>
          </div>
          <div
            class="flex h-full w-[5.5rem] my-auto text-center rounded-md bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 hover:dark:bg-neutral-500"
            v-if="
              filebackendState.backend === 'webdav' &&
              filebackendState.available
            "
            @click="onWebdavDisconnectClicked"
          >
            <span class="m-auto">{{ $t("preference.disconnect") }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
