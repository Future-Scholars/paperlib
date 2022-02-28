<template>
    <q-bar
        class="q-electron-drag no-shadow bg-secondary"
        style="height: 50px"
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

<script>
import { defineComponent } from "vue";

export default defineComponent({
    name: "WindowControl",
    setup() {
        const closeWindow = () => {
            window.api.close();
        };

        const minimizeWindow = () => {
            window.api.minimize();
        };

        const maximizeWindow = () => {
            window.api.toggleMaximize();
        };

        return {
            closeWindow,
            minimizeWindow,
            maximizeWindow,
        }

    }
});
</script>