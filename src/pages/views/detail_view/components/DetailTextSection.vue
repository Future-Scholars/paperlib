<template>
    <div class="detail-section-title">{{ title }}</div>
    <div class="detail-section-content">{{ value }}</div>
</template>

<style lang="sass">
@import 'src/css/detailview.scss'
</style>

<script>
import { defineComponent } from "vue";

export default defineComponent({
    name: "DetailTextSection",
    components: {},
    props: {
        title: String,
        value: String,
    }
});
</script>
