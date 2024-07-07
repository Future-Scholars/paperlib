<script setup lang="ts">
const props = defineProps({
  sups: Object as () => Array<string>,
  editingSup: String,
});

const getDisplayName = (sup: string) => {
  if (sup.startsWith("http")) {
    return "HTTP";
  } else {
    if (sup.split(":::").length > 1) {
      return sup.split(":::")[0];
    }

    const ext = sup.split(".").pop();
    return ext?.toUpperCase() ?? "SUP";
  }
};

const onClick = async (url: string) => {
  const realURL = url.split(":::").pop() ?? url;
  fileService.open(await fileService.access(realURL, true));
};

const onRightClicked = (event: MouseEvent, url: string) => {
  PLMainAPI.contextMenuService.showSupMenu(url);
};


const emits = defineEmits(["update:sup-display-name"]);
const onSubmitDisplayName = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
  const customName = (event.target as HTMLInputElement).value;

  if (customName === "") {
    return;
  }

  emits("update:sup-display-name", customName);
};
</script>

<template>
  <div class="flex flex-wrap mt-1 text-xs space-x-1">
    <div
      class="flex space-x-1 bg-neutral-200 dark:bg-neutral-700 rounded-md p-1 hover:bg-neutral-300 hover:shadow-sm hover:dark:bg-neutral-600 select-none cursor-pointer"
      v-for="sup in sups"
      @click="onClick(sup)"
      @contextmenu="(e: MouseEvent) => onRightClicked(e, sup)"
    >
      <div class="text-xxs my-auto" v-if="sup !== editingSup">
        {{ getDisplayName(sup) }}
      </div>
      <input
        v-else
        class="my-auto text-xxs bg-transparent grow whitespace-nowrap border-2 rounded-md px-1 border-accentlight dark:border-accentdark truncate"
        type="text"
        autofocus
        :value="getDisplayName(editingSup)"
        @click.stop
        @keydown.enter="onSubmitDisplayName"
      />
    </div>
  </div>
</template>
