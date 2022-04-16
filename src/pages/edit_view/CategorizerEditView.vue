<template>
    <q-dialog v-model="isViewShown" @before-show="onShow" @hide="onClose" transition-show="fade" transition-hide="fade" transition-duration="100" >
        <q-card flat style="width: 500px; height: 530px" class="edit-view">
            <EditTextField :label="isTagViewShown ? 'Tags' : 'Folders'" :value="categorizerDraftStr" @update:model-value="onUpdate"/>
            <q-scroll-area style="height: 420px" class="q-pa-sm">
                <q-list dense>
                    <q-item
                        clickable
                        class="radius-border"
                        v-for="categorizer in (isTagViewShown ? filteredTags : filteredFolders)"
                        @click="onCategorizerClicked(categorizer)"
                        :key="categorizer.id"
                    >
                      <q-item-section>
                        <span style="font-size: 0.9em; color: var(--q-text)">
                            {{ categorizer.name }}
                        </span>
                      </q-item-section>
                    </q-item>
                </q-list>
            </q-scroll-area>
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
import { defineComponent, PropType, ref, toRefs } from 'vue';

import EditTextField from './components/TextField.vue';

import { PaperEntity } from '../../models/PaperEntity';
import { PaperEntityDraft } from '../../models/PaperEntityDraft';
import { PaperCategorizer, PaperFolder, PaperTag } from '../../models/PaperCategorizer';

export default defineComponent({
  name: 'CategorizerEditView',
  components: {
    EditTextField,
  },
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
  setup(props, {emit}) {
    const isTagViewShown = ref(false);
    const isFolderViewShown = ref(false);
    const isViewShown = ref(false);
    const isAutoSuggestion = ref(false)

    const categorizerDraftStr = ref('');
    const tagDraftStr = ref('');
    const folderDraftStr = ref('');
    const entityDraft = ref(new PaperEntityDraft());

    const filteredTags = ref(props.tags);
    const filteredFolders = ref(props.folders);
    const filterCategorizer = ref('');

    window.systemInteractor.registerState(
        'viewState.isTagViewShown',
        (event, message) => {
          isTagViewShown.value = JSON.parse(message as string) as boolean;
          isViewShown.value = isTagViewShown.value || isFolderViewShown.value;
        },
    );

    window.systemInteractor.registerState(
        'viewState.isFolderViewShown',
        (event, message) => {
          isFolderViewShown.value = JSON.parse(message as string) as boolean;
          isViewShown.value = isTagViewShown.value || isFolderViewShown.value;
        },
    );

    window.systemInteractor.registerState(
        'sharedData.editEntityDraft',
        (event, message) => {
          entityDraft.value.initialize(JSON.parse(message as string) as PaperEntity);

          tagDraftStr.value = entityDraft.value.tags; 
          folderDraftStr.value = entityDraft.value.folders; 
        },
    );

    const onShow= () => {
      if (isTagViewShown.value) {
        categorizerDraftStr.value = tagDraftStr.value;
      } else {
        categorizerDraftStr.value = folderDraftStr.value;
      }
      isAutoSuggestion.value = false;

      filteredTags.value = props.tags;
      filteredFolders.value = props.folders;
      filterCategorizer.value = '';
    };

    const onClose= () => {
      window.systemInteractor.setState('viewState.isTagViewShown', false);
      window.systemInteractor.setState('viewState.isFolderViewShown', false);
    };

    const onSave = () => {
      if (isTagViewShown.value) {
        entityDraft.value.tags = categorizerDraftStr.value
      }
      else {
        entityDraft.value.folders = categorizerDraftStr.value
      }
      void window.entityInteractor.update(JSON.stringify([entityDraft.value]));
      window.systemInteractor.setState('viewState.isTagViewShown', false);
      window.systemInteractor.setState('viewState.isFolderViewShown', false);
    };

    const onUpdate = (value: string) => {
      if(categorizerDraftStr.value != value) {
        isAutoSuggestion.value = true;
        const oldCategorizerList = categorizerDraftStr.value.replace(/ /g, '').split(';').filter(x => x !== '');
        const newCategorizerList = value.replace(/ /g, '').split(';').filter(x => x !== '');

        filterCategorizer.value = '';
        for (const newCategorizer of newCategorizerList) {
          if (!oldCategorizerList.includes(newCategorizer)) {
            filterCategorizer.value = newCategorizer;
            break;
          }
        }

        filterCategorizers()

        categorizerDraftStr.value = value;
      } else {
        categorizerDraftStr.value = value;
      }

    };

    const onCategorizerClicked = (categorizer: PaperCategorizer) => {
      let existingCategorizers = categorizerDraftStr.value.replace(/ /g, '').split(';').filter(x => x !== '');

      let duplicatedCategorizers = existingCategorizers.filter(
          (f) => f === categorizer.name,
      );

      if (duplicatedCategorizers.length == 0) {
        if (filterCategorizer.value !== '') {
          existingCategorizers = existingCategorizers.filter(
              (f) => f !== filterCategorizer.value,
          );
        }
        existingCategorizers.push(categorizer.name);
        categorizerDraftStr.value = existingCategorizers.join('; ');
      }
    };

    const filterCategorizers = () => {
      if (isAutoSuggestion.value) {
        if (filterCategorizer.value === '') {
          if (isTagViewShown.value) {
            filteredTags.value = props.tags
          } else {
            filteredFolders.value = props.folders
          }
        }
        else {
          const needle = filterCategorizer.value.toLowerCase()
          if (isTagViewShown.value) {
            filteredTags.value = props.tags.filter(
              v => v.name.toLowerCase().indexOf(needle) > -1
            )
          } else {
            filteredFolders.value = props.folders.filter(
              v => v.name.toLowerCase().indexOf(needle) > -1
            )
          }
        }
      }
      else {
        if (isTagViewShown.value) {
          filteredTags.value = props.tags
        } else {
          filteredFolders.value = props.folders
        }
      }
    }

    return {
      categorizerDraftStr,
      filteredTags,
      filteredFolders,

      isViewShown,
      isTagViewShown,
      isFolderViewShown,
      entityDraft,
      onUpdate,
      onCategorizerClicked,
      filterCategorizers,
      onShow,
      onClose,
      onSave,
    };
  },
});
</script>
