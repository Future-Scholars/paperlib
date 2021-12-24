<template>
  <q-page class="flex flex-center">
    <!-- Sidebar -->
    <div class="sidebar absolute-full bg-secondary">
      <q-bar
        class="q-electron-drag no-shadow bg-secondary"
        style="height: 50px"
      >
        <q-btn
          dense
          flat
          round
          icon="lens"
          size="8.5px"
          color="red"
          @click="closeWindow"
        />
        <q-btn
          dense
          flat
          round
          icon="lens"
          size="8.5px"
          color="yellow-9"
          @click="minimizeWindow"
        />
        <q-btn
          dense
          flat
          round
          icon="lens"
          size="8.5px"
          color="green-6"
          @click="maximizeWindow"
        />
      </q-bar>

      <q-list dense class="q-pl-md q-pr-md sidebar-list">
        <q-item class="sidebar-list-title">
          <span class="text-primary">Library</span>
        </q-item>

        <q-item
          clickable
          dense
          class="sidebar-list-item"
          key="lib-all"
          active-class="sidebar-list-item-active"
          :active="sidebarFilter === 'lib-all'"
          @click="sidebarFilter = 'lib-all'"
        >
          <q-icon
            class="q-mr-md sidebar-list-icon"
            name="bi-collection"
            color="blue-7"
          />
          <span class=""> All Papers </span>
          <q-spinner-oval
            v-if="showLoadingIcon"
            color="primary"
            size="1em"
            class="absolute-right q-mr-md q-mt-sm"
          />
        </q-item>

        <q-item
          clickable
          dense
          class="sidebar-list-item"
          key="lib-flaged"
          active-class="sidebar-list-item-active"
          :active="sidebarFilter === 'lib-flaged'"
          @click="sidebarFilter = 'lib-flaged'"
        >
          <q-icon
            class="q-mr-md sidebar-list-icon"
            name="bi-flag"
            color="blue-7"
          />
          <span class=""> Flaged </span>
        </q-item>

        <q-item clickable class="sidebar-list-title" @click="collopseTagEvent">
          <q-icon
            v-if="showSidebarTag"
            class="q-mr-sm"
            name="bi-chevron-down"
            color="grey-8"
          />
          <q-icon
            v-if="!showSidebarTag"
            class="q-mr-sm"
            name="bi-chevron-right"
            color="grey-8"
          />
          <span class="text-primary">Tags</span>
        </q-item>

        <q-item
          clickable
          class="sidebar-list-item"
          v-ripple
          active-class="sidebar-list-item-active"
          v-show="showSidebarTag"
          v-for="tag in tags"
          :key="tag._id"
          :active="sidebarFilter === tag._id"
          @click="sidebarFilter = tag._id"
        >
          <q-icon
            class="q-mr-md sidebar-list-icon"
            name="bi-tag"
            color="blue-7"
          />
          <span class=""> {{ tag.name }} </span>
          <q-menu touch-position context-menu>
            <q-list dense style="min-width: 50px">
              <q-item clickable v-close-popup @click="deleteTag(tag)">
                <q-item-section style="font-size: 0.9em">Delete</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-item>

        <q-item
          clickable
          class="sidebar-list-title"
          @click="collopseFolderEvent"
        >
          <q-icon
            v-if="showSidebarFolder"
            class="q-mr-sm"
            name="bi-chevron-down"
            color="grey-8"
          />
          <q-icon
            v-if="!showSidebarFolder"
            class="q-mr-sm"
            name="bi-chevron-right"
            color="grey-8"
          />
          <span class="text-primary">Folders</span>
        </q-item>

        <q-item
          clickable
          class="sidebar-list-item"
          v-ripple
          active-class="sidebar-list-item-active"
          v-show="showSidebarFolder"
          v-for="folder in folders"
          :key="folder._id"
          :active="sidebarFilter === folder._id"
          @click="sidebarFilter = folder._id"
        >
          <q-icon
            class="q-mr-md sidebar-list-icon"
            name="bi-folder"
            color="blue-7"
          />
          <span class=""> {{ folder.name }} </span>
          <q-menu touch-position context-menu>
            <q-list dense style="min-width: 50px">
              <q-item clickable v-close-popup @click="deleteFolder(folder)">
                <q-item-section style="font-size: 0.9em">Delete</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-item>
      </q-list>
    </div>

    <!-- Content -->
    <div ref="mainview" class="mainview absolute-full">
      <!-- Menu Bar -->
      <q-bar class="no-shadow menubar">
        <q-input
          borderless
          dense
          class="search-input"
          placeholder="Search"
          debounce="300"
          v-model="searchText"
          @update:model-value="searchEvent"
        >
          <template v-slot:prepend>
            <q-icon size="xs" name="search" />
          </template>
        </q-input>
        <q-space />
        <div class="q-electron-drag menubar-drag-box" />
        <q-space />
        <q-btn
          flat
          size="sm"
          padding="xs sm"
          color="grey-7"
          icon="bi-search"
          class="float-right q-mr-sm"
          @click="matchEntities"
          :disable="selectedIds.length < 1"
        />
        <q-btn
          flat
          size="sm"
          padding="xs sm"
          color="grey-7"
          icon="bi-trash"
          class="float-right q-mr-sm"
          @click="deleteEntities"
          :disable="selectedIds.length < 1"
        />
        <q-btn
          flat
          size="sm"
          padding="xs sm"
          color="grey-7"
          icon="bi-pencil-square"
          class="float-right q-mr-sm"
          @click="showEditViewEvent"
          :disable="selectedIds.length !== 1"
        />
        <q-btn
          flat
          size="sm"
          padding="xs sm"
          color="grey-7"
          icon="bi-flag"
          class="float-right q-mr-sm"
          @click="flagEntities"
          :disable="selectedIds.length < 1"
        />
        <q-btn
          flat
          size="sm"
          padding="xs sm"
          color="grey-7"
          icon="bi-tag"
          class="float-right q-mr-sm"
          @click="showTagAddViewEvent"
          :disable="selectedIds.length != 1"
        />
        <q-btn
          flat
          size="sm"
          padding="xs sm"
          color="grey-7"
          icon="bi-folder-plus"
          class="float-right q-mr-sm"
          @click="showFolderAddViewEvent"
          :disable="selectedIds.length != 1"
        />
        <q-btn
          flat
          size="sm"
          padding="xs sm"
          color="grey-7"
          icon="bi-card-text"
          class="float-right q-mr-md"
          @click="showNoteAddViewEvent"
          :disable="selectedIds.length != 1"
        />
        <q-btn
          flat
          size="sm"
          padding="xs sm"
          class="float-right q-mr-sm"
          color="grey-7"
          icon="bi-filter-right"
        >
          <q-menu>
            <q-list dense style="min-width: 100px">
              <q-item
                clickable
                v-close-popup
                class="sidebar-list-item"
                @click="sortBy = 'title'"
              >
                <q-icon
                  v-show="sortBy === 'title'"
                  class="q-ml-sm"
                  name="bi-check2"
                  color="gray-7"
                />
                <q-icon
                  class="q-ml-sm q-mr-sm"
                  name="bi-fonts"
                  color="gray-7"
                />
                <span> Title </span>
              </q-item>
              <q-item
                clickable
                v-close-popup
                class="sidebar-list-item"
                @click="sortBy = 'authors'"
              >
                <q-icon
                  v-show="sortBy === 'authors'"
                  class="q-ml-sm"
                  name="bi-check2"
                  color="gray-7"
                />
                <q-icon
                  class="q-ml-sm q-mr-sm"
                  name="bi-person"
                  color="gray-7"
                />
                <span> Authors </span>
              </q-item>
              <q-item
                clickable
                v-close-popup
                class="sidebar-list-item"
                @click="sortBy = 'pubTime'"
              >
                <q-icon
                  v-show="sortBy === 'pubTime'"
                  class="q-ml-sm"
                  name="bi-check2"
                  color="gray-7"
                />
                <q-icon
                  class="q-ml-sm q-mr-sm"
                  name="bi-calendar3"
                  color="gray-7"
                />
                <span> Year </span>
              </q-item>
              <q-item
                clickable
                v-close-popup
                class="sidebar-list-item"
                @click="sortBy = 'publication'"
              >
                <q-icon
                  v-show="sortBy === 'publication'"
                  class="q-ml-sm"
                  name="bi-check2"
                  color="gray-7"
                />
                <q-icon class="q-ml-sm q-mr-sm" name="bi-book" color="gray-7" />
                <span> Publication </span>
              </q-item>
              <q-item
                clickable
                v-close-popup
                class="sidebar-list-item"
                @click="sortBy = 'addTime'"
              >
                <q-icon
                  v-show="sortBy === 'addTime'"
                  class="q-ml-sm"
                  name="bi-check2"
                  color="gray-7"
                />
                <q-icon
                  class="q-ml-sm q-mr-sm"
                  name="bi-clock"
                  color="gray-7"
                />
                <span> Add Time </span>
              </q-item>
              <q-separator />
              <q-item
                clickable
                v-close-popup
                class="sidebar-list-item"
                @click="sortOrder = 'desc'"
              >
                <q-icon
                  v-show="sortOrder === 'desc'"
                  class="q-ml-sm"
                  name="bi-check2"
                  color="gray-7"
                />
                <q-icon
                  class="q-ml-sm q-mr-sm"
                  name="bi-sort-down"
                  color="gray-7"
                />
                <span> Descending </span>
              </q-item>
              <q-item
                clickable
                v-close-popup
                class="sidebar-list-item"
                @click="sortOrder = 'asc'"
              >
                <q-icon
                  v-show="sortOrder === 'asc'"
                  class="q-ml-sm"
                  name="bi-check2"
                  color="gray-7"
                />
                <q-icon
                  class="q-ml-sm q-mr-sm"
                  name="bi-sort-up"
                  color="gray-7"
                />
                <span> Ascending </span>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <q-btn
          flat
          size="sm"
          padding="xs sm"
          color="grey-7"
          icon="bi-gear"
          class="float-right"
          @click="showSettingViewEvent"
        />
        <q-btn
          v-if="showDebugButton"
          flat
          size="sm"
          padding="xs sm"
          color="grey-7"
          icon="bi-cpu"
          class="float-right"
          @click="debug"
        />
      </q-bar>

      <!-- Data Table -->
      <div
        class="row no-wrap justify-start items-start content-start"
        style="height: calc(100% - 50px) !important"
      >
        <div class="col-grow full-height table-box">
          <q-table
            dense
            hide-bottom
            class="no-shadow full-height"
            style="height: 100%"
            table-class="data-table"
            :rows="entities"
            :columns="columns"
            :row-key="(row) => row.title + row.authors"
            virtual-scroll
            v-model:pagination="pagination"
            :rows-per-page-options="[0]"
            separator="none"
            @row-click="rowClickEvent"
            @row-dblclick="rowDblClickEvent"
            @row-contextmenu="rowContextMenuEvent"
          >
            <template v-slot:body-cell="props">
              <q-td
                :props="props"
                :class="
                  selectedIds.indexOf(props.row._id) >= 0 ? 'bg-secondary' : ''
                "
              >
                {{ props.value }}
              </q-td>
              <q-menu touch-position context-menu>
                <q-list dense style="min-width: 200px">
                  <q-item
                    clickable
                    v-close-popup
                    @click="openFileEvent(selectedEntities[0].mainURL)"
                  >
                    <q-item-section style="font-size: 0.9em"
                      >Open</q-item-section
                    >
                    <q-item-section
                      style="font-size: 0.9em; color: #888; text-align: right"
                      >enter
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="showEditViewEvent">
                    <q-item-section style="font-size: 0.9em"
                      >Edit</q-item-section
                    >
                    <q-item-section
                      style="font-size: 0.9em; color: #888; text-align: right"
                      >ctrl+e
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="matchEntities">
                    <q-item-section style="font-size: 0.9em"
                      >Match</q-item-section
                    >
                    <q-item-section
                      style="font-size: 0.9em; color: #888; text-align: right"
                      >ctrl+m
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="deleteEntities">
                    <q-item-section style="font-size: 0.9em"
                      >Delete</q-item-section
                    >
                  </q-item>
                  <q-separator />
                  <q-item clickable v-close-popup @click="flagEntities">
                    <q-item-section style="font-size: 0.9em"
                      >Toggle Flag
                    </q-item-section>
                    <q-item-section
                      style="font-size: 0.9em; color: #888; text-align: right"
                      >ctrl+g
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="showTagAddViewEvent">
                    <q-item-section style="font-size: 0.9em"
                      >Add Tag</q-item-section
                    >
                    <q-item-section
                      style="font-size: 0.9em; color: #888; text-align: right"
                      >ctrl+t
                    </q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    v-close-popup
                    @click="showFolderAddViewEvent"
                  >
                    <q-item-section style="font-size: 0.9em"
                      >Add Folder</q-item-section
                    >
                    <q-item-section
                      style="font-size: 0.9em; color: #888; text-align: right"
                      >ctrl+f
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="showNoteAddViewEvent">
                    <q-item-section style="font-size: 0.9em"
                      >Add Note</q-item-section
                    >
                    <q-item-section
                      style="font-size: 0.9em; color: #888; text-align: right"
                      >ctrl+n
                    </q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable>
                    <q-item-section style="font-size: 0.9em"
                      >Export</q-item-section
                    >
                    <q-item-section side>
                      <q-icon
                        name="bi-chevron-right"
                        style="font-size: 0.9em"
                      />
                    </q-item-section>
                    <q-menu anchor="top end" self="top start">
                      <q-list dense style="min-width: 150px">
                        <q-item
                          clickable
                          v-close-popup
                          @click="exportEntities('bibtex')"
                        >
                          <q-item-section style="font-size: 0.9em"
                            >Bibtex</q-item-section
                          >
                        </q-item>
                        <q-item
                          clickable
                          v-close-popup
                          @click="exportEntities('plaintext')"
                        >
                          <q-item-section style="font-size: 0.9em"
                            >Plain Text</q-item-section
                          >
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-item>
                </q-list>
              </q-menu>
            </template>
          </q-table>
        </div>
        <div
          id="detail-view"
          class="col full-height"
          style="
            min-width: 300px;
            max-width: 300px;
            border-left: 1px solid #ddd;
            margin-left: -10px;
            padding-left: 15px;
            padding-right: 15px;
          "
          v-show="selectedEntities.length > 0"
        >
          <DetailView
            v-if="selectedEntities.length > 0"
            :entity="selectedEntities[0]"
          />
        </div>
      </div>
    </div>

    <!-- Edit Window -->
    <q-dialog class="q-pa-none" v-model="showEditView">
      <q-card flat style="width: 500px; height: 550px">
        <q-input
          v-model="editEntity.title"
          class="q-mt-md q-ml-md q-mr-md q-mb-sm"
          standout="bg-primary text-white"
          label="Title"
          stack-label
          dense
          style="font-size: 0.85em"
        />
        <q-input
          v-model="editEntity.authors"
          class="q-mt-sm q-ml-md q-mr-md q-mb-sm"
          standout="bg-primary text-white"
          label="Authors"
          stack-label
          dense
          style="font-size: 0.85em"
        />
        <q-input
          v-model="editEntity.publication"
          class="q-mt-sm q-ml-md q-mr-md q-mb-sm"
          standout="bg-primary text-white"
          label="Publication"
          stack-label
          dense
          style="font-size: 0.85em"
        />
        <div class="row q-mt-sm q-ml-md q-mr-md q-mb-sm">
          <q-input
            v-model="editEntity.pubTime"
            class="col q-mr-xs"
            standout="bg-primary text-white"
            label="PubTime"
            stack-label
            dense
            style="font-size: 0.85em"
          />
          <q-btn-toggle
            v-model="editEntity.pubType"
            class="col q-ml-xs"
            no-caps
            flat
            toggle-color="primary"
            color="white"
            text-color="grey-5"
            size="11.5px"
            :options="[
              { label: 'Journal', value: 0 },
              { label: 'Conference', value: 1 },
              { label: 'Others', value: 2 },
            ]"
          />
        </div>
        <div class="row q-mt-sm q-ml-md q-mr-md q-mb-sm">
          <q-input
            v-model="editEntity.doi"
            class="col q-mr-xs"
            standout="bg-primary text-white"
            label="DOI"
            stack-label
            dense
            style="font-size: 0.85em"
          />
          <q-input
            v-model="editEntity.arxiv"
            class="col q-ml-xs"
            standout="bg-primary text-white"
            label="arXivID"
            stack-label
            dense
            style="font-size: 0.85em"
          />
        </div>
        <q-input
          v-model="editEntity.tags"
          class="q-mt-sm q-ml-md q-mr-md q-mb-sm"
          standout="bg-primary text-white"
          label="Tags"
          stack-label
          dense
          style="font-size: 0.85em"
        />
        <q-input
          v-model="editEntity.folders"
          class="q-mt-sm q-ml-md q-mr-md q-mb-sm"
          standout="bg-primary text-white"
          label="Folders"
          stack-label
          dense
          style="font-size: 0.85em"
        />
        <q-input
          v-model="editEntity.note"
          class="q-mt-sm q-ml-md q-mr-md q-mb-sm"
          standout="bg-primary text-white"
          label="Note"
          type="textarea"
          stack-label
          dense
          style="font-size: 0.85em"
        />
        <div class="row justify-between q-mt-md">
          <q-btn
            class="q-ml-md col-3"
            unelevated
            no-caps
            text-color="text-primary"
            label="Close"
            @click="hideEditViewEvent"
          />
          <q-btn
            class="q-mr-md col-3"
            unelevated
            no-caps
            text-color="text-primary"
            label="Save & Close"
            @click="saveEditViewEvent"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- Tag Add Window -->
    <q-dialog class="q-pa-none" v-model="showTagAddView">
      <q-card flat style="width: 500px; height: 550px">
        <q-input
          v-model="editEntity.tags"
          class="q-mt-md q-ml-md q-mr-md q-mb-sm"
          standout="bg-primary text-white"
          label="Tags"
          stack-label
          dense
          style="font-size: 0.85em"
        />
        <q-scroll-area style="height: 420px">
          <q-list class="q-ml-md q-mr-md">
            <q-item
              clickable
              class="sidebar-list-item"
              v-for="tag in tags"
              :key="tag._id"
              @click="addExistTagEvent(tag)"
            >
              <q-icon
                class="q-ml-sm q-mr-sm"
                name="bi-tag-fill"
                color="grey-8"
              />
              <span style="font-size: 0.9em"> {{ tag.name }} </span>
            </q-item>
          </q-list>
        </q-scroll-area>
        <div class="row justify-between q-mt-md">
          <q-btn
            class="q-ml-md col-3"
            unelevated
            no-caps
            text-color="text-primary"
            label="Close"
            @click="hideTagAddViewEvent"
          />
          <q-btn
            class="q-mr-md col-3"
            unelevated
            no-caps
            text-color="text-primary"
            label="Save & Close"
            @click="saveTagAddViewEvent"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- Folder Add Window -->
    <q-dialog class="q-pa-none" v-model="showFolderAddView">
      <q-card flat style="width: 500px; height: 550px">
        <q-input
          v-model="editEntity.folders"
          class="q-mt-md q-ml-md q-mr-md q-mb-sm"
          standout="bg-primary text-white"
          label="Folders"
          stack-label
          dense
          style="font-size: 0.85em"
        />
        <q-scroll-area style="height: 420px">
          <q-list class="q-ml-md q-mr-md">
            <q-item
              clickable
              class="sidebar-list-item"
              v-for="folder in folders"
              :key="folder._id"
              @click="addExistFolderEvent(folder)"
            >
              <q-icon
                class="q-ml-sm q-mr-sm"
                name="bi-folder-fill"
                color="grey-8"
              />
              <span style="font-size: 0.9em"> {{ folder.name }} </span>
            </q-item>
          </q-list>
        </q-scroll-area>
        <div class="row justify-between q-mt-md">
          <q-btn
            class="q-ml-md col-3"
            unelevated
            no-caps
            text-color="text-primary"
            label="Close"
            @click="hideFolderAddViewEvent"
          />
          <q-btn
            class="q-mr-md col-3"
            unelevated
            no-caps
            text-color="text-primary"
            label="Save & Close"
            @click="saveFolderAddViewEvent"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- Note Add Window -->
    <q-dialog class="q-pa-none" v-model="showNoteAddView">
      <q-card flat style="width: 500px; height: 210px">
        <q-input
          v-model="editEntity.note"
          class="q-mt-md q-ml-md q-mr-md q-mb-sm"
          standout="bg-primary text-white"
          label="Note"
          type="textarea"
          stack-label
          dense
          style="font-size: 0.85em"
        />
        <div class="row justify-between q-mt-md">
          <q-btn
            class="q-ml-md col-3"
            unelevated
            no-caps
            text-color="text-primary"
            label="Close"
            @click="hideNoteAddViewEvent"
          />
          <q-btn
            class="q-mr-md col-3"
            unelevated
            no-caps
            text-color="text-primary"
            label="Save & Close"
            @click="saveNoteAddViewEvent"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- Setting Window -->
    <q-dialog class="q-pa-none" v-model="showSettingView">
      <q-card flat style="width: 800px; height: 500px">
        <q-tabs
          v-model="settingTab"
          dense
          no-caps
          align="center"
          class="text-grey q-mt-md"
          :breakpoint="0"
          indicator-color="transparent"
          active-color="blue-7"
        >
          <q-tab
            name="general"
            icon="bi-gear-wide-connected"
            label="General"
            :ripple="false"
          />
          <q-tab
            name="metadata"
            icon="bi-globe"
            label="Metadata"
            :ripple="false"
          />
          <q-tab
            name="sync"
            icon="bi-cloud-arrow-up"
            label="Sync"
            :ripple="false"
          />
          <q-tab
            name="export"
            icon="bi-box-arrow-up"
            label="Export"
            :ripple="false"
          />
          <q-tab
            name="info"
            icon="bi-info-circle"
            label="About"
            :ripple="false"
          />
        </q-tabs>

        <hr
          class="q-ml-lg q-mr-lg"
          style="background-color: #ddd; height: 1px; border: 0"
        />

        <q-tab-panels class="q-mt-md" v-model="settingTab" animated>
          <q-tab-panel name="general">
            <div class="row setting-title" style="text-align: left !important">
              <span style="font-weight: 500">
                Choose a folder to store paper files (e.g., PDF etc.) and the
                database files.</span
              >
            </div>
            <div class="row justify-center q-mb-sm">
              <div class="col">
                <q-file
                  ref="settingNewFolderPicker"
                  dense
                  webkitdirectory
                  v-model="settings.appLibFolder"
                  style="display: none"
                  @update:model-value="settingNewFolderSelectedEvent"
                />
                <div
                  style="
                    padding-left: 5px;
                    border: 1px solid #ddd;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    cursor: pointer;
                  "
                  class="radius-border"
                  @click="settingNewFolderPickerClickEvent"
                >
                  <span class="setting-content">
                    {{ settings.appLibFolder }}
                  </span>
                </div>
              </div>
            </div>
            <div class="row setting-title" style="text-align: left !important">
              <i>
                * Note that this operation will create a new database in the
                selected folder instead of migrating the current one (or read
                the available database in the selected folder.). It is commenly
                used when you setup paperlib on a new device to access your
                previous data stored on a network shared folder. A empty folder
                isn't allowed here due to the limitation of the development
                framework. Please create a temporary file inside the selected
                folder first if there is nothing inside. *
              </i>
            </div>

            <div
              class="row setting-title q-mt-md"
              style="text-align: left !important"
            >
              <span style="font-weight: 500">
                Migrate database to a new folder:</span
              >
            </div>
            <div class="row setting-title" style="text-align: left !important">
              <i>
                Move all the files in the original database folder manually and
                choose it through the upper option.
              </i>
            </div>

            <div class="row justify-center q-mt-lg">
              <div class="col-5 setting-title">
                Automaticly delete the imported source file.
              </div>
              <div class="col-5">
                <q-checkbox
                  dense
                  keep-color
                  size="xs"
                  v-model="settings.deleteSourceFile"
                  color="grey-5"
                />
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="metadata">
            <div class="row justify-center">
              <div class="col-5 setting-title">
                IEEE Xplorer API Key, the request limitation with the IEEE API
                is up to 200 per day. The API Key can applied from IEEE
                Developer website. See more on Paperlib's Github.
              </div>
              <div class="col-5">
                <div
                  style="
                    padding-left: 5px;
                    border: 1px solid #ddd;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    cursor: pointer;
                  "
                  class="radius-border setting-content"
                >
                  <q-input
                    borderless
                    v-model="settings.ieeeAPIKey"
                    dense
                    style="max-height: 22px"
                  />
                </div>
              </div>
            </div>

            <div class="row justify-center q-mt-lg">
              <div class="col-5 setting-title">
                Allow fetch PDF's built-in metadata.
              </div>
              <div class="col-5">
                <q-checkbox
                  dense
                  keep-color
                  size="xs"
                  v-model="settings.allowFetchPDFMeta"
                  color="grey-5"
                />
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="sync">
            <div class="row justify-center">
              <div class="col-5 setting-title">
                Cloud Sync API Key, see more on Paperlib's Github.
              </div>
              <div class="col-5">
                <div
                  style="
                    padding-left: 5px;
                    border: 1px solid #ddd;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    cursor: pointer;
                  "
                  class="radius-border setting-content"
                >
                  <q-input
                    borderless
                    v-model="settings.syncAPIKey"
                    dense
                    style="max-height: 22px"
                  />
                </div>
              </div>
            </div>

            <div class="row justify-center q-mt-lg">
              <div class="col-5 setting-title">Use cloud sync.</div>
              <div class="col-5">
                <q-checkbox
                  dense
                  keep-color
                  size="xs"
                  v-model="settings.useSync"
                  color="grey-5"
                />
              </div>
            </div>

            <div class="row justify-center q-mt-lg">
              <div class="col-5 setting-title">
                Migrate the local database to the cloud sync database.
              </div>
              <div class="col-5">
                <q-checkbox
                  dense
                  keep-color
                  size="xs"
                  v-model="settings.migrateLocalToSync"
                  color="grey-5"
                  :disable="!settings.useSync"
                />
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="export">
            <div class="row justify-center">
              <div
                class="col-9 setting-title"
                style="text-align: left !important"
              >
                Enable replacing publication title with customed string when
                exporting to bibtex. For example, replace 'Conference on
                Computer Vision and Pattern Recognition' by 'CVPR'.
              </div>
              <div class="col-1">
                <q-checkbox
                  dense
                  keep-color
                  size="xs"
                  v-model="settings.enableExportReplacement"
                  color="grey-5"
                />
              </div>
            </div>

            <div class="row justify-center q-mt-md">
              <div class="col-4">
                <div
                  style="
                    padding-left: 5px;
                    border: 1px solid #ddd;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  "
                  class="radius-border setting-content"
                >
                  <q-input
                    borderless
                    v-model="settings.newReplacementFrom"
                    dense
                    style="max-height: 22px"
                  />
                </div>
              </div>
              <div class="col-1" style="text-align: center">
                <q-icon name="bi-arrow-right" size="" color="grey-5" />
              </div>
              <div class="col-4">
                <div
                  style="
                    padding-left: 5px;
                    border: 1px solid #ddd;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  "
                  class="radius-border setting-content"
                >
                  <q-input
                    borderless
                    v-model="settings.newReplacementTo"
                    dense
                    style="max-height: 22px"
                  />
                </div>
              </div>
              <div class="col-1" style="text-align: center">
                <q-btn
                  dense
                  flat
                  color="primary"
                  size="xs"
                  icon="bi-plus-circle"
                  @click="settingAddCustomReplaceEvent"
                />
              </div>
            </div>

            <q-scroll-area style="height: 200px">
              <q-list dense class="q-mt-md">
                <q-item
                  v-for="replacement in settings.exportReplacement"
                  :key="replacement.from + replacement.to"
                >
                  <div class="row justify-center full-width">
                    <span
                      class="setting-content col-4"
                      style="text-align: right; padding-top: 4px"
                    >
                      {{ replacement.from }}
                    </span>
                    <div class="col-1" style="text-align: center">
                      <q-icon name="bi-arrow-right" size="" color="grey-5" />
                    </div>
                    <span
                      class="setting-content col-4"
                      style="padding-top: 4px"
                    >
                      {{ replacement.to }}
                    </span>
                    <div class="col-1" style="text-align: center">
                      <q-btn
                        dense
                        flat
                        color="primary"
                        size="xs"
                        icon="bi-trash"
                        @click="
                          settings.exportReplacement =
                            settings.exportReplacement.filter(
                              (item) =>
                                item.from !== replacement.from ||
                                item.to !== replacement.to
                            )
                        "
                      />
                    </div>
                  </div>
                </q-item>
              </q-list>
            </q-scroll-area>
          </q-tab-panel>

          <q-tab-panel name="info">
            <div class="row justify-center">
              <div
                class="col"
                style="text-align: center; font-weight: 500; font-size: 1.5em"
              >
                Paperlib
              </div>
            </div>
            <div class="row justify-center">
              <div
                class="col"
                style="text-align: center; color: #444; font-size: 0.8em"
              >
                created by Geo;
                <a href="https://github.com/GeoffreyChen777/paperlib">Github</a>
              </div>
            </div>
            <div class="row justify-center">
              <div
                class="col"
                style="text-align: center; color: #444; font-size: 0.8em"
              >
                {{ version }}
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>

        <div
          class="row justify-between q-mt-md full-width"
          style="position: absolute; bottom: 20px"
        >
          <q-btn
            class="q-ml-md col-3"
            unelevated
            no-caps
            text-color="text-primary"
            label="Close"
            @click="hideSettingViewEvent"
          />
          <q-btn
            class="q-mr-md col-3"
            unelevated
            no-caps
            text-color="text-primary"
            label="Save & Close"
            @click="saveSettingViewEvent"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style lang="sass">
@import './src/css/global.scss'
@import './src/css/sidebar.scss'
@import './src/css/mainview.scss'
@import './src/css/detailview.scss'
@import './src/css/settingview.scss'
</style>

<script>
import { watch, ref, onMounted } from "vue";
import DetailView from "components/DetailView.vue";
import dragDrop from "drag-drop";
import { formatString, unpackEntity } from "src/utils/misc";
import Mousetrap from "mousetrap";
import { useQuasar } from "quasar";

const columns = [
  {
    name: "Title",
    label: "Title",
    required: true,
    align: "left",
    field: (row) => row.title,
    format: (val) => `${val}`,
    classes: "ellipsis-cell",
    style: "max-width: 300px;",
    headerStyle: "max-width: 300px;",
  },
  {
    name: "Authors",
    label: "Authors",
    align: "left",
    field: "authors",
    classes: "ellipsis-cell",
    style: "max-width: 150px;",
    headerStyle: "max-width: 150px;",
  },
  {
    name: "Publication",
    label: "Publication",
    align: "left",
    field: "publication",
    classes: "ellipsis-cell",
    style: "max-width: 200px;",
    headerStyle: "max-width: 200px;",
  },
  {
    name: "Year",
    label: "Year",
    align: "left",
    field: "pubTime",
    classes: "ellipsis-cell",
    style: "max-width: 35px;",
    headerStyle: "max-width: 35px;",
  },
  {
    name: "Flag",
    label: "Flag",
    align: "center",
    field: "flag",
    format: (val) => `${val ? "\u2691" : ""}`,
    style:
      "max-width: 35px; font-size: 1.2em !important; padding: 0 !important;",
    headerStyle: "max-width: 35px;",
  },
];

export default {
  components: {
    DetailView,
  },

  setup() {
    const $q = useQuasar();
    const showDebugButton = ref(false);

    const appLibPath = ref("");

    const showLoadingIcon = ref(false);
    const showSidebarTag = ref(true);
    const showSidebarFolder = ref(true);
    const sidebarFilter = ref("lib-all");

    const sortBy = ref("addTime");
    const sortOrder = ref("desc");

    const entities = ref([]);
    const tags = ref([]);
    const folders = ref([]);
    const searchText = ref("");
    const selectedIndex = ref([]);
    const selectedLastSingleIndex = ref(-1);
    const selectedEntities = ref([]);
    const selectedIds = ref([]);

    const showEditView = ref(false);
    const showTagAddView = ref(false);
    const showFolderAddView = ref(false);
    const showNoteAddView = ref(false);
    const editEntity = ref({});

    const showSettingView = ref(false);
    const settings = ref({
      appLibFolder: "",
      ieeeAPIKey: "",
      deleteSourceFile: false,
      allowFetchPDFMeta: true,
      enableExportReplacement: false,
      newReplacementFrom: "",
      newReplacementTo: "",
      exportReplacement: [],
      useSync: false,
      syncAPIKey: "",
      migrateLocalToSync: false,
    });
    const settingTab = ref("general");
    const settingNewFolderPicker = ref(null);
    const version = ref("-1");

    const debug = () => {
      reloadEntities();
      reloadTags();
      reloadFolders();
      reloadSelectedEntities();
    };

    // Window functions
    const closeWindow = () => {
      window.api.close();
    };

    const minimizeWindow = () => {
      window.api.minimize();
    };

    const maximizeWindow = () => {
      window.api.toggleMaximize();
    };

    // Event functions
    const collopseTagEvent = () => {
      showSidebarTag.value = !showSidebarTag.value;
    };

    const collopseFolderEvent = () => {
      showSidebarFolder.value = !showSidebarFolder.value;
    };

    const searchEvent = (val) => {
      searchText.value = val;
      reloadEntities();
    };

    const dropEvent = () => {
      dragDrop(".table-box", {
        onDrop: async (files, pos, fileList, directories) => {
          const filePaths = [];
          files.forEach((file) => {
            filePaths.push(file.path);
          });
          showLoadingIcon.value = true;
          await window.api.add(filePaths);
          showLoadingIcon.value = false;
        },
      });

      dragDrop("#detail-view", {
        onDrop: async (files, pos, fileList, directories) => {
          const filePaths = [];
          files.forEach((file) => {
            filePaths.push(file.path);
          });
          window.api.addSups(selectedIds.value[0], filePaths);
        },
      });
    };

    const realmChangedEvent = () => {
      window.api.listenRealmChange(() => {
        reloadAppLibPath();
        reloadEntities();
        reloadTags();
        reloadFolders();
        reloadSelectedEntities();
      });
    };

    const reloadEditEntity = () => {
      editEntity.value = unpackEntity(selectedEntities.value[0]);
    };

    const showEditViewEvent = () => {
      reloadEditEntity();
      showEditView.value = true;
    };

    const hideEditViewEvent = () => {
      showEditView.value = false;
    };

    const saveEditViewEvent = () => {
      showEditView.value = false;
      saveEditEntity();
    };

    const showTagAddViewEvent = () => {
      reloadEditEntity();
      showTagAddView.value = true;
    };

    const hideTagAddViewEvent = () => {
      showTagAddView.value = false;
    };

    const saveTagAddViewEvent = () => {
      showTagAddView.value = false;
      saveEditEntity();
    };

    const addExistTagEvent = (tag) => {
      editEntity.value.tags = formatString({
        str: editEntity.value.tags,
        removeWhite: true,
      }).split(";");
      editEntity.value.tags = editEntity.value.tags.filter(
        (t) => t !== tag.name && t !== ""
      );
      editEntity.value.tags.push(tag.name);
      editEntity.value.tags = editEntity.value.tags.join("; ");
    };

    const showFolderAddViewEvent = () => {
      reloadEditEntity();
      showFolderAddView.value = true;
    };

    const hideFolderAddViewEvent = () => {
      showFolderAddView.value = false;
    };

    const saveFolderAddViewEvent = () => {
      showFolderAddView.value = false;
      saveEditEntity();
    };

    const addExistFolderEvent = (folder) => {
      editEntity.value.folders = formatString({
        str: editEntity.value.folders,
        removeWhite: true,
      }).split(";");
      editEntity.value.folders = editEntity.value.folders.filter(
        (f) => f !== folder.name && f !== ""
      );
      editEntity.value.folders.push(folder.name);
      editEntity.value.folders = editEntity.value.folders.join("; ");
    };

    const showNoteAddViewEvent = () => {
      reloadEditEntity();
      showNoteAddView.value = true;
    };

    const hideNoteAddViewEvent = () => {
      showNoteAddView.value = false;
    };

    const saveNoteAddViewEvent = () => {
      showNoteAddView.value = false;
      saveEditEntity();
    };

    const rowClickEvent = (event, row, index) => {
      if (event.shiftKey) {
        var minIndex = Math.min(selectedLastSingleIndex.value, index);
        var maxIndex = Math.max(selectedLastSingleIndex.value, index);
        selectedIndex.value = [];
        for (var i = minIndex; i <= maxIndex; i++) {
          selectedIndex.value.push(i);
        }
      } else if (event.ctrlKey) {
        if (selectedIndex.value.indexOf(index) >= 0) {
          selectedIndex.value.splice(selectedIndex.value.indexOf(index), 1);
        } else {
          selectedIndex.value.push(index);
        }
      } else {
        selectedIndex.value = [index];
        selectedLastSingleIndex.value = index;
      }
      reloadSelectedEntities();
    };

    const rowDblClickEvent = (event, row, index) => {
      rowClickEvent(event, row, index);
      openFileEvent(row.mainURL);
    };

    const rowContextMenuEvent = (event, row, index) => {
      selectedIndex.value = [index];
      selectedLastSingleIndex.value = index;
      reloadSelectedEntities();
    };

    const openFileEvent = (url) => {
      window.api.open(url);
    };

    const showSettingViewEvent = () => {
      reloadSettings();
      showSettingView.value = true;
    };

    const hideSettingViewEvent = () => {
      showSettingView.value = false;
    };

    const saveSettingViewEvent = () => {
      showSettingView.value = false;
      saveSettings();
    };

    const settingNewFolderPickerClickEvent = () => {
      settingNewFolderPicker.value.pickFiles();
    };

    const settingNewFolderSelectedEvent = (file) => {
      settings.value.appLibFolder = window.api.getFolder(file.path);
    };

    const settingAddCustomReplaceEvent = () => {
      if (!settings.value.exportReplacement) {
        settings.value.exportReplacement = [];
      }

      for (let replacement of settings.value.exportReplacement) {
        if (replacement.from == settings.value.newReplacementFrom) {
          // remove existing replacement
          settings.value.exportReplacement.splice(
            settings.value.exportReplacement.indexOf(replacement),
            1
          );
        }
      }

      settings.value.exportReplacement.push({
        from: settings.value.newReplacementFrom,
        to: settings.value.newReplacementTo,
      });

      settings.value.newReplacementFrom = "";
      settings.value.newReplacementTo = "";
    };

    watch(sidebarFilter, (newValue, oldValue) => {
      reloadEntities();
    });

    watch(sortBy, (newValue, oldValue) => {
      reloadEntities();
    });

    watch(sortOrder, (newValue, oldValue) => {
      reloadEntities();
    });

    const bindKeyboard = () => {
      Mousetrap.bind("enter", function () {
        if (selectedEntities.value.length == 1) {
          openFileEvent(selectedEntities.value[0].mainURL);
        }
      });
      Mousetrap.bind("ctrl+c", function () {
        console.log("export");
        exportEntities("bibtex");
      });
      Mousetrap.bind("ctrl+e", function () {
        if (selectedEntities.value.length == 1) {
          showEditViewEvent();
        }
      });
      Mousetrap.bind("ctrl+g", function () {
        flagEntities();
      });
      Mousetrap.bind("ctrl+t", function () {
        if (selectedEntities.value.length == 1) {
          showTagAddViewEvent();
        }
      });
      Mousetrap.bind("ctrl+f", function () {
        if (selectedEntities.value.length == 1) {
          showFolderAddViewEvent();
        }
      });
      Mousetrap.bind("ctrl+r", function () {
        matchEntities();
      });
      Mousetrap.bind("ctrl+n", function () {
        if (selectedEntities.value.length == 1) {
          showNoteAddViewEvent();
        }
      });
    };

    // Data functions
    const reloadAppLibPath = () => {
      appLibPath.value = window.api.getFolder(window.api.loadAppLibPath());
    };

    const reloadEntities = () => {
      var flaged = null;
      var tag = null;
      var folder = null;
      if (sidebarFilter.value.startsWith("tag-")) {
        tag = sidebarFilter.value;
      } else if (sidebarFilter.value.startsWith("folder-")) {
        folder = sidebarFilter.value;
      } else if (sidebarFilter.value === "lib-flaged") {
        flaged = true;
      }

      let results = window.api.load(
        searchText.value,
        flaged,
        tag,
        folder,
        sortBy.value,
        sortOrder.value
      );
      entities.value = results;
    };

    const reloadTags = () => {
      let results = window.api.loadTags();
      tags.value = results;
    };

    const reloadFolders = () => {
      let results = window.api.loadFolders();
      folders.value = results;
    };

    const reloadSelectedEntities = () => {
      selectedEntities.value = [];
      selectedIds.value = [];
      selectedIndex.value.forEach((index) => {
        selectedEntities.value.push(entities.value[index]);
        selectedIds.value.push(entities.value[index]._id);
      });
    };

    const clearSelected = () => {
      selectedEntities.value = [];
      selectedIndex.value = [];
      selectedLastSingleIndex.value = -1;
      selectedIds.value = [];
    };

    const deleteEntities = () => {
      $q.dialog({
        title: "Confirm",
        message: "Are you sure to delete this paper?",
        cancel: true,
        persistent: true,
      })
        .onOk(() => {
          window.api.delete(Object.assign([], selectedIds.value));
          clearSelected();
        })
        .onOk(() => {
          // console.log('>>>> second OK catcher')
        })
        .onCancel(() => {
          // console.log('>>>> Cancel')
        })
        .onDismiss(() => {
          // console.log('I am triggered on both OK and Cancel')
        });
    };

    const flagEntities = () => {
      window.api.flag(Object.assign([], selectedIds.value));
    };

    const matchEntities = () => {
      showLoadingIcon.value = true;
      window.api.match(Object.assign([], selectedIds.value)).then(() => {
        showLoadingIcon.value = false;
      });
    };

    const saveEditEntity = () => {
      window.api.update(unpackEntity(editEntity.value));
    };

    const exportEntities = (format) => {
      window.api.export(Object.assign([], selectedIds.value), format);
    };

    const deleteTag = (tag) => {
      window.api.deleteTag(tag._id);
    };

    const deleteFolder = (folder) => {
      window.api.deleteFolder(folder._id);
    };

    // Settings
    const reloadSettings = () => {
      settings.value = window.api.loadSettings();
    };

    const saveSettings = async () => {
      clearSelected();
      window.api
        .saveSettings(JSON.parse(JSON.stringify(settings.value)))
        .then(() => {
          reloadAppLibPath();
          reloadEntities();
          reloadTags();
          reloadFolders();
          reloadSelectedEntities();
        });
    };

    // Signal
    window.api.registerSignal("showLoading", (event, message) => {
      showLoadingIcon.value = true;
    });
    window.api.registerSignal("hideLoading", (event, message) => {
      showLoadingIcon.value = false;
    });

    window.api.registerSignal("realmChanged", (event, message) => {
      clearSelected();
      realmChangedEvent();
      reloadSettings();
      reloadAppLibPath();
      reloadEntities();
      reloadTags();
      reloadFolders();
      reloadSelectedEntities();
    });

    onMounted(() => {
      reloadAppLibPath();
      reloadSettings();
      reloadEntities();
      reloadTags();
      reloadFolders();
      dropEvent();
      realmChangedEvent();
      bindKeyboard();
      version.value = window.api.version();
    });

    return {
      version,
      columns,
      pagination: ref({
        rowsPerPage: 0,
      }),

      showDebugButton,
      debug,

      closeWindow,
      minimizeWindow,
      maximizeWindow,

      // States
      sortBy,
      sortOrder,
      showSidebarTag,
      showSidebarFolder,
      showLoadingIcon,
      sidebarFilter,
      entities,
      tags,
      folders,
      searchText,
      selectedEntities,
      selectedIds,
      showEditView,
      showTagAddView,
      showFolderAddView,
      showNoteAddView,
      editEntity,

      showSettingView,
      settingTab,
      settings,
      settingNewFolderPicker,
      settingNewFolderSelectedEvent,
      settingAddCustomReplaceEvent,

      // Data functions
      reloadAppLibPath,
      reloadEntities,
      reloadSelectedEntities,
      clearSelected,
      deleteEntities,
      flagEntities,
      matchEntities,
      saveEditEntity,
      exportEntities,
      deleteTag,
      deleteFolder,

      reloadSettings,
      saveSettings,

      // Event functions
      collopseTagEvent,
      collopseFolderEvent,
      searchEvent,
      showEditViewEvent,
      hideEditViewEvent,
      saveEditViewEvent,
      showTagAddViewEvent,
      hideTagAddViewEvent,
      saveTagAddViewEvent,
      addExistTagEvent,
      showFolderAddViewEvent,
      hideFolderAddViewEvent,
      saveFolderAddViewEvent,
      addExistFolderEvent,
      showNoteAddViewEvent,
      hideNoteAddViewEvent,
      saveNoteAddViewEvent,
      rowClickEvent,
      rowDblClickEvent,
      rowContextMenuEvent,
      openFileEvent,
      showSettingViewEvent,
      hideSettingViewEvent,
      saveSettingViewEvent,
      settingNewFolderPickerClickEvent,
    };
  },
};
</script>
