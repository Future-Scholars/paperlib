<template>
    <q-tab-panel>
        <div class="row justify-center">
            <img src="../../../../assets/icon.png" style="width: 60px"/>
        </div>
        <div class="row justify-center">
            <div
                class="col"
                style="text-align: center; font-weight: 500; font-size: 1.5em"
            >
                Paperlib
            </div>
        </div>
        <div class="row justify-center">
            <div
                class="col"
                style="text-align: center; color: #444; font-size: 0.8em"
            >
                created by Geo
                <br />
                <a href="https://github.com/GeoffreyChen777/paperlib">Github</a>
                <br />
                <a href="https://paperlib.app">Webpage</a>
            </div>
        </div>
        <div class="row justify-center">
            <div
                class="col"
                style="text-align: center; color: #444; font-size: 0.8em"
            >
                {{ version }}
            </div>
        </div>
    </q-tab-panel>
</template>

<style lang="sass">
@import 'src/css/settingview.scss'
</style>

<script>
import { defineComponent, ref, toRefs } from "vue";

export default defineComponent({
    name: "InfoTab",
    props: {
        preference: Object,
    },
    setup(props, { emit }) {
        const version = ref("");

        const getVersion = () => {
            version.value = window.api.version()
        }

        return {
            version,
            getVersion,
            ...toRefs(props),
        };
    },
    mounted() {
        this.getVersion();
    }
});
</script>
