<template>
    <q-btn
        flat
        size="sm"
        padding="xs sm"
        class="float-right q-mr-sm"
        color="grey-7"
        icon="bi-filter-right"
    >
        <q-menu>
            <q-list dense style="min-width: 100px" class="menu-list">
                <SortMenuItem label="Title" name="title" icon="bi-fonts" :sortBy="sortBy" @click="$emit('sortby-changed', 'title')"/>
                <SortMenuItem name="authors" label="Authors" icon="bi-person" :sortBy="sortBy" @click="$emit('sortby-changed', 'authors')"/>
                <SortMenuItem name="pubTime" label="Year" icon="bi-calendar3" :sortBy="sortBy" @click="$emit('sortby-changed', 'pubTime')"/>
                <SortMenuItem
                  name="publication" label="Publication" icon="bi-book" :sortBy="sortBy" @click="$emit('sortby-changed', 'publication')"
                />
                <SortMenuItem name="addTime" label="Add Time" icon="bi-clock" :sortBy="sortBy" @click="$emit('sortby-changed', 'addTime')"/>
                <q-separator />
                <SortMenuItem
                  name="desc" label="Descending" icon="bi-sort-down" :sortBy="sortOrder" @click="$emit('sort-order-changed', 'desc')"
                />
                <SortMenuItem name="asc" label="Ascending" icon="bi-sort-up" :sortBy="sortOrder" @click="$emit('sort-order-changed', 'asc')"/>
            </q-list>
        </q-menu>
    </q-btn>
</template>

<script lang="ts">
import {defineComponent, toRefs} from 'vue';

import SortMenuItem from './SortMenuItem.vue';

export default defineComponent({
  name: 'SortMenu',
  components: {
    SortMenuItem,
  },
  props: {
    sortBy: String,
    sortOrder: String,
  },

  setup(props) {
    return {
      ...toRefs(props),
    };
  },
});
</script>
