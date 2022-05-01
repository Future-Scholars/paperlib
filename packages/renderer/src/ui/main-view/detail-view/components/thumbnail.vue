<script setup lang="ts">
import { debounce } from "../../../../utils/debounce";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

import { RenderParameters } from "pdfjs-dist/types/src/display/api";
import { onMounted, watch, ref, onDeactivated, onBeforeUnmount } from "vue";

const props = defineProps({
  url: {
    type: String,
    required: true,
  },
});

const isRendering = ref(true);

let worker: Worker;
const setWorker = () => {
  worker = new Worker("/src/workers/pdf.worker.min.js");
  GlobalWorkerOptions.workerPort = worker;
};
const destroyWorker = () => {
  worker.terminate();
};

const render = async () => {
  isRendering.value = true;
  const fileURL = await window.appInteractor.access(props.url, false);
  const pdf = await getDocument(fileURL).promise;
  const page = await pdf.getPage(1);
  var scale = 0.25;
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
  page.render(renderContext).promise.then(() => {
    isRendering.value = false;
  });
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

onBeforeUnmount(() => {
  destroyWorker();
});

watch(props, (props, prevProps) => {
  render();
});
</script>

<template>
  <div class="relative w-40 h-52 mt-1">
    <canvas
      id="thumbnail"
      class="absolute top-0 left-0 w-40 h-52 border-[1px] rounded-md hover:shadow-sm cursor-pointer"
      @click="onClick"
    />

    <Transition
      enter-active-class="transition ease-out duration-75"
      enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100"
      leave-to-class="transform opacity-0"
    >
      <div
        class="absolute top-0 left-0 rounded-md w-40 h-52 border-[1px] p-4 bg-white"
        v-if="isRendering"
      >
        <div class="flex h-full">
          <svg
            role="status"
            class="animate-spin w-5 h-5 text-neutral-200 fill-neutral-500 m-auto"
            viewBox="0 0 100 101"
            fill="none"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
        </div>
      </div>
    </Transition>
  </div>
</template>
