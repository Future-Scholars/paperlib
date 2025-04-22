<script setup lang="ts">
import { BIconGithub, BIconLink } from "bootstrap-icons-vue";

import { ISupplementary } from '@/models/supplementary';
import { getProtocol } from '@/base/url'
import { computed, ComputedRef, ref } from 'vue';
import Section from "./section.vue";
import { Entity } from '@/models/entity';
import { disposable } from "@/base/dispose";

const props = defineProps({
  entity: {
    type: Object as () => Entity,
    required: true,
  },
});

const localSups: ComputedRef<Record<string, ISupplementary>> = computed(() => {
  const localSups = {};
  Object.entries(props.entity.supplementaries).forEach(([key, value]) => {
    if (!["http", "https"].includes(getProtocol(value.url))) {
      localSups[key] = value;
    }
  });
  return localSups;
});

const onlineSups: ComputedRef<Record<string, ISupplementary>> = computed(() => {
  const onlineSups = {};

  if (props.entity.arxiv) {
    onlineSups[props.entity.arxiv] = {
      _id: "auto-generated-arxiv",
      name: "arXiv",
      url: `https://arxiv.org/abs/${props.entity.arxiv!.toLowerCase().replaceAll('arxiv:', '').trim()}`,
    };
  }
  if (props.entity.doi) {
    onlineSups[props.entity.doi] = {
      _id: "auto-generated-doi",
      name: "DOI",
      url: `https://doi.org/${props.entity.doi}`,
    };
  }

  Object.entries(props.entity.supplementaries).forEach(([key, value]) => {
    if (["http", "https"].includes(getProtocol(value.url))) {
      onlineSups[key] = value;
    }
  });
  return onlineSups;
});

const onClicked = async (url: string) => {
  PLAPI.fileService.open(await PLAPI.fileService.access(url, true));
};

const onRightClicked = (event: MouseEvent, id: string) => {
  if (id.startsWith("auto-generated-")) {
    event.preventDefault();
    return;
  }
  PLMainAPI.contextMenuService.showSupMenu(id);
};

const editingId = ref("");
disposable(
  PLMainAPI.contextMenuService.on(
    "supContextMenuDeleteClicked",
    (newValue: { value: string }) => {
      onDeleteSup([newValue.value]);
    }
  )
);

disposable(
  PLMainAPI.contextMenuService.on(
    "supContextMenuRenameClicked",
    (newValue: { value: string }) => {
      editingId.value = newValue.value;
    }
  )
);

const onDeleteSup = (supIds: string[]) => {
  const paperEntityDraft = new Entity(props.entity);
  PLAPI.paperService.deleteSups(paperEntityDraft, supIds);
};

const onRenameSup = (event: Event, id: string) => {
  event.preventDefault();
  event.stopPropagation();

  editingId.value = "";

  const name = (event.target as HTMLInputElement).value;

  if (name === "") {
    return;
  }

  const sup = props.entity.supplementaries[id];
  if (sup) {
    sup.name = name;
  } else {
    return;
  }
  PLAPI.paperService.updateSups(props.entity, [sup])
};

</script>

<template>
  <div class="flex flex-col">
    <Section
        :title="$t('mainview.onlineResources')"
        v-if="Object.keys(onlineSups).length > 0"
      >
      <div class="flex flex-wrap mt-1 text-xs space-x-1">
        <div
          class="flex space-x-1 bg-neutral-200 dark:bg-neutral-700 rounded-md p-1 hover:bg-neutral-300 hover:shadow-sm hover:dark:bg-neutral-600 select-none cursor-pointer"
          v-for="sup of onlineSups"
          @click="onClicked(sup.url)"
          @contextmenu="(e: MouseEvent) => onRightClicked(e, sup._id)"
        > 
          <BIconGithub class="text-xs my-auto" v-if="sup.url.includes('github')" />
          <BIconLink class="text-xs my-auto" v-else />
          <div class="text-xxs my-auto" v-if="editingId !== sup._id">
            {{ sup.name }}
          </div>
          <input
            v-else
            class="my-auto text-xxs bg-transparent grow whitespace-nowrap border-2 rounded-md px-1 border-accentlight dark:border-accentdark truncate"
            type="text"
            autofocus
            :value="sup.name"
            @click.stop
            @keydown.enter="(e: Event) => onRenameSup(e, sup._id)"
          />
        </div>
      </div>
    </Section>

    <Section
        :title="$t('mainview.supplementaries')"
        v-if="Object.keys(localSups).length > 0"
      >
      <div class="flex flex-wrap mt-1 text-xs space-x-1">
        <div
          class="flex space-x-1 bg-neutral-200 dark:bg-neutral-700 rounded-md p-1 hover:bg-neutral-300 hover:shadow-sm hover:dark:bg-neutral-600 select-none cursor-pointer"
          v-for="sup of localSups"
          @click="onClicked(sup.url)"
          @contextmenu="(e: MouseEvent) => onRightClicked(e, sup._id)"
        >
          <div v-if="sup._id === entity.defaultSup" class="w-[3px] h-3 bg-neutral-600 dark:bg-neutral-300 rounded-sm my-auto"></div>
          <div class="text-xxs my-auto">
            {{ sup.name }}
          </div>
        </div>
      </div>
    </Section>


  </div>
</template>
