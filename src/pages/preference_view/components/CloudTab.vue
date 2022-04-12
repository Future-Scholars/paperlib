<template>
    <q-tab-panel name="cloud" class="preference-tab">
        <div class="row setting-title" style="text-align: left !important">
            <span style="font-weight: 500">
                Cloud Backend
            </span>
        </div>
        <div class="row setting-content q-mb-md">
            <div class="col-2">
                <q-radio v-model="syncCloudBackend" val="official" label="Official" size="xs" @update:model-value="(value) => onUpdate('syncCloudBackend', value)" />
            </div>
            <div class="col-4">
                <q-radio class='q-ml-sm' v-model="syncCloudBackend" val="custom-atlas" label="Custom Mongodb Atlas" size="xs" @update:model-value="(value) => onUpdate('syncCloudBackend', value)" />
            </div>
            <div class="col-4 q-mt-xs" v-if="syncCloudBackend === 'custom-atlas'">
                <div class="radius-border setting-content preference-input" >
                    <q-input
                        borderless
                        v-model="syncAPPID"
                        placeholder="Mongodb Atlas APP ID"
                        dense
                        style="max-height: 22px"
                        @update:model-value="(value) => onUpdate('syncAPPID', value)"
                    />
                </div>
            </div>
        </div>


        <div class="row setting-title q-mb-xs" style="text-align: left !important">
            <span style="font-weight: 500">
                Cloud Account
            </span>
        </div>
        <div class="row">
            <div class="col-4 q-mr-md">
                <div class="radius-border setting-content preference-input" >
                    <q-input
                        borderless
                        v-model="syncEmail"
                        placeholder="Email"
                        dense
                        style="max-height: 22px"
                        @update:model-value="(value) => onUpdate('syncEmail', value)"
                    />
                </div>
            </div>
            <div class="col-4">
                <div class="radius-border setting-content preference-input" >
                    <q-input
                        borderless
                        v-model="syncPassword"
                        placeholder="Password"
                        type="password"
                        dense
                        style="max-height: 22px"
                    />
                </div>
            </div>
            <div class="col-1">
                <q-btn
                    unelevated
                    no-caps
                    size="xs"
                    label="Login"
                    style="font-size: 10px;"
                    class="q-ml-sm"
                    @click="onLoginClicked"
                    v-if="!preference.useSync"
                    :disabled="syncEmail === '' || syncPassword === ''"
                />
                <q-btn
                    unelevated
                    no-caps
                    size="xs"
                    label="Logout"
                    style="font-size: 10px;"
                    class="q-ml-sm"
                    @click="onLogoutClicked"
                    v-if="preference.useSync"
                />
            </div>
            <div class="col-1" v-if="syncCloudBackend === 'official'">
              <q-btn
                  unelevated
                  no-caps
                  size="xs"
                  label="Signup"
                  class="q-ml-lg"
                  style="font-size: 10px;"
                  @click="onSignupClicked"
              />
            </div>
        </div>
        <div class="row q-mt-xs">
          <div class="col-7 setting-title q-mt-xs" style="text-align: left !important">
              <span >
                  Migrate the local database to the cloud database.
              </span>
          </div>
          <div class="col-1">
            <q-btn
                unelevated
                no-caps
                size="xs"
                class="q-ml-md"
                label="Migrate"
                style="font-size: 10px;"
                @click="onMigrateClicked"
                :disable="!preference.useSync"
            />
          </div>
        </div>

        <q-separator class="q-mt-lg q-mb-xs"/>
        <div class="row setting-title" style="text-align: left !important">
          <span style="font-weight: 500">
            Cloud File Storage
          </span>
          <span style="font-weight: 300">
            *The metadata of your papers will be stored in the MongoDB Atlas Cloud. However, you need to sync your PDF files manually. For example, you can choosed a mounted shared folder (Onedrive, Dropbox etc.) or use the WebDAV.
          </span>
        </div>
        <div class="row setting-content">
          <q-radio v-model="syncFileStorage" val="local" label="Local Folder" size="xs" @update:model-value="(value) => onUpdate('syncFileStorage', value)" >
            <q-tooltip>
              Selected in the General tab.
            </q-tooltip>
          </q-radio>
          <q-radio v-model="syncFileStorage" val="webdav" label="WebDAV" size="xs" @update:model-value="(value) => onUpdate('syncFileStorage', value)" />
        </div>

        <div class="row" v-if="syncFileStorage === 'webdav'">
            <div class="col-9">
                <div class="radius-border setting-content preference-input" >
                    <q-input
                        borderless
                        v-model="webdavURL"
                        placeholder="WebDAV URL"
                        dense
                        style="max-height: 22px"
                        @update:model-value="(value) => onUpdate('webdavURL', value)"
                    />
                </div>
            </div>
        </div>
        <div class="row q-mt-sm" v-if="syncFileStorage === 'webdav'">
            <div class="col-4">
              <div class="radius-border setting-content preference-input" >
                <q-input
                  borderless
                  v-model="webdavUsername"
                  placeholder="WebDAV Username"
                  dense
                  style="max-height: 22px"
                  @update:model-value="(value) => onUpdate('webdavUsername', value)"
                />
              </div>
            </div>
            <div class="col-1">
            </div>
            <div class="col-4">
              <div class="radius-border setting-content preference-input" >
                <q-input
                  borderless
                  v-model="webdavPassword"
                  placeholder="WebDAV Password"
                  type="password"
                  dense
                  style="max-height: 22px"
                />
              </div>
            </div>
            <div class="col-1">
                <q-btn
                    unelevated
                    no-caps
                    size="xs"
                    label="Connect"
                    style="font-size: 10px;"
                    class="q-ml-sm"
                    @click="onWebdavConnectClicked"
                    :disabled="webdavURL === '' || webdavUsername === '' || webdavPassword === ''"
                    v-if="!syncFileStorageAvaliable"
                />
                <q-btn
                    unelevated
                    no-caps
                    size="xs"
                    label="Disconnect"
                    style="font-size: 10px;"
                    class="q-ml-sm"
                    @click="onWebdavDisconnectClicked"
                    v-if="syncFileStorageAvaliable"
                />
            </div>
        </div>


    </q-tab-panel>
</template>

<script lang="ts">
import {defineComponent, ref, PropType} from 'vue';

import { PreferenceType } from '../../../utils/preference';

export default defineComponent({
  name: 'CloudTab',
  props: {
    preference: {
      type: Object as PropType<PreferenceType>,
      required: true,
    },
  },
  setup(props, {emit}) {
    const syncEmail = ref(props.preference.syncEmail);
    const syncPassword = ref('');
    const syncFileStorage = ref(props.preference.syncFileStorage);
    const syncCloudBackend = ref(props.preference.syncCloudBackend);
    const syncAPPID = ref(props.preference.syncAPPID);
    const syncFileStorageAvaliable = ref(window.systemInteractor.getState('viewState.syncFileStorageAvaliable') as unknown as boolean);
    const webdavURL = ref(props.preference.webdavURL);
    const webdavUsername = ref(props.preference.webdavUsername);
    const webdavPassword = ref('');

    void window.systemInteractor.getPassword('webdav').then((password) => {
      webdavPassword.value = password as string;
    });

    void window.systemInteractor.getPassword('realmSync').then((password) => {
      syncPassword.value = password as string;
    });

    const onUpdate = (key: string, value: unknown) => {
      window.systemInteractor.updatePreference(key, value);
    };

    const onLoginClicked = async() => {
      window.systemInteractor.updatePreference('useSync', true);
      await window.systemInteractor.setPassword('realmSync', syncPassword.value );
      void window.entityInteractor.initDB();
    };

    const onLogoutClicked = () => {
      window.systemInteractor.updatePreference('useSync', false);
      void window.entityInteractor.logoutCloud();
    };

    const onSignupClicked = () => {
      void window.systemInteractor.openweb('https://paperlib.app/en/signup');
    };

    const onMigrateClicked = () => {
      window.entityInteractor.migrateLocaltoCloud();
    };

    const onWebdavConnectClicked = async() => {
      await window.systemInteractor.setPassword('webdav', webdavPassword.value );
      window.entityInteractor.initFileRepository();
    };

    const onWebdavDisconnectClicked = () => {
      syncFileStorage.value = 'local';
      window.systemInteractor.updatePreference('syncFileStorage', 'local');
      window.entityInteractor.initFileRepository();
    };

    window.systemInteractor.registerState('viewState.syncFileStorageAvaliable', (_event, message) => {
      syncFileStorageAvaliable.value = JSON.parse(message as string) as boolean;
    });

    return {
      syncEmail,
      syncPassword,
      syncFileStorage,
      syncCloudBackend,
      syncAPPID,
      syncFileStorageAvaliable,
      webdavURL,
      webdavUsername,
      webdavPassword,

      onUpdate,
      onLoginClicked,
      onLogoutClicked,
      onSignupClicked,
      onMigrateClicked,
      onWebdavConnectClicked,
      onWebdavDisconnectClicked
    };
  },
});
</script>
