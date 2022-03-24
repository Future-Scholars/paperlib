<template>
    <q-bar
        class="q-electron-drag no-shadow"
        style="height: 50px; background: none"
    >
        <q-btn
            dense
            flat
            round
            icon="lens"
            size="8.5px"
            color="red"
            @click="closeWindow"
        />
        <q-btn
            dense
            flat
            round
            icon="lens"
            size="8.5px"
            color="yellow-9"
            @click="minimizeWindow"
        />
        <q-btn
            dense
            flat
            round
            icon="lens"
            size="8.5px"
            color="green-6"
            @click="maximizeWindow"
        />
    </q-bar>

</template>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'WindowControl',
  setup() {
    const closeWindow = () => {
      window.systemInteractor.close();
    };

    const minimizeWindow = () => {
      window.systemInteractor.minimize();
    };

    const maximizeWindow = () => {
      window.systemInteractor.toggleMaximize();
    };

    return {
      closeWindow,
      minimizeWindow,
      maximizeWindow,
    };
  },
});
</script>
