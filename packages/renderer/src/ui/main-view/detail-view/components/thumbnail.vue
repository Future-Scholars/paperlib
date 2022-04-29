<script setup lang="ts">
import { debounce } from "../../../../utils/debounce";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

import { RenderParameters } from "pdfjs-dist/types/src/display/api";
import { onMounted, watch, ref } from "vue";

const props = defineProps({
  url: {
    type: String,
    required: true,
  },
});

const isRendering = ref(true);

const setWorker = () => {
  const worker = new Worker(
    "/src/ui/main-view/detail-view/components/pdf.worker.min.js"
  );
  GlobalWorkerOptions.workerPort = worker;
};

const render = async () => {
  isRendering.value = true;
  const fileURL = await window.appInteractor.access(props.url, false);
  const pdf = await getDocument(fileURL).promise;
  const page = await pdf.getPage(1);
  var scale = 0.15;
  var viewport = page.getViewport({ scale: scale });
  var outputScale = window.devicePixelRatio || 1;
  var canvas = document.getElementById("thumbnail") as HTMLCanvasElement;
  var context = canvas.getContext("2d");
  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);
  var transform =
    outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
  var renderContext = {
    canvasContext: context,
    transform: transform,
    viewport: viewport,
  } as RenderParameters;
  page.render(renderContext);

  debounce(() => {
    isRendering.value = false;
  }, 500)();
};

const onClick = async (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();

  const fileURL = await window.appInteractor.access(props.url, false);
  window.appInteractor.open(fileURL);
};

onMounted(() => {
  setWorker();
  render();
});

watch(props, (props, prevProps) => {
  render();
});
</script>

<template>
  <div>
    <div class="rounded-md w-40 h-52 border-[1px] p-4" v-if="isRendering">
      <div class="animate-pulse flex">
        <div class="flex-1 space-y-5 py-1">
          <div class="h-4 bg-neutral-200 rounded"></div>
          <div class="space-y-4">
            <div class="grid grid-cols-3 gap-4">
              <div class="h-2 bg-neutral-200 rounded col-span-2"></div>
              <div class="h-2 bg-neutral-200 rounded col-span-1"></div>
            </div>
            <div class="h-4 bg-neutral-200 rounded"></div>
            <div class="h-2 bg-neutral-200 rounded"></div>
            <div class="h-2 bg-neutral-200 rounded"></div>
            <div class="h-3 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
    <canvas
      id="thumbnail"
      class="w-40 h-52 border-[1px] rounded-md hover:shadow-sm cursor-pointer"
      v-show="!isRendering"
      @click="onClick"
    />
  </div>
</template>
