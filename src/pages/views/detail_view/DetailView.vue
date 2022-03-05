<template>
    <div
        id="detail-view"
        class="col full-height"
        style="
            min-width: 300px;
            max-width: 300px;
            border-left: 1px solid #ddd;
            margin-left: -10px;
            padding-left: 15px;
            padding-right: 15px;
        "
    >
        <div class="detail-title">{{ entity.title }}</div>
        <DetailTextSection title="Authors" :value="entity.authors" />
        <DetailTextSection title="Publication" :value="entity.publication" />
        <DetailTextSection title="Publication Year" :value="entity.pubTime" />
        <DetailTextSection title="Tags" :value="entity.tags.map((tag) => tag.name).join('; ')" v-if="entity.tags.length > 0" />
        <DetailTextSection title="Folders" :value="entity.folders.map((folder) => folder.name).join('; ')" v-if="entity.folders.length > 0" />
        <DetailTextSection title="Add Time" :value="entity.addTime.toLocaleDateString()" />
        <DetailRatingSection :initRating="entity.rating" @rating-changed="onRatingChanged"/>
        <DetailThumbnailSection :url="getJoinedPath(entity.mainURL)" />
        <DetailTextSection title="Note" :value="entity.note" v-if="entity.note.length > 0" />
        <DetailSupSection :urls="entity.supURLs.map((url) => getJoinedPath(url))" @delete-sup="onDeleteSup"/>
    </div>
</template>

<style lang="sass">
@import 'src/css/detailview.scss'
</style>

<script>
import { defineComponent, toRefs } from "vue";
import dragDrop from "drag-drop";

import { PaperEntityDraft } from "src/models/PaperEntity";

import DetailTextSection from "src/pages/views/detail_view/components/DetailTextSection.vue";
import DetailRatingSection from "src/pages/views/detail_view/components/DetailRatingSection.vue";
import DetailThumbnailSection from "src/pages/views/detail_view/components/DetailThumbnailSection.vue";
import DetailSupSection from "src/pages/views/detail_view/components/DetailSupSection.vue";

export default defineComponent({
    name: "DetailView",

    components: {
        DetailTextSection,
        DetailRatingSection,
        DetailThumbnailSection,
        DetailSupSection
    },

    props: {
        entity: {
            type: Object,
            required: true,
        },
    },

    setup(props) {
        const onRatingChanged = (value) => {
            let entityDraft = new PaperEntityDraft(props.entity);
            entityDraft.setValue("rating", value, false);
            window.api.update(JSON.stringify([entityDraft]));
        };

        const onDeleteSup = (url) => {
            let entityDraft = new PaperEntityDraft(props.entity);
            window.api.deleteSup(entityDraft, url);
        };

        const onAddSups = (urls) => {
            let entityDraft = new PaperEntityDraft(props.entity);
            entityDraft.setValue("supURLs", [...entityDraft.supURLs, ...urls], false);
            window.api.update(JSON.stringify([entityDraft]));
        }

        const registerDropHandler = () => {
            dragDrop("#detail-view", {
                onDrop: async (files, pos, fileList, directories) => {
                    const filePaths = [];
                    files.forEach((file) => {
                        filePaths.push(file.path);
                    });
                    onAddSups(filePaths)
                },
            });
        };

        const getJoinedPath = (url) => {
            return window.api.getJoinedPath(url, true);
        };

        return {
            onRatingChanged,
            onDeleteSup,
            onAddSups,
            registerDropHandler,
            getJoinedPath,
            ...toRefs(props),
        };
    },
    mounted() {
        this.registerDropHandler();
    },
});
</script>
