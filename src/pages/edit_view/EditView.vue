<template>
    <q-dialog v-model="isEditViewShown" @hide="onClose" transition-show="fade" transition-hide="fade" transition-duration="100" >
        <q-card flat style="width: 500px; height: 435px" class="q-pa-none edit-view">
            <EditTextField label="Title" :value="entityDraft.title" @update:model-value="(value) => onUpdate('title', value)"/>
            <EditTextField label="Authors" :value="entityDraft.authors" @update:model-value="(value) => onUpdate('authors', value)"/>
            <EditTextField
              label="Publication" :value="entityDraft.publication" @update:model-value="(value) => onUpdate('publication', value)"
            />
            <div class="row" style="margin-top: -8px;">
                <EditTextField
                  label="PubTime"
                  class="col"
                  style="margin-right: 15px;"
                  :value="entityDraft.pubTime"
                  @update:model-value="(value) => onUpdate('pubTime', value)"
                />
                <q-select 
                  dense
                  outlined
                  class="col q-mr-sm q-mt-sm edit-select-field"
                  v-model="entityPubType" 
                  :options="['Journal', 'Conference', 'Book', 'Others']" 
                  label="Publication Type"
                  @update:model-value="(value) => onUpdatePubType(value)"
                />

            </div>
            <div class="row" style="margin-top: -8px; margin-bottom: -8px;">
                <EditTextField
                  label="arXivID" class="col" :value="entityDraft.arxiv" @update:model-value="(value) => onUpdate('arxiv', value)"
                />
                <EditTextField label="DOI" class="col" :value="entityDraft.doi" @update:model-value="(value) => onUpdate('doi', value)"/>
            </div>
            <q-select 
                dense
                use-input
                multiple
                outlined
                input-debounce="0"
                class="col q-ml-sm q-mr-sm q-mt-sm edit-select-field"
                @new-value="onCreateTags"
                :options="filteredTags.map(tag => tag.name)"
                @filter="filterTags"
                v-model="entityTags" 
                label="Tags"
                @update:model-value="(value) => onUpdateTag(value)"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    {{ scope.opt }}
                  </q-item-section>
                  <q-item-section side>
                    <q-icon name="bi-check2" style="font-size: 0.8rem" v-show="scope.selected"/>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <q-select 
                dense
                use-input
                multiple
                outlined
                input-debounce="0"
                class="col q-ml-sm q-mr-sm q-mt-sm edit-select-field"
                @new-value="onCreateFolders"
                :options="filteredFolders.map(folder => folder.name)"
                @filter="filterFolders"
                v-model="entityFolders" 
                label="Folders"
                @update:model-value="(value) => onUpdateFolder(value)"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    {{ scope.opt }}
                  </q-item-section>
                  <q-item-section side>
                    <q-icon name="bi-check2" style="font-size: 0.8rem" v-show="scope.selected"/>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <EditTextField label="Note" :value="entityDraft.note" @update:model-value="(value) => onUpdate('note', value)"/>
            <div class="row justify-end q-ml-sm q-mr-sm">
                <q-btn
                    class="col-2"
                    unelevated
                    no-caps
                    size="small"
                    text-color="primary"
                    label="Close"
                    @click="onClose()"
                />
                <q-btn
                    class="col-2"
                    unelevated
                    no-caps
                    size="small"
                    text-color="primary"
                    label="Save"
                    @click="onSave()"
                />
            </div>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType, Ref, ref, toRefs } from 'vue';

import EditTextField from './components/TextField.vue';

import { PaperEntity } from '../../models/PaperEntity';
import { PaperEntityDraft } from '../../models/PaperEntityDraft';
import { formatString } from '../../utils/string';
import { PaperFolder, PaperTag } from '../../models/PaperCategorizer';

export default defineComponent({
  name: 'EditView',
  props: {
    tags: {
      type: Array as PropType<PaperTag[]>,
      required: true,
    },
    folders: {
      type: Array as PropType<PaperFolder[]>,
      required: true,
    }
  },
  components: {
    EditTextField,
  },

  setup(props, {emit}) {
    const isEditViewShown = ref(false);
    const entityDraft = ref(new PaperEntityDraft());
    const entityPubType = ref('Journal');
    const entityTags: Ref<string[]> = ref([]);
    const entityFolders: Ref<string[]> = ref([]);
    const filteredTags = ref(props.tags)
    const filteredFolders = ref(props.folders)

    window.systemInteractor.registerState('viewState.isEditViewShown', (event, message) => {
      isEditViewShown.value = JSON.parse(message as string) as boolean;
    });

    window.systemInteractor.registerState('sharedData.editEntityDraft', (event, message) => {
      entityDraft.value.initialize(JSON.parse(message as string) as PaperEntity);
      entityPubType.value = ['Journal', 'Conference', 'Others', 'Book'][entityDraft.value.pubType];
      entityTags.value = formatString(
        {
          str:entityDraft.value.tags,
          removeWhite: true,  
        }
      ).split(';').filter(tag => tag.length > 0);
      entityFolders.value = formatString(
        {
          str:entityDraft.value.folders,
          removeWhite: true,  
        }
      ).split(';').filter(tag => tag.length > 0);
    });

    const onClose = () => {
      window.systemInteractor.setState('viewState.isEditViewShown', false);
    };

    const onSave = () => {
      void window.entityInteractor.update(JSON.stringify([entityDraft.value]));
      window.systemInteractor.setState('viewState.isEditViewShown', false);
    };

    const onUpdate = (propName: string, value: unknown) => {
      entityDraft.value[propName] = value;
    };

    const onUpdatePubType = (value: string) => {
      entityDraft.value.pubType = ['Journal', 'Conference', 'Others', 'Book'].indexOf(value);
    };

    const onUpdateTag = (value: string[]) => {
      entityDraft.value.tags = value.join(';');
    };

    const onUpdateFolder = (value: string[]) => {
      entityDraft.value.folders = value.join(';');
    };

    const onCreateTags = (value: string, done: (arg0: string, arg1: string) => void) => {
      let duplicatedTags = entityTags.value.filter(
          (f) => f === value,
      );

      if (duplicatedTags.length == 0) {
        entityTags.value.push(value);
        onUpdateTag(entityTags.value);
        done(value, 'add-unique');
      }
    };

    const onCreateFolders = (value: string, done: (arg0: string, arg1: string) => void) => {
      let duplicatedFolders = entityFolders.value.filter(
          (f) => f === value,
      );

      if (duplicatedFolders.length == 0) {
        entityFolders.value.push(value);
        onUpdateFolder(entityFolders.value);
        done(value, 'add-unique');
      }
    };

    const filterTags = (val: string, update: (arg0: () => void) => void) => {
      console.log(val)
      update(() => {
        if (val === '') {
          filteredTags.value = props.tags
        }
        else {
          const needle = val.toLowerCase()
          filteredTags.value = props.tags.filter(
            v => v.name.toLowerCase().indexOf(needle) > -1
          )
        }
      })
    }

    const filterFolders = (val: string, update: (arg0: () => void) => void) => {
      update(() => {
        if (val === '') {
          filteredFolders.value = props.folders
        }
        else {
          const needle = val.toLowerCase()
          filteredFolders.value = props.folders.filter(
            v => v.name.toLowerCase().indexOf(needle) > -1
          )
        }
      })
    }

    return {
      isEditViewShown,
      entityDraft,
      entityPubType,
      entityTags,
      entityFolders,
      filteredTags,
      filteredFolders,
      onUpdate,
      onUpdatePubType,
      onUpdateTag,
      onUpdateFolder,
      onCreateTags,
      onCreateFolders,
      filterTags,
      filterFolders,
      onClose,
      onSave,
      ...toRefs(props),
    };
  },
});
</script>
