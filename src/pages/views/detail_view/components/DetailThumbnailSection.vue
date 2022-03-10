<template>
    <div v-show="isThumbnailShown">
        <div class="detail-section-title"> Preview </div>
        <div
            style="
                height: 210px;
                width: 150px;
                position: absolute;
                border: 1px solid #ddd;
                border-radius: 5px;
            "
            v-show="isRendering"
        >
            <q-card flat>
                <q-card-section>
                    <q-skeleton type="text" class="text-subtitle1" />
                    <q-skeleton type="text" width="50%" class="text-subtitle1" />
                    <q-skeleton type="text" class="text-caption" />
                    <q-skeleton type="text" class="text-caption" />
                    <q-skeleton type="text" class="text-caption" />
                    <q-skeleton type="text" width="80%" class="text-caption" />
                    <q-skeleton type="text" class="text-caption" />
                    <q-skeleton type="text" class="text-caption" />
                </q-card-section>
            </q-card>
        </div>

        <div
            style="
                height: 210px;
                width: 150px;
                position: absolute;
                border: 1px solid #ddd;
                border-radius: 5px;
            "
            v-on:dblclick="openThumbnail"
            v-show="!isRendering"
        />
        <canvas
            id="thumbnail"
            style="height: 210px; width: 150px; margin-bottom: 1em"
            v-show="!isRendering"
        />
    </div>
</template>

<style lang="sass">
@import 'src/css/detailview.scss'
</style>

<script>
import {defineComponent, ref, watch} from 'vue';
import * as pdfjs from 'pdfjs-dist';

export default defineComponent({
  name: 'DetailThumbnailSection',
  components: {},
  props: {
    url: String,
  },
  setup(props) {
    const isRendering = ref(false);
    const isThumbnailShown = ref(false);

    const pdfjsWorker = import('pdfjs-dist/build/pdf.worker.entry');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

    const renderThumbnail = async () => {
      if (isRendering.value) {
        return;
      }
      isRendering.value = true;

      try {
        const pdf = await pdfjs.getDocument(props.url).promise;
        const page = await pdf.getPage(1);

        const scale = 0.3;
        const viewport = page.getViewport({scale: scale});
        // Support HiDPI-screens.
        const outputScale = window.devicePixelRatio || 1;

        const canvas = document.getElementById('thumbnail');
        const context = canvas.getContext('2d');

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);

        const transform =
                    outputScale !== 1 ?
                        [outputScale, 0, 0, outputScale, 0, 0] :
                        null;

        const renderContext = {
          canvasContext: context,
          transform: transform,
          viewport: viewport,
        };
        page.render(renderContext);
        isThumbnailShown.value = true;
      } catch (e) {
        console.log(e);
        isThumbnailShown.value = false;
      } finally {
        isRendering.value = false;
      }
    };

    const openThumbnail = () => {
      window.api.open(props.url);
    };

    watch(
        () => props.url,
        renderThumbnail,
    );

    return {
      isRendering,
      isThumbnailShown,
      renderThumbnail,
      openThumbnail,
    };
  },
  mounted() {
    this.$nextTick(this.renderThumbnail);
  },
});
</script>
