<script setup lang="ts">
import { CategorizerType } from "@/models/categorizer";
import { PaperSmartFilterType } from "@/models/smart-filter";
import { ViewTreeNode } from "@/renderer/services/querysentence-service";
import Spinner from "@/renderer/ui/components/spinner.vue";
import ItemRow from "@/renderer/ui/sidebar-view/components/tree/item-row.vue";
import {
  BIconChevronDown,
  BIconChevronRight,
  BIconPlus,
} from "bootstrap-icons-vue";
import { Ref, inject, ref } from "vue";
import Counter from "../counter.vue";
import TreeNode from "./tree-node.vue";
import { formatMouseModifiers } from "@/common/utils";

const props = defineProps({
  parent_id: {
    type: String,
    default: "",
  },
  id: {
    type: String,
    default: "",
  },
  title: String,
  query: {
    type: String,
    default: "true",
  },
  color: {
    type: String,
    default: "blue",
  },
  type: {
    type: String as () => CategorizerType | PaperSmartFilterType,
    default: CategorizerType.PaperTag,
  },
  icon: {
    type: String,
    default: "",
  },
  addable: {
    type: Boolean,
    default: false,
  },
  childAddable: {
    type: Boolean,
    default: false,
  },
  defaultCollopsed: {
    type: Boolean,
    default: true,
  },
  children: {
    type: Array as () => ViewTreeNode[],
    default: () => [],
  },
  isRoot: {
    type: Boolean,
    default: false,
  },
  showCounter: {
    type: Boolean,
    default: false,
  },
  compact: {
    type: Boolean,
    default: false,
  },
  indent: {
    type: Boolean,
    default: true,
  },
  count: {
    type: Number,
    default: -1,
  },
  withSpinner: {
    type: Boolean,
    default: false,
  },
  activated: {
    type: Boolean,
    default: false,
  },
  itemDraggable: {
    type: Boolean,
    default: false,
  },
  rootDropable: {
    type: Boolean,
    default: false,
  },
});

const collopsed = ref(props.defaultCollopsed);

const clickEvent = inject<Ref<{}>>("clickEvent");
const onClicked = (e: PointerEvent) => {
  if (props.isRoot) {
    collopsed.value = !collopsed.value;
    return;
  }
  if (!props.isRoot) {
    collopsed.value = false;
    if (!clickEvent) return;

    const modifiers = formatMouseModifiers(e).join("+");

    let modifiersPayload: string | undefined = undefined;

    if (
      (modifiers === "Control" &&
        (process.platform === "win32" || process.platform === "linux")) ||
      (modifiers === "Command" && process.platform === "darwin")
    ) {
      modifiersPayload = modifiers;
    }

    clickEvent.value = {
      _id: props.id,
      query: props.query,
      modifiers: modifiersPayload,
    };
  }
};

const contextmenuEvent = inject<
  Ref<{
    _id: string;
  }>
>("contextmenuEvent");
const onRightClicked = () => {
  if (!contextmenuEvent || props.isRoot) return;
  contextmenuEvent.value = {
    _id: props.id,
  };
};

const editingName = ref(props.title);
const childEditing = ref(false);

const onAddClicked = () => {
  const randomInt = Math.floor(10000 + Math.random() * 10000);
  editingName.value = `${props.type}-${randomInt}`;
  collopsed.value = false;
  childEditing.value = true;
};

const blurEvent = inject<Ref<number>>("blurEvent");
const onEditBlur = () => {
  childEditing.value = false;
  if (!blurEvent) return;
  blurEvent.value = Date.now();
};

const updateEvent = inject<
  Ref<{
    parent_id?: string;
    _id?: string;
    name?: string;
    color?: string;
  }>
>("updateEvent");
const onEditSubmit = (patch: {
  parent_id?: string;
  _id?: string;
  name?: string;
  color?: string;
}) => {
  childEditing.value = false;
  if (!updateEvent) return;

  updateEvent.value = patch;

  if (!editingItemId) return;
  editingItemId.value = "";
};

const editingItemId = inject<Ref<string>>("editingItemId");
const selectedItemId = inject<Ref<string[]>>("selectedItemId");

const dropEvent =
  inject<Ref<{ type: string; value: any; dest: { _id: string } }>>("dropEvent");
const onDropped = (event: DragEvent) => {
  if (!dropEvent || (props.isRoot && !props.rootDropable)) return;
  event.preventDefault();
  event.stopPropagation();

  const dropData = event.dataTransfer?.getData("application/json")
    ? JSON.parse(event.dataTransfer?.getData("application/json"))
    : undefined;

  if (dropData) {
    dropData["dest"] = {
      _id: props.id,
    };

    if (dropData.type === "PaperEntity") {
      dropEvent.value = dropData;
    } else if (dropData.type !== props.type) {
      return;
    } else if (dropData.value === props.id) {
      return;
    } else {
      dropEvent.value = dropData;
    }
    return;
  }

  const files = event.dataTransfer?.files || [];
  const filePaths: string[] = [];
  (files as unknown as Array<{ path: string }>).forEach((file) => {
    filePaths.push(file.path);
  });
  if (filePaths.length > 0) {
    dropEvent.value = {
      type: "files",
      value: filePaths,
      dest: {
        _id: props.id,
      },
    };
  }
};

const onDragged = (event: DragEvent) => {
  event.dataTransfer?.setData(
    "application/json",
    JSON.stringify({
      type: props.type,
      value: props.id,
    })
  );
};
</script>

<template>
  <div
    :id="id"
    class="w-full flex rounded-md px-1 cursor-pointer group space-x-1"
    :class="{
      'h-6': compact,
      'h-7': !compact,
      'bg-neutral-400 bg-opacity-30': activated && !isRoot,
    }"
  >
    <div class="flex flex-none w-3" v-if="children.length > 0">
      <BIconChevronDown
        class="my-auto text-[0.6rem] text-neutral-400 w-3"
        v-if="!collopsed"
        @click="collopsed = !collopsed"
      />
      <BIconChevronRight
        class="my-auto text-[0.6rem] text-neutral-400 w-3"
        v-if="collopsed"
        @click="collopsed = !collopsed"
      />
    </div>
    <div v-else-if="children.length === 0" class="w-3 flex-none" />

    <ItemRow
      class="grow"
      :title="title"
      :color="color"
      :icon="icon"
      :is-root="isRoot"
      :indent="indent"
      :editing="editingItemId === id"
      :draggable="itemDraggable"
      @click="onClicked"
      @event:blur-name-editing="onEditBlur"
      @event:submit-name-editing="(newName: string) => onEditSubmit({ _id: id, name: newName, parent_id: parent_id, color: color })"
      @contextmenu="onRightClicked"
      @dragenter.prevent
      @dragover.prevent
      @drop="onDropped"
      @dragstart="onDragged"
    />
    <BIconPlus
      class="my-auto text-neutral-400 hover:text-neutral-500 hover:dark:text-neutral-300 hidden group-hover:block flex-none w-3"
      v-if="addable"
      @click="
        (e: MouseEvent) => {
          e.stopPropagation();
          onAddClicked();
        }
      "
    />
    <div class="my-auto flex space-x-2 flex-none">
      <Spinner class="m-auto" v-if="withSpinner" />
      <Counter class="m-auto" :value="count" v-if="count >= 0 && showCounter" />
    </div>
  </div>
  <div
    class="w-full overflow-y-auto no-scrollbar"
    v-if="!collopsed"
    :class="isRoot ? '' : 'pl-3'"
  >
    <div class="flex px-1 space-x-1" v-if="childEditing">
      <div class="w-3 flex-none" />
      <ItemRow
        class="grow"
        :title="editingName"
        :color="'blue'"
        :icon="icon"
        :is-root="false"
        :indent="indent"
        :editing="true"
        @event:blur-name-editing="onEditBlur"
        @event:submit-name-editing="(newName: string) => onEditSubmit({ parent_id: id, name: newName, color: color})"
      />
    </div>
    <TreeNode
      v-for="child in children"
      :parent_id="`${id}`"
      :id="`${child._id}`"
      :title="child.name"
      :query="child.query"
      :type="child.type"
      :color="child.color"
      :addable="childAddable"
      :child-addable="childAddable"
      :show-counter="showCounter"
      :compact="compact"
      :icon="child.icon"
      :children="child.children"
      :indent="indent"
      :count="child.count"
      :with-spinner="withSpinner"
      :activated="selectedItemId?.includes(`${child._id}`)"
      :item-draggable="itemDraggable"
    />
  </div>
</template>
