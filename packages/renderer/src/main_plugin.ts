import { createApp } from "vue";
// @ts-ignore
import { RecycleScroller } from "vue-virtual-scroller";

import Plugin from "./Plugin.vue";
import "./css/index.css";

const plugin = createApp(Plugin);
plugin.component("RecycleScroller", RecycleScroller);

plugin.mount("#plugin");
