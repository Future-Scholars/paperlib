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
            <q-list dense style="min-width: 100px">
                <SortMenuItem label="Title" name="title" icon="bi-fonts" :sortBy="sortBy" @click="$emit('sortByChanged', 'title')"/>
                <SortMenuItem name="authors" label="Authors" icon="bi-person" :sortBy="sortBy" @click="$emit('sortByChanged', 'authors')"/>
                <SortMenuItem name="pubTime" label="Year" icon="bi-calendar3" :sortBy="sortBy" @click="$emit('sortByChanged', 'pubTime')"/>
                <SortMenuItem
                  name="publication" label="Publication" icon="bi-book" :sortBy="sortBy" @click="$emit('sortByChanged', 'publication')"
                />
                <SortMenuItem name="addTime" label="Add Time" icon="bi-clock" :sortBy="sortBy" @click="$emit('sortByChanged', 'addTime')"/>
                <q-separator />
                <SortMenuItem
                  name="desc" label="Descending" icon="bi-sort-down" :sortBy="sortOrder" @click="$emit('sortOrderChanged', 'desc')"
                />
                <SortMenuItem name="asc" label="Ascending" icon="bi-sort-up" :sortBy="sortOrder" @click="$emit('sortOrderChanged', 'asc')"/>
            </q-list>
        </q-menu>
    </q-btn>
</template>

<script>
import {defineComponent, toRefs} from 'vue';

import SortMenuItem from 'src/pages/views/toolbar_view/components/SortMenuItem.vue';

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
