<template>
  <div>
    <div class="detail-section-title">Rating</div>
    <q-rating
        :model-value="initRating"
        size="1em"
        :max="5"
        color="secondary"
        style="margin-bottom: 1em"
        @update:model-value="onRatingChanged"
    />
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'DetailRatingSection',
  components: {},
  props: {
    initRating: Number,
  },
  emits: ['rating-changed'],
  setup(props, {emit}) {
    const onRatingChanged = (newValue: number) => {
      emit('rating-changed', newValue);
    };

    return {
      onRatingChanged,
    };
  },
});
</script>
