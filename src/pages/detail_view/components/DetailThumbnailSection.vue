<template>
    <div v-show="isThumbnailShown">
      <div class="detail-section-title"> Preview </div>
        <q-icon name="bi-cloud-arrow-down" class='q-ml-sm' v-show="renderingState === 'clouding' && !isDownloading" style="cursor: pointer" @click="onCloudDownloadClicked"/>
        <q-spinner-oval
            class="q-ml-sm"
            color="primary"
            size="1em"
            v-if="isDownloading"
        />
        <div
            class="detail-skeleton q-mt-sm q-mb-md"
            v-show="renderingState === 'rendering'"
            key="skeleton"
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
        <canvas
            id="thumbnail"
            class="q-mt-sm q-mb-sm detail-skeleton"
            key="thumbnail"
            v-show="renderingState === 'showing'"
            v-on:dblclick="openThumbnail"
        />
    </div>
</template>

<script lang="ts">
import {defineComponent, ref, watch} from 'vue';

export default defineComponent({
  name: 'DetailThumbnailSection',
  components: {},
  props: {
    url: {
      type: String,
      required: true,
    }
  },
  setup(props) {
    const renderingState = ref('showing');
    const isThumbnailShown = ref(false);
    const isDownloading = ref(false);

    const worker = new Worker(new URL('./renderer.worker.js', import.meta.url));

    const registerCanvas = () => {
      let canvasMain = document.getElementById('thumbnail') as HTMLCanvasElement
      const canvas = canvasMain.transferControlToOffscreen()

      worker.postMessage(
        {
          signal: 'canvas',
          canvas: canvas,
        },
        [canvas]
      );

      worker.addEventListener('message', (e) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (e.data.signal === 'finished') {
          renderingState.value = 'showing';
        }
      });
    };


    const renderThumbnail = async () => {
      const fileURL = await window.entityInteractor.access(props.url, false);
      if (window.systemInteractor.getPreference('syncFileStorage') != 'local' && fileURL === '') {
        renderingState.value = 'clouding';
        isThumbnailShown.value = true
        return
      }
      else if (fileURL === '' || props.url === '') {
        renderingState.value = 'showing';
        isThumbnailShown.value = false;
        return
      }
 
      renderingState.value = 'rendering';

      try {
        worker.postMessage({
          signal: 'render',
          url: fileURL, 
          outputScale: window.devicePixelRatio, 
          invert: window.systemInteractor.getPreference('invertColor') && (window.systemInteractor.getState('viewState.theme').value as string) === 'dark'
        });
        isThumbnailShown.value = true;
      } catch (e) {
        console.log(e);
        isThumbnailShown.value = false;
      } 
    };

    const openThumbnail = () => {
      void window.entityInteractor.open(props.url);
    };

    const onCloudDownloadClicked = async () => {
      isDownloading.value = true;
      const fileURL = await window.entityInteractor.access(props.url, true);
      isDownloading.value = false;
      if (fileURL === '') {
        window.systemInteractor.setState('viewState.alertInformation', 'File is not available in cloud storage.');
        return
      } else {
        void renderThumbnail();
      }
    };

    window.systemInteractor.registerState('viewState.themeUpdated', (_event, _message) => {
      void renderThumbnail();
    });

    watch(props, () => {
        void renderThumbnail()
      }
    );

    return {
      renderingState,
      isThumbnailShown,
      isDownloading,
      registerCanvas,
      renderThumbnail,
      openThumbnail,
      onCloudDownloadClicked,
    };
  },
  mounted() {
    this.registerCanvas();
    void this.$nextTick(() => {
      let render = () => {
        void this.renderThumbnail();
      };
      void render();
    });
  },
});
</script>
