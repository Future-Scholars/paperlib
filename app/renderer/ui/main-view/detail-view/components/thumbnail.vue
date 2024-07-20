<script setup lang="ts">
import {
  BIconArrowClockwise,
  BIconCloudArrowDown,
  BIconPlus,
  BIconSearch,
} from "bootstrap-icons-vue";
import { ref, watch } from "vue";

import { disposable } from "@/base/dispose";
import { PaperEntity } from "@/models/paper-entity";

const props = defineProps({
  entity: {
    type: Object as () => PaperEntity,
    required: true,
  },
});

const emits = defineEmits(["event:modify", "event:locate"]);

const isRendering = ref(true);
const fileExistingStatus = ref(1);

const renderFromFile = async () => {
  isRendering.value = true;
  const fileURL = await PLAPI.fileService.access(props.entity.mainURL, false);
  if (fileURL.length === 0) {
    isRendering.value = false;
    fileExistingStatus.value = 1;
    return;
  } else if (fileURL.startsWith("downloadRequired://")) {
    isRendering.value = false;
    fileExistingStatus.value = 2;
    return;
  } else {
    fileExistingStatus.value = 0;
  }
  const thumbnailBuffer = await PLAPI.renderService.renderPDF(fileURL);

  if (thumbnailBuffer) {
    const canvas = document.getElementById(
      "preview-canvas"
    ) as HTMLCanvasElement;
    PLAPI.cacheService.updateThumbnailCache(props.entity, {
      blob: thumbnailBuffer.buffer,
      width: canvas.width,
      height: canvas.height,
    });

    await renderCanvas(thumbnailBuffer, canvas.width, canvas.height);
  }

  isRendering.value = false;
};

const renderCanvas = async (
  buffer: ArrayBuffer,
  width: number,
  height: number
) => {
  const revertColor =
    ((await PLMainAPI.windowProcessManagementService.isDarkMode()) &&
      (await PLMainAPI.preferenceService.get("invertColor"))) as boolean;

  return new Promise<void>((resolve) => {
    var canvas = document.getElementById("preview-canvas") as HTMLCanvasElement;
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext("2d") as CanvasRenderingContext2D;
    context.clearRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.onload = async () => {
      if (revertColor) {
        context.filter = "invert(0.9)";
        context.drawImage(img, 0, 0, width, height);
      } else {
        context.drawImage(img, 0, 0, width, height);
      }
      resolve();
    };

    if (buffer instanceof ArrayBuffer) {
      const url = URL.createObjectURL(
        new Blob([new Uint8Array(buffer)], { type: "image/png" })
      );
      img.src = url;
    } else {
      const url = URL.createObjectURL(
        new Blob([buffer], { type: "image/png" })
      );
      img.src = url;
    }
  });
};

const render = async () => {
  isRendering.value = true;
  fileExistingStatus.value = -1;

  if (props.entity.mainURL === "") {
    isRendering.value = false;
    fileExistingStatus.value = 1;
    return;
  }

  const fileURL = await PLAPI.fileService.access(props.entity.mainURL, false);
  if (
    props.entity.mainURL &&
    fileURL &&
    !fileURL.startsWith("downloadRequired://")
  ) {
    fileExistingStatus.value = 0;
    const cachedThumbnail = await PLAPI.cacheService.loadThumbnail(
      props.entity
    );
    if (cachedThumbnail?.blob && cachedThumbnail?.blob.byteLength > 0) {
      try {
        await renderCanvas(
          cachedThumbnail.blob,
          cachedThumbnail.width,
          cachedThumbnail.height
        );
      } catch (e) {
        console.error(e);
        await renderFromFile();
      }
    } else {
      await renderFromFile();
    }
    isRendering.value = false;
  } else {
    isRendering.value = false;
    if (fileURL.startsWith("downloadRequired://")) {
      fileExistingStatus.value = 2;
    } else {
      fileExistingStatus.value = 1;
    }
  }
};

const onClick = async (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();

  const fileURL = await PLAPI.fileService.access(props.entity.mainURL, false);
  PLAPI.fileService.open(fileURL);
};

const showFilePicker = async () => {
  const pickedFile = (await PLMainAPI.fileSystemService.showFilePicker())
    .filePaths[0];
  if (pickedFile) {
    emits("event:modify", pickedFile);
  }
};

const locatePDF = async () => {
  emits("event:locate");
};

const onWebdavDownloadClicked = async () => {
  isRendering.value = true;
  const fileURL = await PLAPI.fileService.access(props.entity.mainURL, true);
  isRendering.value = false;
  if (fileURL === "") {
    return;
  } else {
    render();
  }
};

const onRightClicked = (event: MouseEvent) => {
  PLMainAPI.contextMenuService.showThumbnailMenu(props.entity.mainURL);
};

disposable(
  PLMainAPI.contextMenuService.on("thumbnailContextMenuReplaceClicked", () => {
    showFilePicker();
  })
);

disposable(
  PLMainAPI.contextMenuService.on("thumbnailContextMenuRefreshClicked", () => {
    renderFromFile();
  })
);

disposable(
  PLUIAPILocal.uiStateService.on("renderRequired", () => {
    render();
  })
);

watch(
  () => props.entity.mainURL,
  () => {
    render();
  }
);
</script>

<template>
  <div
    class="relative mt-1"
    :class="fileExistingStatus !== 0 ? 'w-fit h-fit' : 'w-40 h-52'"
  >
    <div
      class="flex space-x-1 bg-neutral-200 dark:bg-neutral-700 rounded-md p-1 hover:bg-neutral-300 hover:dark:bg-neutral-600 hover:shadow-sm select-none cursor-pointer text-md"
      v-show="fileExistingStatus === 2"
      @click="onWebdavDownloadClicked"
    >
      <BIconCloudArrowDown class="text-xs my-auto" />
      <div class="text-xxs my-auto">webdav</div>
    </div>
    <div class="flex flex-wrap" v-show="fileExistingStatus === 1">
      <div
        class="flex space-x-1 bg-neutral-200 dark:bg-neutral-700 rounded-md p-1 hover:bg-neutral-300 hover:dark:bg-neutral-600 hover:shadow-sm select-none cursor-pointer mb-1 mr-1"
        @click="showFilePicker"
      >
        <BIconPlus class="text-xs my-auto" />
        <div class="text-xxs my-auto">{{ $t("menu.choose") }}</div>
      </div>
      <div
        class="flex space-x-1 bg-neutral-200 dark:bg-neutral-700 rounded-md p-1 hover:bg-neutral-300 hover:dark:bg-neutral-600 hover:shadow-sm select-none cursor-pointer mb-1 mr-1"
        @click="render"
      >
        <BIconArrowClockwise class="text-xs my-auto" />
        <div class="text-xxs my-auto">{{ $t("menu.refresh") }}</div>
      </div>
      <div
        class="flex space-x-1 bg-neutral-200 dark:bg-neutral-700 rounded-md p-1 hover:bg-neutral-300 hover:dark:bg-neutral-600 hover:shadow-sm select-none cursor-pointer mb-1 mr-1"
        @click="locatePDF"
      >
        <BIconSearch class="text-xs my-auto" />
        <div class="text-xxs my-auto">{{ $t("menu.locate") }}</div>
      </div>
    </div>
    <canvas
      id="preview-canvas"
      class="absolute top-0 left-0 w-40 h-52 border-[1px] dark:border-neutral-800 rounded-md hover:shadow-sm cursor-pointer"
      @click="onClick"
      @contextmenu="(e: MouseEvent) => onRightClicked(e)"
      v-show="fileExistingStatus === 0"
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
        class="absolute top-0 left-0 rounded-md w-40 h-52 border-[1px] dark:border-neutral-700 p-4 bg-white dark:bg-neutral-800"
        v-if="isRendering && fileExistingStatus === 0"
      >
        <div class="flex h-full">
          <svg
            role="status"
            class="animate-spin w-5 h-5 text-neutral-200 fill-neutral-500 dark:text-neutral-700 dark:fill-neutral-500 m-auto"
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
