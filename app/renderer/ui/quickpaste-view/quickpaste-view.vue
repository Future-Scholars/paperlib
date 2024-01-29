<script setup lang="ts">
import {
  BIconArrowReturnLeft,
  BIconCommand,
  BIconLink,
  BIconShift,
} from "bootstrap-icons-vue";
import { Ref, nextTick, onMounted, ref } from "vue";

import { disposable } from "@/base/dispose";
import { debounce } from "@/base/misc";
import { CategorizerType, PaperFolder } from "@/models/categorizer";
import { PaperEntity } from "@/models/paper-entity";
import { PaperFilterOptions } from "@/renderer/services/paper-service";

import TableItem from "./components/table-item.vue";

// ====================
// Data
// ====================
const paperEntities: Ref<PaperEntity[]> = ref([]);
const folders: Ref<PaperFolder[]> = ref([]);

// ====================
// State
// ====================
const searchInput = ref(null);
const exportMode = ref("BibTex");
const searchText = ref("");
const searchDebounce = ref(300);
const selectedIndex: Ref<number> = ref(0);
const linkedFolder = ref("");
const mainviewSortBy = ref("addTime");
const mainviewSortOrder: Ref<"desc" | "asce"> = ref("desc");

// ====================
// Event Handler
// ====================
const onSearchTextChanged = debounce(async () => {
  if (searchText.value) {
    paperEntities.value = (await PLAPI.paperService.load(
      new PaperFilterOptions({
        search: searchText.value,
        searchMode: "general",
        flaged: false,
        tag: "",
        folder: "",
        limit: 8,
      }).toString(),
      mainviewSortBy.value,
      mainviewSortOrder.value
    )) as PaperEntity[];

    // @ts-ignore
    paperEntities.value.push({
      id: "search-in-google-scholar",
      title: "Search in Google Scholar...",
    });

    const newHeight = Math.min(28 * paperEntities.value.length + 78, 394);

    await PLMainAPI.windowProcessManagementService.resize(
      "quickpasteProcess",
      600,
      newHeight
    );
  } else {
    await PLMainAPI.windowProcessManagementService.resize(
      "quickpasteProcess",
      600,
      76
    );
    paperEntities.value = [];
  }
}, searchDebounce.value);

const exportSelectedCiteKeys = async () => {
  const selectedEntity = paperEntities.value[selectedIndex.value];
  if (selectedEntity && selectedEntity.id === "search-in-google-scholar") {
    await PLAPI.fileService.open(
      `https://scholar.google.com/scholar?q=${searchText.value}`
    );
  } else {
    await PLAPI.referenceService.export([selectedEntity] as any, "BibTex-Key");

    if (linkedFolder.value) {
      await PLAPI.paperService.updateWithCategorizer(
        [`${selectedEntity.id}`],
        new PaperFolder({ name: linkedFolder.value }),
        CategorizerType.PaperFolder
      );
    }
  }

  searchText.value = "";
  paperEntities.value = [];

  await PLMainAPI.windowProcessManagementService.hide(
    "quickpasteProcess",
    true
  );
};

const exportSelectedCiteBodies = async () => {
  const selectedEntity = paperEntities.value[selectedIndex.value];
  if (selectedEntity && selectedEntity.id === "search-in-google-scholar") {
    await PLAPI.fileService.open(
      `https://scholar.google.com/scholar?q=${searchText.value}`
    );
  } else {
    await PLAPI.referenceService.export(
      [selectedEntity] as any,
      exportMode.value
    );

    if (linkedFolder.value) {
      await PLAPI.paperService.updateWithCategorizer(
        [`${selectedEntity.id}`],
        new PaperFolder({ name: linkedFolder.value }),
        CategorizerType.PaperFolder
      );
    }
  }

  searchText.value = "";
  paperEntities.value = [];

  await PLMainAPI.windowProcessManagementService.hide(
    "quickpasteProcess",
    true
  );
};

const exportSelectedCiteBodiesInFolder = async () => {
  const selectedEntity = paperEntities.value[selectedIndex.value];
  if (selectedEntity && selectedEntity.id === "search-in-google-scholar") {
    await PLAPI.fileService.open(
      `https://scholar.google.com/scholar?q=${searchText.value}`
    );
  } else {
    if (exportMode.value === "BibTex") {
      await PLAPI.referenceService.export(
        [selectedEntity] as any,
        "BibTex-In-Folder"
      );
    } else if (exportMode.value === "PlainText") {
      await PLAPI.referenceService.export(
        [selectedEntity] as any,
        "PlainText-In-Folder"
      );
    }

    if (linkedFolder.value) {
      await PLAPI.paperService.updateWithCategorizer(
        [`${selectedEntity.id}`],
        new PaperFolder({ name: linkedFolder.value }),
        CategorizerType.PaperFolder
      );
    }
  }

  searchText.value = "";
  paperEntities.value = [];

  await PLMainAPI.windowProcessManagementService.hide(
    "quickpasteProcess",
    true
  );
};

const onLinkClicked = async () => {
  folders.value = (
    await PLAPI.categorizerService.load(
      CategorizerType.PaperFolder,
      "name",
      "desc"
    )
  ).filter((f) => f.name !== "Folders") as PaperFolder[];
  PLMainAPI.contextMenuService.showQuickpasteLinkMenu(folders.value as any);
};

const onUnlinkClicked = async () => {
  await PLAPI.preferenceService.set({ pluginLinkedFolder: "" });
  linkedFolder.value = "";
  // @ts-ignore
  searchInput.value.focus();
};

const checkLinkedFolder = async () => {
  folders.value = (
    await PLAPI.categorizerService.load(
      CategorizerType.PaperFolder,
      "name",
      "desc"
    )
  ).filter((f) => f.name !== "Folders") as PaperFolder[];
  linkedFolder.value = (await PLAPI.preferenceService.get(
    "pluginLinkedFolder"
  )) as string;

  if (!folders.value.map((f) => f.name).includes(linkedFolder.value)) {
    linkedFolder.value = "";
  }
};

disposable(
  shortcutService.registerInInputField("ArrowDown", () => {
    selectedIndex.value = Math.min(
      paperEntities.value.length - 1,
      selectedIndex.value + 1
    );
    // @ts-ignore
    searchInput.value.focus();
  })
);

disposable(
  shortcutService.registerInInputField("ArrowUp", () => {
    selectedIndex.value = Math.max(0, selectedIndex.value - 1);
    // @ts-ignore
    searchInput.value.focus();
  })
);

disposable(
  shortcutService.registerInInputField("ctrlmeta+Enter", async () => {
    await exportSelectedCiteBodiesInFolder();

    // @ts-ignore
    searchInput.value.focus();
  })
);

disposable(
  shortcutService.registerInInputField("Tab", () => {
    exportMode.value = exportMode.value === "BibTex" ? "PlainText" : "BibTex";
    // @ts-ignore
    searchInput.value.focus();
  })
);

disposable(
  shortcutService.registerInInputField("shift+Enter", async () => {
    await exportSelectedCiteKeys();
    // @ts-ignore
    searchInput.value.focus();
  })
);

disposable(
  shortcutService.registerInInputField("Enter", async () => {
    await exportSelectedCiteBodies();
    // @ts-ignore
    searchInput.value.focus();
  })
);

disposable(
  shortcutService.registerInInputField("Escape", async () => {
    searchText.value = "";
    paperEntities.value = [];
    await PLMainAPI.windowProcessManagementService.hide(
      "quickpasteProcess",
      true
    );
  })
);

disposable(
  PLMainAPI.contextMenuService.on(
    "linkToFolderClicked",
    async (newValue: { value: string }) => {
      const folderName = newValue.value;
      if (
        !Object.values(folders.value)
          .map((f) => f.name)
          .includes(folderName)
      ) {
        await PLAPI.categorizerService.create(
          CategorizerType.PaperFolder,
          new PaperFolder({ name: folderName })
        );
      }

      await PLAPI.preferenceService.set({ pluginLinkedFolder: folderName });
      linkedFolder.value = folderName;
    }
  )
);

disposable(
  PLAPI.preferenceService.onChanged(
    "pluginLinkedFolder",
    (newValue: { value: string }) => {
      linkedFolder.value = newValue.value as string;
    }
  )
);

disposable(
  PLMainAPI.windowProcessManagementService.on(
    "quickpasteProcess",
    (payload: { value: string }) => {
      if (payload.value === "show" || payload.value === "hide") {
        paperEntities.value = [];
      }
    }
  )
);

onMounted(() => {
  nextTick(async () => {
    await checkLinkedFolder();
  });
});
</script>

<template>
  <div class="w-full text-neutral-700 dark:text-neutral-200">
    <div class="flex">
      <input
        ref="searchInput"
        class="w-full h-12 text-sm px-3 bg-transparent focus:outline-none grow"
        type="text"
        autofocus
        :placeholder="$t('plugin.searchinpaperlib')"
        v-model="searchText"
        @input="onSearchTextChanged"
      />
      <div
        class="flex space-x-2 mr-2 text-xxs my-auto select-none text-neutral-400 border-[1px] border-neutral-400 dark:border-neutral-500 rounded-md px-2 py-1 hover:dark:border-neutral-200 hover:dark:text-neutral-200 hover:border-neutral-600 hover:text-neutral-600 transition-colors"
        @click="exportMode = exportMode === 'BibTex' ? 'PlainText' : 'BibTex'"
      >
        {{ exportMode }}
      </div>
    </div>

    <hr class="border-neutral-300 dark:border-neutral-700 mx-2" />

    <div class="w-full px-2">
      <div class="flex flex-col pt-1">
        <TableItem
          v-for="(item, index) in paperEntities"
          :title="item.title"
          :authors="item.authors"
          :year="item.pubTime"
          :publication="item.publication"
          :active="selectedIndex == index"
          class="h-[28px]"
          @click="() => {}"
        />
      </div>
    </div>

    <div
      class="h-[24px] p-2 text-xxs text-neutral-400 flex justify-between fixed bottom-[6px]"
    >
      <div
        class="flex my-auto space-x-4 ml-1 hover:text-neutral-600 hover:dark:text-neutral-300 transition-colors"
      >
        <div
          class="flex space-x-1"
          @click="onLinkClicked"
          v-if="linkedFolder === ''"
        >
          <BIconLink class="my-auto text-base" />
          <span class="my-auto mr-1 select-none">{{
            $t("plugin.linkfolder")
          }}</span>
        </div>
        <div
          class="flex space-x-1"
          @click="onUnlinkClicked"
          v-if="linkedFolder !== ''"
          :class="
            linkedFolder !== ''
              ? 'text-neutral-600 dark:text-neutral-300'
              : 'text-neutral-400'
          "
        >
          <BIconLink class="my-auto text-base" />
          <span class="my-auto mr-1 select-none">{{ linkedFolder }}</span>
        </div>
      </div>

      <div class="flex my-auto space-x-4 right-2 fixed">
        <div class="flex">
          <span class="my-auto mr-1 select-none">{{
            $t("plugin.citekey")
          }}</span>
          <div class="flex space-x-1">
            <BIconShift class="my-auto" /><BIconArrowReturnLeft
              class="my-auto"
            />
          </div>
        </div>
        <div class="flex" v-if="linkedFolder !== ''">
          <span class="my-auto mr-1 select-none">{{
            $t("plugin.allref")
          }}</span>
          <div class="flex space-x-1">
            <BIconCommand class="my-auto" />
            <BIconArrowReturnLeft class="my-auto" />
          </div>
        </div>
        <div class="flex">
          <span class="my-auto mr-1 select-none">{{
            $t("plugin.singleref")
          }}</span>
          <div class="flex space-x-1">
            <BIconArrowReturnLeft class="my-auto" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
