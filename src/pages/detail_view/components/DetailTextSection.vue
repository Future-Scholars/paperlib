<template>
  <div>
    <div class="detail-section-title">{{ title }}</div>
    <div class="detail-section-content">{{ value }}</div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'DetailTextSection',
  components: {},
  props: {
    title: String,
    value: String,
  },
});
</script>
