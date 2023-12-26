<script setup lang="ts">
import { BIconStar, BIconStarFill } from "bootstrap-icons-vue";
import { ref, watch } from "vue";

const props = defineProps({
  rating: {
    type: Number,
    required: true,
  },
});
const rating = ref(props.rating || 0);
const hoverRating = ref(0);
const emits = defineEmits(["event:change"]);

const onHover = (value: number) => {
  hoverRating.value = value;
};

const onHoverLeave = () => {
  hoverRating.value = 0;
};

watch(props, (props, prevProps) => {
  rating.value = props.rating;
  hoverRating.value = 0;
});
</script>

<template>
  <div class="flex text-xs space-x-1 mt-1">
    <BIconStarFill
      :id="`rating-${n}-btn`"
      @click="emits('event:change', n)"
      v-for="n in rating"
    />
    <div
      :id="`rating-${n}-btn`"
      @click="emits('event:change', n + rating)"
      v-for="n in 5 - rating"
    >
      <BIconStar
        :class="n + rating <= hoverRating ? 'hidden' : 'block'"
        v-on:mouseover="onHover(n + rating)"
        v-on:mouseleave="onHoverLeave"
      />
      <BIconStarFill
        :class="n + rating <= hoverRating ? 'block' : 'hidden'"
        v-on:mouseover="onHover(n + rating)"
        v-on:mouseleave="onHoverLeave"
      />
    </div>
  </div>
</template>
