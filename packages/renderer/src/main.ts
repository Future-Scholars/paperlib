import { createApp } from "vue";
import App from "./App.vue";
import "./css/index.css";
import "./css/katex.min.css";
// @ts-ignore
import { RecycleScroller } from "vue-virtual-scroller";
import vSelect from "vue-select";
import { BIconChevronUp, BIconX } from "bootstrap-icons-vue";
import { Splitpanes, Pane } from "splitpanes";

// @ts-ignore
vSelect.props.components.default = () => ({
  Deselect: BIconX,
  OpenIndicator: BIconChevronUp,
});

const app = createApp(App);

app.component("RecycleScroller", RecycleScroller);
app.component("v-select", vSelect);
app.component("Splitpanes", Splitpanes);
app.component("Pane", Pane);

app.mount("#app");
