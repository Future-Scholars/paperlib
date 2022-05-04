import { createApp } from "vue";
import Plugin from "./Plugin.vue";
import "./css/index.css";
// @ts-ignore
import { RecycleScroller } from "vue-virtual-scroller";

const plugin = createApp(Plugin);
plugin.component("RecycleScroller", RecycleScroller);

plugin.mount("#plugin");
