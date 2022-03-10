<template>
    <q-item
        clickable
        dense
        class="sidebar-list-item"
        active-class="sidebar-list-item-active"
        :active="active"
    >
        <q-icon
            class="sidebar-list-icon q-mr-md"
            color="blue-7"
            :name="icon"
        />
        <span class=""> {{ label }} </span>
        <q-spinner-oval
            class="q-ml-sm"
            color="primary"
            size="1em"
            v-if="isProgressViewShown && withSpinner"
        />
        <q-badge
          rounded class="absolute-right q-mt-sm q-mb-sm q-mr-sm"
          text-color="primary"
          align="middle"
          :label="count"
          v-if="count != null && showCount"
          style="background-color: rgb(202, 202, 202); font-size: 0.8em"
        />
    </q-item>
</template>

<style lang="sass">
@import 'src/css/sidebar.scss'
</style>

<script>
import {defineComponent, ref, toRefs} from 'vue';

export default defineComponent({
  name: 'SidebarItem',
  props: {
    label: String,
    icon: String,
    count: Number,
    withSpinner: Boolean,
    active: Boolean,
    showCount: Boolean,
  },
  setup(props) {
    const isProgressViewShown = ref(false);

    window.api.registerSignal('viewState.processingQueueCount', (event, message) => {
      const processingQueueCount = JSON.parse(message);
      if (processingQueueCount > 0) {
        isProgressViewShown.value = true;
      } else {
        isProgressViewShown.value = false;
      }
    });

    return {
      isProgressViewShown,
      ...toRefs(props),
    };
  },
});
</script>
