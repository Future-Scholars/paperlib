import { createApp } from "vue";
import Preview from "./Preview.vue";
import "./css/index.css";

const preview = createApp(Preview);

preview.mount("#preview");
