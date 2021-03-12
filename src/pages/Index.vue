<template>
  <q-page-container>
    <q-page>
        <div class="left-p absolute-full bg-secondary">
          <q-bar class="q-electron-drag no-shadow bg-secondary" style="height: 50px">
            <q-btn dense flat round icon="lens" size="8.5px" color="red" @click="close" />
            <q-btn dense flat round icon="lens" size="8.5px" color="yellow-9" @click="minimize" />
            <q-btn dense flat round icon="lens" size="8.5px" color="green-6" @click="maximize" />
          </q-bar>
          <q-list dense class="q-pl-sm q-pr-sm">
            <q-item class="radius-list-item">
              <q-item-section avatar top>
                <span class="radius-list-item-label text-primary">Library</span>
              </q-item-section>
            </q-item>

            <q-item class="radius-list-item" clickable v-ripple :active="selectedNav === 'All'" active-class="radius-list-item-active"
              @click="selectNavEvent('All', 'all')">
              <q-item-section avatar>
                <q-icon class="radius-list-item-icon text-primary q-mr-md" name="fa fa-book-open" />
                <span class="radius-list-item-text text-primary">All</span>
              </q-item-section>
              <q-item-section>
              </q-item-section>
              <q-item-section avatar v-if="showLoadingLibIcon">
                <q-spinner-oval color="primary" size="1em" />
              </q-item-section>
            </q-item>
            <q-item class="radius-list-item" clickable v-ripple :active="selectedNav === 'Flaged'" active-class="radius-list-item-active"
              @click="selectNavEvent('Flaged', 'flaged')">
              <q-item-section avatar>
                <q-icon class="radius-list-item-icon text-primary q-mr-md" name="fa fa-flag" />
                <span class="radius-list-item-text text-primary">Flaged</span>
              </q-item-section>
              <q-item-section>
              </q-item-section>
              <q-item-section avatar v-if="showLoadingLibIcon">
                <q-spinner-oval color="primary" size="1em" />
              </q-item-section>
            </q-item>

            <q-separator class="q-mt-md q-mb-md" inset />

            <q-item class="radius-list-item">
              <q-item-section avatar top>
                <span class="radius-list-item-label text-primary">Tags</span>
              </q-item-section>
            </q-item>
            <q-item class="radius-list-item" clickable v-ripple active-class="radius-list-item-active"
              v-for="tag in allTagsList" :key="tag" :active="selectedNav === tag" @click="selectNavEvent(tag, 'tag')">
              <q-item-section avatar>
                  <q-icon class="radius-list-item-icon text-primary q-mr-md" name="fa fa-tag" />
                  <span class="radius-list-item-text text-primary"> {{tag}} </span>
              </q-item-section>
            </q-item>
          </q-list>

        </div>
        <div ref="rPanel" class="right-p absolute-full">
          <q-bar class="no-shadow right-titlebar">
            <q-input borderless dense class="search-input" placeholder="Search" @input="searchInputEvent" v-model="filterString">
              <template v-slot:prepend>
                <q-icon size="xs" name="search" />
              </template>
            </q-input>
            <q-space />
            <div class="q-electron-drag drag-box" />
            <q-space />
            <q-btn flat size="sm" padding="xs sm" color="grey-7" icon="open_in_new" class="float-right" @click="exportAllBibtexEvent" />
            <q-btn flat size="sm" padding="xs sm" color="grey-7" icon="add" class="float-right">
              <q-menu>
                <q-list style="min-width: 180px">
                  <q-item class="radius-list-item" clickable @click="triggerImportfromBibFile">
                    <q-item-section avatar>
                      <q-icon class="radius-list-item-icon text-primary q-mr-md" name="fa fa-file" />
                      <span class="radius-list-item-text text-primary">Import from Bibtex file</span>
                      <q-file ref="fileImportFromBibFile" dense rounded outlined bottom-slots accept=".bib"
                        v-model="importedBibFile" style="display:none" @input="importBibFileEvent" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
            <q-btn flat size="sm" padding="xs sm" color="grey-7" icon="settings" class="float-right" @click="openSetting" />
          </q-bar>
          <div class="table-box">
            <hot-table
              ref="dataTable"
              id="data-table"
              :data="allData"
              :settings="tableSettings"
              licenseKey="non-commercial-and-evaluation">
            </hot-table>
          </div>
        </div>
        <transition name="details-p-animation">
          <div v-show="showDetailsPanel" class="details-p radius-border">
            <q-scroll-area style="height: 100%;" :visible="false">
              <div class="details-close-icon-container" @click="closeDetailsPanel">
                <q-icon :size="'xs'" name="fa fa-times-circle" class="details-close-icon"/>
              </div>
              <q-card flat style="background: none">
                <q-card-section class="q-pb-sm q-mt-sm">
                  <div class="text-weight-bold q-mb-sm">{{ selectedData.title }}</div>
                  <div class="detail-label">Authors</div>
                  <div style="font-size:12px">{{ selectedData.authors }}</div>
                </q-card-section>

                <q-card-section class="q-pt-none q-pb-sm">
                  <div class="detail-label">Publication</div>
                  <div style="font-style: italic; font-size:12px">{{ selectedData.pub }}</div>
                </q-card-section>

                <q-card-section class="q-pt-none q-pb-sm">
                  <div class="detail-label">Publication Time</div>
                  <div style="font-size:12px">{{ selectedData.pubTime }}</div>
                </q-card-section>
                <q-separator inset />

                <q-card-section class="q-pt-none q-mt-md q-pb-sm">
                  <div class="detail-label">Add Time</div>
                  <div style="font-size:12px">{{ selectedData.addTime }}</div>
                </q-card-section>

                <q-card-section class="q-pt-none q-pb-xs">
                  <div class="detail-label">Attachments
                    <q-btn size="xs" round flat color="grey-5" icon="add" @click="triggerAttachmentPicker"
                      style="margin-top:-2px" />
                    <q-file ref="detailsAttachmentPicker" dense rounded outlined bottom-slots v-model="newAttachmentFile"
                      style="display:none" @input="addFileEvent('attachment', newAttachmentFile)" />
                  </div>
                  <div class="row q-mt-none">
                    <q-chip rounded dense size="md" color="grey-6" clickable
                      @click="openPaperFileEvent(selectedData.paperFile)" class="q-mt-none q-ml-none">
                      <div style="font-size: 10px; color: #FFFFFF">PAPER</div>
                      <q-menu touch-position context-menu>
                        <q-list dense style="min-width: 80px">
                          <q-item clickable v-close-popup @click="deleteFileEvent('paper', null)">
                            <q-item-section>Delete</q-item-section>
                          </q-item>
                        </q-list>
                      </q-menu>
                    </q-chip>
                    <q-chip rounded size="md" dense color="grey-4" clickable
                      v-for="attachment in selectedData.attachments" :key="attachment" @click="openFileEvent(attachment)"
                      class="q-mt-none q-ml-none">
                      <div style="font-size: 10px;  color: #666666">{{ getAttachmentLabel(attachment) }}</div>
                      <q-menu touch-position context-menu>
                        <q-list dense style="min-width: 80px">
                          <q-item clickable v-close-popup @click="deleteFileEvent('attachment', attachment)">
                            <q-item-section>Delete</q-item-section>
                          </q-item>
                        </q-list>
                      </q-menu>
                    </q-chip>
                    <q-file ref="detailsPaperPicker" dense rounded outlined bottom-slots v-model="newPaperFile"
                      style="display:none" @input="addFileEvent('paper', newPaperFile)" />
                  </div>

                </q-card-section>

                <q-card-section class="q-pt-none q-pb-xs">
                  <div class="detail-label">Tags
                  </div>
                  <q-select v-model="selectedData.tags"
                    dense
                    borderless
                    multiple
                    use-chips
                    use-input
                    autocomplete
                    new-value-mode="add"
                    stack-label
                    hide-dropdown-icon
                    @add="addTagsEvent"
                    @remove="removeTagsEvent"
                  >
                  </q-select>
                </q-card-section>
                <q-card-section class="q-pt-none q-pb-sm">
                  <div class="detail-label">Rating</div>
                  <q-rating v-model="selectedData.rating" size="1em" :max="5" color="grey-8"
                    @input="ratingChangedEvent" />
                </q-card-section>

                <q-card-section class="q-pt-none q-pb-sm">
                  <div class="detail-label">Note</div>
                  <q-input v-model="selectedData.note" outlined autogrow color="grey-6" class="q-mt-sm"
                    @blur="noteChangedEvent" style="font-size:12px" />
                </q-card-section>
              </q-card>
            </q-scroll-area>
          </div>
        </transition>
        <transition name="details-p-animation">
          <div v-show="showEditPanel" class="edit-p radius-border">
            <q-scroll-area style="height: 100%;" :visible="false">
              <q-input class="q-mb-sm edit-p-input" standout="bg-primary text-white" v-model="editData.title" label="Title"
                stack-label dense autogrow/>
              <q-input class="q-mb-sm edit-p-input" standout="bg-primary text-white" v-model="editData.authors"
                label="Authors" stack-label dense autogrow/>
              <q-input class="q-mb-sm edit-p-input" standout="bg-primary text-white" v-model="editData.pub" label="Publication"
                stack-label dense autogrow/>
              <q-input class="q-mb-sm edit-p-input" standout="bg-primary text-white" v-model="editData.pubTime"
                label="Publication Time" stack-label dense autogrow/>
              <q-select class="q-mb-sm" standout="bg-primary text-white" :options="['conference', 'journal']" v-model="editData.pubType"
                label="Publication Type" stack-label dense/>
              <q-input class="q-mb-sm edit-p-input" standout="bg-primary text-white" v-model="editData.citeKey"
                label="Cite Key" stack-label dense autogrow/>
              <q-input class="q-mb-sm edit-p-input" standout="bg-primary text-white" v-model="editData.bib"
                label="Bibtex" stack-label dense autogrow/>
              <q-input class="q-mb-sm edit-p-input" standout="bg-primary text-white" v-model="editData.doi" label="DOI"
                stack-label dense autogrow/>
              <q-input class="q-mb-sm edit-p-input" standout="bg-primary text-white" v-model="editData.arxiv" label="Arxiv"
                stack-label dense autogrow/>
            </q-scroll-area>
            <div class="edit-p-btn">
              <q-btn round size="sm" color="grey-5" icon="close" class="q-mr-md q-mt-md" @click="closeEditPanel" />
              <q-btn round size="sm" color="grey-7" icon="done" class="q-ml-md q-mt-md" @click="applyEditDataEvent" />
            </div>
          </div>
        </transition>
        <q-dialog class="q-pa-none" v-model="showSettingWindow">
          <q-card class="q-pl-sm q-pr-sm" style="min-width: 600px">
            <q-card-section style="text-align: center">
              <div class="text-h6">Settings</div>
            </q-card-section>
            <q-card-section class="q-pl-xl">
              <div class="row">
                <div class="col-2">
                  <q-avatar color="grey-3" size="lg" text-color="grey-9" icon="folder" />
                </div>
                <div class="col" style="margin-left:-20px">
                  <div>Library Folder</div>
                  <div style="color:#777777; font-size: 10px">NOTE: Cannot select a empty folder, please copy at least
                    one useless file to initialize db.</div>
                  <div style="color:#BBBBBB; font-size: 12px" @click="selectLibFolder" class="setting-lib-path-text">
                    {{ getLibPath() }} </div>
                  <q-file dense ref="settingLibfolderPicker" webkitdirectory v-model="settingBuffer.libPathPickerFile"
                    style="display: none" />
                </div>
              </div>
            </q-card-section>
            <q-separator style="margin-left: 110px; width: 408px" />
            <q-card-section class="q-pl-xl">
              <div class="row">
                <div class="col-2">
                  <q-avatar color="grey-3" size="lg" text-color="grey-9" icon="fa fa-globe" />
                </div>
                <div class="col" style="margin-left:-20px">
                  <div>Proxy</div>
                  <div class="row q-pt-sm">
                    <div class="col-4">
                      <q-input dense rounded standout v-model="settingBuffer.proxyURL" label="URL" />
                    </div>
                    <div class="col-2 q-ml-md">
                      <q-input dense rounded standout v-model="settingBuffer.proxyPort" label="Port" />
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
            <q-card-actions align="right" class="text-primary q-pr-lg q-pb-lg">
              <q-btn no-caps outline rounded color="primary" label="Cancel" v-close-popup @click="debugSetting" />
              <q-btn no-caps outline rounded color="grey-9" label="Apply" v-close-popup @click="applySetting" />
            </q-card-actions>
          </q-card>
        </q-dialog>
        <q-dialog class="q-pa-none" v-model="showExportWindow">
          <q-card style="min-width: 50%; min-height: 500px">
            <q-card-section class="full-height">
              <q-input v-model="exportBibtexsStr" standout="bg-primary text-white" rows="25" type="textarea" />
            </q-card-section>
          </q-card>
        </q-dialog>
    </q-page>
  </q-page-container>
</template>
<style lang="sass">
@import './src/css/default.scss'
@import './src/css/leftpanel.scss'
@import './src/css/rightpanel.scss'
@import './src/css/detailpanel.scss'

</style>
<style src="../../node_modules/handsontable/dist/handsontable.full.css"></style>

<script>
import { HotTable } from '@handsontable/vue'
import { fromFilesPipeline, manuallyMatchPipeline } from 'src/js/pipline/pipeline'
import { PaperMeta } from 'src/js/pipline/structure'
import { dbInit, dbInsert, dbInsertFiles, dbRemove, dbSelectAll, dbUpdate, dbRemoveFile } from '../js/db/db'
import dragDrop from 'drag-drop'
import { shell } from 'electron'
import { getSetting, setSetting } from 'src/js/settings'
import { copyFiles, deleteFile, deleteFiles } from 'src/js/pipline/file'
import { copyToClipboard } from 'quasar'
export default {
  data () {
    return {
      tableSettings: {
        rowHeaders: false,
        colHeaders: ['ID', '', 'Title', 'Authors', 'Publication', 'Time', 'Add Time', 'Tags'],
        stretchH: 'all',
        manualColumnResize: true,
        rowHeights: 16,
        colWidths: this.calColWidth,
        columns: [
          { data: 'id', wordWrap: false, readOnly: true },
          { data: 'flag', wordWrap: false, readOnly: true, renderer: this.flagRender },
          { data: 'title', wordWrap: false, readOnly: true },
          { data: 'authors', wordWrap: false, readOnly: true },
          { data: 'pub', wordWrap: false, readOnly: true },
          { data: 'pubTime', wordWrap: false, readOnly: true },
          { data: 'addTime', wordWrap: false, readOnly: true },
          { data: 'tags', wordWrap: false, readOnly: true }
        ],
        hiddenColumns: {
          copyPasteEnabled: false,
          indicators: false,
          columns: [0, 7]
        },
        selectionMode: 'range',
        outsideClickDeselects: false,
        afterOnCellMouseDown: this.selectRowEvent,
        multiColumnSorting: {
          sortEmptyCells: true,
          initialConfig: [{
            column: 6,
            sortOrder: 'desc'
          }]
        },
        search: {
          queryMethod: this.containsMatch
        },
        filters: true,
        contextMenu: {
          items: {
            refresh: {
              name: 'Refresh',
              hidden: this.noSelected,
              callback: this.queryData
            },
            addFlag: {
              name: 'Flag',
              hidden: this.isMultiSelected,
              callback: this.toggleFlag
            },
            remove: {
              name: 'Remove',
              hidden: this.noSelected,
              callback: this.removeData
            },
            edit: {
              name: 'Edit',
              hidden: this.isMultiSelected,
              callback: this.openEditPanel
            },
            match: {
              name: 'Match',
              hidden: this.noSelected,
              callback: this.manuallyMatch
            },
            export: {
              name: 'Copy Bibtex',
              hidden: this.noSelected,
              callback: this.exportBibtexEvent
            },
            debug: {
              name: 'Debug selected',
              hidden: this.noSelected,
              callback: this.debug
            }
          }
        }
      },
      searchTimeout: null,
      showLoadingLibIcon: false,
      showSettingWindow: false,
      showExportWindow: false,
      showDetailsPanel: false,
      showEditPanel: false,
      allData: [],
      selectedData: { tags: [], rating: 0, note: '' },
      editData: { tags: [], rating: 0, note: '' },
      newPaperFile: null,
      newAttachmentFile: null,
      newTag: '',
      exportBibtexsStr: '',
      settingBuffer: { libPathPickerFile: null, proxyURL: null, proxyPort: null },
      filterString: '',
      importedBibFile: null,
      selectedNav: 'All'
    }
  },
  components: {
    HotTable
  },
  computed: {
    allTagsList: function () {
      let tagsList = []
      this.allData.forEach(data => {
        tagsList = tagsList.concat(data.tags)
      })
      tagsList = Array.from(new Set(tagsList))
      tagsList = tagsList.sort()
      return tagsList
    }
  },
  methods: {
    // Table Function ===========================================================
    calColWidth (index) {
      if (index === 1) {
        // width for flag column
        return 15
      }
      const per = [0, 0, 0.35, 0.15, 0.3, 0.05, 0.15, 0]
      return (this.$refs.rPanel.clientWidth - 35) * per[index]
    },
    flagRender (instance, td, row, col, prop, value, cellProperties) {
      if (value === 1) {
        td.innerHTML = "<i aria-hidden='true' role='presentation' class='radius-list-item-icon text-primary eva eva-flag q-icon notranslate' style='left:-5px'> </i>"
      } else {
        td.innerHTML = ''
      }
    },
    getRowId (rowIdx) {
      const id = this.$refs.dataTable.hotInstance.getDataAtRow(rowIdx)[0]
      return id
    },
    getRowData (id) {
      const rows = this.allData.filter(function (value, index) {
        return value.id === id
      })
      if (rows.length > 0) {
        return rows[0]
      } else {
        return null
      }
    },
    getRowsData (ids) {
      const rows = this.allData.filter(function (value, index) {
        return ids.includes(value.id)
      })
      return rows
    },
    getSelectedRowIdx () {
      const selectedIdx = this.$refs.dataTable.hotInstance.getSelected()[0]
      const fromRow = Math.min(selectedIdx[0], selectedIdx[2])
      const toRow = Math.max(selectedIdx[0], selectedIdx[2])
      return [fromRow, toRow]
    },
    selectRowEvent (event, coords) {
      switch (event.which) {
        case 1:
          if (coords.col === 1) {
            this.toggleFlag()
          }
          if (coords.row >= 0) {
            this.$refs.dataTable.hotInstance.selectRows(coords.row)
            var id = this.getRowId(coords.row)
            this.selectedData = this.getRowData(id)
            this.openDetailsPanel()
          }
          break
        case 3:
          var selectedIdx = this.$refs.dataTable.hotInstance.getSelected()[0]
          if (selectedIdx[2] - selectedIdx[0] === 0) {
            if (coords.row >= 0) {
              this.$refs.dataTable.hotInstance.selectRows(coords.row)
            }
          }
          break
      }
    },
    noSelected () {
      return this.$refs.dataTable.hotInstance.getSelected().length === 0
    },
    isMultiSelected () {
      const [fromRow, toRow] = this.getSelectedRowIdx()
      return fromRow !== toRow
    },
    debug () {
      const [fromRow, toRow] = this.getSelectedRowIdx()
      console.log(this.allData)
      for (let i = fromRow; i <= toRow; i++) {
        console.log(this.$refs.dataTable.hotInstance.getDataAtRow(i))
        const id = this.getRowId(i)
        const row = this.getRowData(id)
        console.log(row)
      }
    },

    // Search Function =====================
    containsMatch (queryStr, value) {
      return value.toString().trim().toLowerCase().includes(queryStr.toString().trim().toLowerCase())
    },
    searchInputEvent (value) {
      clearTimeout(this.searchTimeout)
      const filtersPlugin = this.$refs.dataTable.hotInstance.getPlugin('filters')
      if (value === '' || value === null) {
        filtersPlugin.clearConditions(0)
        filtersPlugin.filter()
      } else {
        this.searchTimeout = setTimeout(() => {
          let matchedRowId = []
          const queryResult = this.$refs.dataTable.hotInstance.getPlugin('search').query(value)
          queryResult.forEach(matchedResult => {
            matchedRowId.push(this.getRowId(matchedResult.row))
          })
          matchedRowId = new Array(new Set(matchedRowId))
          filtersPlugin.clearConditions(0)
          filtersPlugin.addCondition(0, 'by_value', matchedRowId, 'conjunction')
          filtersPlugin.filter()
        }, 200)
      }
    },

    // CRUD ================================
    // Select ----------------
    async queryData () {
      const allData = await dbSelectAll()
      this.allData.length = 0
      for (let i = 0; i < allData.length; i++) {
        for (const tagIdx in allData[i].tagsList) {
          const tag = allData[i].tagsList[tagIdx]
          if (!this.allTags.includes(tag)) {
            this.allTags.push(tag)
          }
        }
        this.allData.push(allData[i])
      }
    },

    // Insert -----------------
    async insertData (paperMeta) {
      paperMeta.selfComplete()
      const success = await dbInsert(paperMeta)
      if (success) {
        paperMeta = await copyFiles(paperMeta)
        const fileSuccess = await dbInsertFiles(paperMeta)
        if (fileSuccess) {
          this.allData.unshift(paperMeta)
          const sortConfig = this.$refs.dataTable.hotInstance.getPlugin('multiColumnSorting').getSortConfig()
          this.$refs.dataTable.hotInstance.getPlugin('multiColumnSorting').sort(sortConfig)
        } else {
          await deleteFiles(paperMeta)
          // TODO: alert
        }
      } else {
        // TODO: alert
      }
    },

    // Remove -----------------
    async removeData () {
      const [fromRow, toRow] = this.getSelectedRowIdx()

      const selectedId = []
      const selectedIdToIdx = {}
      const successIdx = []

      for (let i = fromRow; i <= toRow; i++) {
        const id = this.getRowId(i)
        selectedIdToIdx[id] = i
        selectedId.push(id)
      }
      const rowsData = this.getRowsData(selectedId)
      for (let i = 0; i < rowsData.length; i++) {
        const success = await dbRemove(rowsData[i])
        if (success) {
          await deleteFiles(rowsData[i])
          successIdx.push([selectedIdToIdx[rowsData[i].id], 1])
        }
      }
      this.$refs.dataTable.hotInstance.alter('remove_row', successIdx)
      this.closeDetailsPanel()
    },

    // Details panel ===========================
    openDetailsPanel () {
      this.showDetailsPanel = true
      this.showEditPanel = false
    },

    closeDetailsPanel () {
      this.showDetailsPanel = false
    },

    triggerAttachmentPicker () {
      this.newAttachmentFile = null
      this.$refs.detailsAttachmentPicker.pickFiles()
    },

    getAttachmentLabel (filePath) {
      if (filePath) {
        if (filePath.endsWith('.pdf')) {
          return 'PDF'
        } else if (filePath.startsWith('http')) {
          return 'HTML'
        }
      }
    },

    async addFileEvent (type, file) {
      if (file) {
        this.selectedData.addFile(file.path, type)
        this.selectedData = await copyFiles(this.selectedData)
        await dbInsertFiles(this.selectedData)
      }
    },

    async addTagsEvent (value) {
      this.selectedData.addTags(value.value)
      const tags = this.selectedData.tags.join(';')
      const success = await dbUpdate('tags', tags, this.selectedData.id)
      if (!success) {
        this.selectedData.removeTags(value.value)
      }
    },

    async removeTagsEvent (value) {
      this.selectedData.removeTags(value.value)
      const tags = this.selectedData.tags.join(';')
      const success = await dbUpdate('tags', tags, this.selectedData.id)
      if (!success) {
        this.selectedData.addTags(value.value)
      }
    },

    async ratingChangedEvent (rating) {
      const success = await dbUpdate('rating', rating, this.selectedData.id)
      if (success) {
        this.selectedData.rating = rating
      }
    },

    async noteChangedEvent (event) {
      const success = await dbUpdate('note', this.selectedData.note, this.selectedData.id)
      if (!success) {
        // TODO: Alert
      }
    },

    // Edit Panel
    openEditPanel () {
      this.editData = new PaperMeta()
      this.editData.update(this.selectedData)
      this.showEditPanel = true
      this.showDetailsPanel = false
    },

    closeEditPanel () {
      this.showEditPanel = false
    },

    async applyEditDataEvent () {
      const success = await dbInsert(this.editData)
      if (success) {
        this.selectedData.update(this.editData)
        this.$refs.dataTable.hotInstance.render()
      }
      this.closeEditPanel()
      this.openDetailsPanel()
    },

    // Files Function ---------------------------
    openFileEvent (filePath) {
      if (typeof filePath !== 'undefined' && filePath && filePath !== null) {
        if (filePath.startsWith('http')) {
          shell.openExternal(filePath)
        } else {
          shell.openPath(filePath)
        }
      }
    },

    openPaperFileEvent (filePath) {
      if (filePath) {
        this.openFileEvent(filePath)
      } else {
        this.$refs.detailsPaperPicker.pickFiles()
      }
    },

    async deleteFileEvent (type, filePath) {
      if (type === 'paper') {
        if (this.selectedData.hasAttr('paperFile')) {
          const success = await dbRemoveFile(this.selectedData.id, this.selectedData.paperFile)
          if (success) {
            await deleteFile(this.selectedData.paperFile)
            this.selectedData.paperFile = null
          }
        }
      } else {
        const success = await dbRemoveFile(this.selectedData.id, filePath)
        if (success) {
          await deleteFile(filePath)
          this.selectedData.attachments = this.selectedData.attachments.filter(item => item !== filePath)
        }
      }
    },

    // Left Panel ===============================================================
    selectNavEvent (key, type) {
      console.log(key, type)
      this.selectedNav = key
      const filtersPlugin = this.$refs.dataTable.hotInstance.getPlugin('filters')
      filtersPlugin.clearConditions(7)
      filtersPlugin.clearConditions(1)
      if (type === 'flaged') {
        filtersPlugin.addCondition(1, 'contains', [1])
      } else if (type === 'all') {
        // Do nothing
      } else if (type === 'tag') {
        filtersPlugin.addCondition(7, 'contains', [key])
      }
      filtersPlugin.filter()
    },

    // Menu =======================
    // Export Function
    async exportBibtexEvent () {
      const [fromRow, toRow] = this.getSelectedRowIdx()
      let exportBibtexStr = ''
      for (let i = fromRow; i <= toRow; i++) {
        const id = this.getRowId(i)
        const data = this.getRowData(id)
        data.constructBib()
        exportBibtexStr += data.bib + '\r'
      }

      copyToClipboard(exportBibtexStr)
        .then(() => {
          // alert
        })
        .catch(() => {
          // alert
        })
    },

    async exportAllBibtexEvent () {
      this.exportBibtexsStr = ''
      this.allData.forEach(data => {
        data.constructBib()
        this.exportBibtexsStr += data.bib + '\r'
      })
      this.showExportWindow = true
    },

    async manuallyMatch () {
      this.showLoadingLibIcon = true
      const [fromRow, toRow] = this.getSelectedRowIdx()
      let matchQueue = []
      for (let i = fromRow; i <= toRow; i++) {
        const id = this.getRowId(i)
        const data = this.getRowData(id)
        matchQueue.push(data)
      }
      matchQueue = await manuallyMatchPipeline(matchQueue)
      await Promise.all(matchQueue.map(async (paperMeta) => {
        const success = await dbInsert(paperMeta)
        if (success) {
        }
      }))
      this.$refs.dataTable.hotInstance.render()
      this.showLoadingLibIcon = false
    },

    async manuallyMatchAll () {
      this.showLoadingLibIcon = true
      this.allData = await manuallyMatchPipeline(this.allData)
      await Promise.all(this.allData.map(async (paperMeta) => {
        const success = await dbInsert(paperMeta)
        if (success) {
        }
      }))
      this.$refs.dataTable.hotInstance.render()
      this.showLoadingLibIcon = false
    },

    triggerImportfromBibFile () {
      this.$refs.fileImportFromBibFile.pickFiles()
    },

    importBibFileEvent (file) {
      this.showLoadingLibIcon = true
      fromFilesPipeline(file.path).then(
        async (paperMetas) => {
          while (true) {
            const paperMeta = paperMetas.pop()
            if (paperMeta) {
              await this.insertData(paperMeta)
            } else {
              this.showLoadingLibIcon = false
              this.queryData()
              break
            }
          }
        }
      )
    },

    async toggleFlag () {
      const [fromRow, toRow] = this.getSelectedRowIdx()
      if (fromRow !== toRow) {
        return
      }
      const id = this.getRowId(fromRow)
      const data = this.getRowData(id)
      if (data.flag === 0 || data.flag === null) {
        data.flag = 1
      } else {
        data.flag = 0
      }
      const success = await dbUpdate('flag', data.flag, data.id)
      if (!success) {
        // TODO: Alert
      }
      this.$refs.dataTable.hotInstance.render()
    },

    // Setting Window ===============
    openSetting () {
      this.initialSettingBuffer()
      this.showSettingWindow = true
    },

    initialSettingBuffer () {
      this.settingBuffer.libPathPickerFile = null
      this.settingBuffer.libPath = getSetting('libPath')
      this.settingBuffer.proxyURL = getSetting('proxyURL')
      this.settingBuffer.proxyPort = getSetting('proxyPort')
    },

    applySetting () {
      if (this.settingBuffer.libPathPickerFile) {
        setSetting('libPath', this.settingBuffer.libPathPickerFile.path.replace(this.settingBuffer.libPathPickerFile.name, ''))
      } else {
        setSetting('libPath', this.settingBuffer.libPath)
      }
      setSetting('proxyURL', this.settingBuffer.proxyURL)
      setSetting('proxyPort', this.settingBuffer.proxyPort)
    },

    getLibPath () {
      if (this.settingBuffer.libPathPickerFile) {
        return this.settingBuffer.libPathPickerFile.path.replace(this.settingBuffer.libPathPickerFile.name, '')
      } else {
        return this.settingBuffer.libPath
      }
    },

    selectLibFolder (value) {
      this.$refs.settingLibfolderPicker.pickFiles()
    },

    debugSetting () {
      console.log(this.settingBuffer)
    },

    // Window Control ================
    minimize () {
      if (process.env.MODE === 'electron') {
        this.$q.electron.remote.BrowserWindow.getFocusedWindow().minimize()
      }
    },

    maximize () {
      if (process.env.MODE === 'electron') {
        const win = this.$q.electron.remote.BrowserWindow.getFocusedWindow()

        if (win.isMaximized()) {
          win.unmaximize()
        } else {
          win.maximize()
        }
      }
    },

    close () {
      if (process.env.MODE === 'electron') {
        this.$q.electron.remote.BrowserWindow.getFocusedWindow().close()
      }
    }

  },
  mounted: async function () {
    // Initialize
    const success = await dbInit()
    if (!success) {
      console.log('Init DB failed.')
    } else {
      await this.queryData()
      this.$refs.dataTable.hotInstance.getPlugin('multiColumnSorting').sort({ column: 6, sortOrder: 'desc' })
      if (this.allData.length > 0) {
        this.selectedData = this.allData[this.allData.length - 1]
      }
    }

    // Drag to import file.
    dragDrop('.table-box', async (files, pos, fileList, directories) => {
      this.showLoadingLibIcon = true
      const filePaths = []
      files.forEach(file => {
        filePaths.push(file.path)
      })
      const paperMetas = await fromFilesPipeline(filePaths)
      await Promise.all(paperMetas.map(async (paperMeta) => {
        await this.insertData(paperMeta)
      }))
      this.showLoadingLibIcon = false
    })

    this.$el.querySelector('#data-table').querySelector('tbody').addEventListener('dblclick', () => {
      this.openPaperFileEvent(this.selectedData.paperFile)
    })
  }
}

</script>
