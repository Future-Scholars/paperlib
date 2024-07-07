<script setup lang="ts">
import { BIconShareFill } from "bootstrap-icons-vue";

const props = defineProps({
  citationCount: String,
  influentialCitationCount: String,
});
</script>

<template>
  <div class="flex flex-wrap mt-1 space-x-1 cursor-pointer">
    <div class="text-xxs group" title="All">
      {{ citationCount }}
    </div>
    <div class="text-xxs text-neutral-400 group" title="Influential">
      ({{ influentialCitationCount }})
    </div>
  </div>
</template>
