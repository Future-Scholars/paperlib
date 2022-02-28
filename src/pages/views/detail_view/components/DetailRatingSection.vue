<template>
    <div class="detail-section-title">Rating</div>
    <q-rating
        :model-value="initRating"
        size="1em"
        :max="5"
        color="grey-8"
        style="margin-bottom: 1em"
        @update:model-value="onRatingChanged"
    />
</template>

<style lang="sass">
@import 'src/css/detailview.scss'
</style>

<script>
import { defineComponent, ref, watch, defineEmits } from "vue";

export default defineComponent({
    name: "DetailRatingSection",
    components: {},
    props: {
        initRating: Number,
    },
    emits: ["ratingChanged"],
    setup(props, { emit }) {
        const onRatingChanged = async (newValue) => {
            emit('ratingChanged', newValue)
        };

        return {
            onRatingChanged,
        };
    }
});
</script>
