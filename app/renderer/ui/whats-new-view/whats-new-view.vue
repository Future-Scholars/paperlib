<script setup lang="ts">
import WhatsNewViewCn from "./whats-new-view-cn.vue";
import WhatsNewViewEn from "./whats-new-view-en.vue";

const prefState = preferenceService.useState();
</script>

<style>
#release-note h2 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.2em;
}

#release-note ol {
  margin-bottom: 2em;
  list-style-type: circle;
}
</style>

<template>
  <div>
    <WhatsNewViewCn v-if="prefState.language === 'zh-CN'" />
    <WhatsNewViewEn v-else />
  </div>
</template>
