<template>
    <q-item
        clickable
        dense
        class="sidebar-list-item"
        active-class="sidebar-list-item-active"
        :active="active"
    >
        <q-icon
            class="sidebar-list-icon q-mr-sm"
            :name="icon"
        />
        <span class="sidebar-list-text"> {{ label }} </span>
        <q-spinner-oval
            class="q-ml-sm"
            color="primary"
            size="1em"
            v-if="isProgressViewShown && withSpinner"
        />
        <q-badge
          rounded class="absolute-right q-mr-sm sidebar-list-badge"
          :label="count"
          style="line-height: 0.9em"
          v-if="count != null && showCount"
        />
    </q-item>
</template>

<style lang="sass">
@import 'src/css/sidebar.scss'
</style>

<script lang="ts">
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

    if (props.withSpinner) {
      window.systemInteractor.registerState('viewState.processingQueueCount', (event, message) => {
        const processingQueueCount = JSON.parse(message as string) as number;
        if (processingQueueCount > 0) {
          isProgressViewShown.value = true;
        } else {
          isProgressViewShown.value = false;
        }
      });
    }

    return {
      isProgressViewShown,
      ...toRefs(props),
    };
  },
});
</script>
