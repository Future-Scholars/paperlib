<template>
  <q-splitter v-model="splitterModel" :separator-style="{ backgroundColor: '#DADADA' }" :limits="[15, 30]">
    <template v-slot:before>
      <q-page-container>
        <q-page class="bg-secondary" style="padding-left: 5px">
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

            <q-item class="radius-list-item" clickable v-ripple :active="selectedTag === 'All'" active-class="radius-list-item-active"
              @click="selectTag('All')">
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
            <q-separator class="q-mt-md q-mb-md" inset />

            <q-item class="radius-list-item">
              <q-item-section avatar top>
                <span class="radius-list-item-label text-primary">Tags</span>
              </q-item-section>
            </q-item>
            <q-item class="radius-list-item" clickable v-ripple active-class="radius-list-item-active"
              v-for="tag in allTags" :key="tag" :active="selectedTag === tag" @click=selectTag(tag)>
              <q-item-section avatar>
                  <q-icon class="radius-list-item-icon text-primary q-mr-md" name="fa fa-tag" />
                  <span class="radius-list-item-text text-primary"> {{tag}} </span>
              </q-item-section>
            </q-item>
          </q-list>
        </q-page>
      </q-page-container>
    </template>

    <template v-slot:after>
      <q-page-container>
        <q-page class="column justify-start">
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
                    <div >Library Folder</div>
                    <div style="color:#777777; font-size: 10px">NOTE: Cannot select a empty folder, please copy at least one useless file to initialize db.</div>
                    <div style="color:#BBBBBB; font-size: 12px" @click="selectLibFolder" class="setting-lib-path-text"> {{ getLibPath() }} </div>
                    <q-file dense ref="settingLibfolderPicker" webkitdirectory v-model="settingBuffer.libPathPickerFile" style="display: none"/>
                  </div>
                </div>
            </q-card-section>
            <q-separator style="margin-left: 110px; width: 408px" />
            <q-card-section class="q-pl-xl">
              <div class="row">
                <div class="col-2">
                  <q-avatar color="grey-3" size="lg" text-color="grey-9" icon="fa fa-globe" />
                </div>
                <div class="col"  style="margin-left:-20px">
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
                <q-input
                  v-model="exportBibtexsString"
                  standout="bg-primary text-white"
                  rows="25"
                  type="textarea"
                />
              </q-card-section>
            </q-card>
          </q-dialog>
          <div class="column col absolute-full">
            <q-bar class="q-electron-drag no-shadow titlebar" style="background-color:#F1F1F1">
              <div class="row justify-between" style="width: 100%">
                <div class="col-4">
                  <q-input round v-model="filterName" placeholder="Search" style="margin-left:20px; font-size: 14px; width: 300px">
                    <template v-slot:prepend>
                      <q-icon size="xs" name="search" />
                    </template>
                  </q-input>
                </div>
                <div class="col-3">
                  <q-btn flat size="sm" padding="xs sm" color="grey-7" icon="settings" class="q-mt-md float-right" @click="openSetting" />
                  <q-btn flat size="sm" padding="xs sm" color="grey-7" icon="add" class="q-mt-md float-right" >
                    <q-menu>
                      <q-list style="min-width: 180px">
                        <q-item class="radius-list-item" clickable @click="triggerImportfromBibFile">
                          <q-item-section avatar>
                            <q-icon class="radius-list-item-icon text-primary q-mr-md" name="fa fa-file" />
                            <span class="radius-list-item-text text-primary">Import from Bibtex file</span>
                          <q-file
                            ref="fileImportFromBibFile"
                            dense rounded outlined bottom-slots accept=".bib"
                            v-model="importedBibFile" style="display:none" @input="importBibFileEvent"/>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                  <q-btn flat size="sm" padding="xs sm" color="grey-7" icon="open_in_new" class="q-mt-md float-right" @click="exportBibtexsEvent" />
                </div>
              </div>
            </q-bar>
            <div class="col" style="padding-left: 10px; padding-right: 10px; width:100%">
              <div class="row items-start no-wrap" style="height: 100%;width:100%">
                <div class="col" style="height: 100%">
                  <vxe-table ref="xTable" resizable highlight-current-row highlight-hover-row auto-resize stripe border="none" empty-text="Library empty"
                    height="99%" class="no-select" style="padding-right: 10px; width: 100%"
                    @cell-dblclick="tableRowDBLClickEvent"
                    @cell-click="tableRowClickEvent"
                    :menu-config="tableMenu"
                    @menu-click="menuClickEvent"
                    :sort-config="{iconAsc: 'fa fa-chevron-up', iconDesc: 'fa fa-chevron-down', trigger: 'cell', defaultSort: {field: 'addTime', order: 'desc'}, orders: ['desc', 'asc', null]}"
                    :align="allAlign" :data="listMetas">
                    <vxe-table-column show-overflow="ellipsis" field="title" title="Title" width="40%"></vxe-table-column>
                    <vxe-table-column show-overflow="ellipsis" field="authorsStr" title="Authors" width="10%"></vxe-table-column>
                    <vxe-table-column show-overflow="ellipsis" field="pub" title="Publication" width="25%"></vxe-table-column>
                    <vxe-table-column show-overflow="ellipsis" sortable field="pubTime" title="Year" width="10%"></vxe-table-column>
                    <vxe-table-column show-overflow="ellipsis" sortable field="addTime" title="AddTime" width="15%"></vxe-table-column>
                  </vxe-table>
                </div>
                <div v-if="!editWindowVisiable" class="col-1" style="height: 100%; width: 250px; padding: 10px 0px 10px 0px; z-index: 99">
                  <div class="radius-border" style="height: 100%; background-color: rgb(245, 245, 245); box-shadow: 0px 5px 8px 2px rgb(0, 0, 0, 0.1);">
                  <q-scroll-area style="height: 100%;" :visible="false" >
                  <q-card flat style="background: none">
                    <q-card-section class="q-pb-sm q-mt-none">
                      <div class="text-weight-bold q-mb-sm">{{ selectedMeta.title }}</div>
                      <div class="detail-label">Authors</div>
                      <div style="font-size:12px">{{ selectedMeta.authorsStr }}</div>
                    </q-card-section>

                    <q-card-section class="q-pt-none q-pb-sm">
                      <div class="detail-label">Publication</div>
                      <div style="font-style: italic; font-size:12px">{{ selectedMeta.pub }}</div>
                    </q-card-section>

                    <q-card-section class="q-pt-none q-pb-sm">
                      <div class="detail-label">Publication Time</div>
                      <div style="font-size:12px">{{ selectedMeta.pubTime }}</div>
                    </q-card-section>
                    <q-separator inset />

                    <q-card-section class="q-pt-none q-mt-md q-pb-sm">
                      <div class="detail-label">Add Time</div>
                      <div style="font-size:12px">{{ selectedMeta.addTime }}</div>
                    </q-card-section>

                    <q-card-section class="q-pt-none q-pb-xs">
                      <div class="detail-label">Attachments
                        <q-btn size="xs" round flat color="grey-5" icon="add" @click="trigerAddAttachment"
                          style="margin-top:-2px" />
                      </div>
                      <div class="row q-mt-none">
                        <q-chip rounded outline dense size="md" color="cyan-9" clickable @click="openPaperFile(selectedMeta.paperFile)" class="q-mt-none q-ml-none">
                          <div style="font-size: 10px">PAPER</div>
                          <q-menu touch-position context-menu>
                            <q-list dense style="min-width: 80px">
                              <q-item clickable v-close-popup @click="deletePaperFile">
                                <q-item-section>Delete</q-item-section>
                              </q-item>
                            </q-list>
                          </q-menu>
                        </q-chip>
                        <q-chip rounded outline size="md" dense color="cyan-5" clickable v-for="attachment in selectedMeta.attachments" :key="attachment" @click="openFile(attachment)"  class="q-mt-none q-ml-none">
                          <div style="font-size: 10px">{{ getAttachmentLabel(attachment) }}</div>
                          <q-menu touch-position context-menu>
                            <q-list dense style="min-width: 80px">
                              <q-item clickable v-close-popup @click="deleteAttachment(attachment)">
                                <q-item-section>Delete</q-item-section>
                              </q-item>
                            </q-list>
                          </q-menu>
                        </q-chip>
                        <q-file ref="detailsAddPaper" dense rounded outlined bottom-slots v-model="newPaper" style="display:none" @input="addPaperEvent"/>
                        <q-file ref="detailsAddAttachment" dense rounded outlined bottom-slots v-model="newAttachment" style="display:none" @input="addAttachmentEvent"/>
                      </div>
                    </q-card-section>
                    <q-card-section class="q-pt-none q-pb-xs">
                      <div class="detail-label">Tags
                        <q-popup-edit ref="newTagDialog" v-model="newTag" @save="addTagEvent">
                          <q-input v-model="newTag" dense autofocus />
                        </q-popup-edit>
                        <q-btn size="xs" round flat color="grey-5" icon="add" style="margin-top:-2px"/>
                      </div>
                      <div class="row q-mt-none">
                        <q-chip rounded outline dense size="md" color="grey-7" v-for="tag in selectedMeta.tagsList" :key="tag" class="q-mt-none q-ml-none">
                          <div style="font-size: 10px; user-select: none">{{ tag }}
                            <q-menu touch-position context-menu>
                              <q-list dense style="min-width: 80px">
                                <q-item clickable v-close-popup @click="deleteTag(tag)">
                                  <q-item-section>Delete</q-item-section>
                                </q-item>
                              </q-list>
                            </q-menu>
                          </div>
                        </q-chip>
                      </div>
                    </q-card-section>
                    <q-card-section class="q-pt-none q-pb-sm">
                      <div class="detail-label">Rating</div>
                      <q-rating v-model="selectedMeta.rating" size="1em" :max="5" color="grey-8" @input="ratingChangedEvent"/>
                    </q-card-section>
                    <q-card-section class="q-pt-none q-pb-sm">
                      <div class="detail-label">Note</div>
                      <q-input v-model="selectedMeta.note" outlined autogrow color="grey-6" class="q-mt-sm" @blur="noteChangedEvent" style="font-size:12px"/>
                    </q-card-section>
                  </q-card>
                  </q-scroll-area>
                  </div>
                </div>
                <div v-if="editWindowVisiable" class="col-1" style="height: 100%; width: 250px; padding: 10px 0px 10px 0px; z-index: 99">
                  <div class="radius-border" style="height: 90%; padding: 10px 5px 5px 5px; background-color: rgb(245, 245, 245); box-shadow: 0px 5px 8px 2px rgb(0, 0, 0, 0.1);">
                        <q-input class="q-mb-sm" standout="bg-primary text-white" v-model="editWindowMeta.title"
                          label="Title" stack-label dense autogrow style="font-size:12px; color: #676767" />
                        <q-input class="q-mb-sm" standout="bg-primary text-white" v-model="editWindowMeta.authorsStr" label="Authors"
                          stack-label dense autogrow style="font-size:12px" />
                        <q-input class="q-mb-sm" standout="bg-primary text-white" v-model="editWindowMeta.pub" label="Publication"
                          stack-label dense autogrow style="font-size:12px" />
                        <q-input class="q-mb-sm" standout="bg-primary text-white" v-model="editWindowMeta.pubTime"
                          label="Publication Time" stack-label dense autogrow style="font-size:12px" />
                        <q-input class="q-mb-sm" standout="bg-primary text-white" v-model="editWindowMeta.doi" label="DOI" stack-label
                          dense autogrow style="font-size:12px" />
                        <q-input class="q-mb-sm" standout="bg-primary text-white" v-model="editWindowMeta.arxiv" label="Arxiv"
                          stack-label dense autogrow style="font-size:12px" />
                  </div>
                  <div style="height: 10%; text-align: center">
                    <q-btn  round size="sm" color="grey-5" icon="close" class="q-mr-md q-mt-md" @click="editWindowVisiable=false"/>
                    <q-btn  round size="sm" color="grey-7" icon="done" class="q-ml-md q-mt-md" @click="applyEditMetaEvent"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-page>
      </q-page-container>
    </template>
  </q-splitter>
</template>
<style lang="sass">
@import './src/css/default.scss'
@import './src/css/leftpanel.scss'
@import './src/css/vxetable.scss'
@import './src/css/detailpanel.scss'

.setting-lib-path-text:hover
  color: #121212 !important
  cursor: pointer
</style>

<script>

import { fromFilesPipeline, manuallyMatchPipeline } from 'src/js/pipline/pipeline'
import { newPaperMetafromObj } from 'src/js/pipline/structure'
import { initDB, insertToDB, queryAllMetaFromDB, queryFilesFromDB, deleteFromDB, updateRating, updateNote, deleteFileFromDB, addTags, queryTagsFromDB } from '../js/db/db'
import dragDrop from 'drag-drop'
import { shell } from 'electron'
import { getSetting, setSetting } from 'src/js/settings'
import { copyPaperAndAttachments, deletePaperAndAttachments } from 'src/js/pipline/file'
import { copyToClipboard } from 'quasar'
export default {
  data () {
    return {
      showLoadingLibIcon: false,
      allAlign: null,
      filterName: '',
      allMetas: [],
      newAttachment: null,
      newPaper: null,
      importedBibFile: null,
      exportBibtexsString: null,
      splitterModel: 20,
      showSettingWindow: false,
      showExportWindow: false,
      editWindowVisiable: false,
      settingBuffer: { libPathPickerFile: null, proxyURL: null, proxyPort: null },
      selectedMeta: newPaperMetafromObj({
        title: 'PaperLib',
        authorsStr: 'Geo',
        pub: 'Open source paper management software.',
        pubType: null,
        pubTime: 2020,
        doi: null,
        paperFile: null,
        attachments: [],
        rating: 0,
        note: '',
        tags: null
      }),
      editWindowMeta: newPaperMetafromObj({
        title: 'PaperLib',
        authorsStr: 'Geo',
        pub: 'Open source paper management software.',
        pubType: null,
        pubTime: 2020,
        doi: null,
        paperFile: null,
        attachments: [],
        rating: 0,
        note: '',
        tags: null
      }),
      newTag: null,
      allTags: [],
      selectedTag: 'All',
      tableMenu: {
        className: 'library-menus',
        body: {
          options: [
            [
              { code: 'refresh', name: 'Refresh library' },
              { code: 'remove', name: 'Remove from library' }
            ],
            [
              { code: 'match', name: 'Match metadata' },
              { code: 'matchall', name: 'Match all metadata' }
            ],
            [
              { code: 'edit', name: 'Edit metadata' },
              {
                code: 'exportbib',
                name: 'Export bibtext'
              },
              {
                code: 'debug',
                name: 'Debug'
              }
            ]
          ]
        }
      }
    }
  },
  computed: {
    listMetas () {
      const filterName = this.$XEUtils.toString(this.filterName).trim().toLowerCase()
      let rest = this.allMetas
      if (this.selectedTag !== 'All') {
        rest = this.allMetas.filter(item => item.tagsList.includes(this.selectedTag))
      }
      if (filterName) {
        const searchProps = ['title', 'authorsStr']
        rest = rest.filter(item => searchProps.some(key => this.$XEUtils.toString(item[key]).toLowerCase().indexOf(filterName) > -1))
        return rest
      }
      return rest
    }
  },
  methods: {
    // Window Control ===========================================================
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
    },

    // Left Panel ===============================================================
    selectTag (tag) {
      this.selectedTag = tag
      if (tag === 'All') {
        this.quaryAllMetas()
      }
    },

    // Menu =======================
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
              await this.insertMeta(paperMeta)
            } else {
              this.showLoadingLibIcon = false
              this.quaryAllMetas()
              break
            }
          }
        }
      )
    },

    // DB operation ===================================================================
    async quaryAllMetas () {
      const allData = await queryAllMetaFromDB()
      this.allMetas.length = 0
      for (let i = 0; i < allData.length; i++) {
        for (const tagIdx in allData[i].tagsList) {
          const tag = allData[i].tagsList[tagIdx]
          if (!this.allTags.includes(tag)) {
            this.allTags.push(tag)
          }
        }
        this.allMetas.push(allData[i])
      }
    },
    async insertMeta (paperMeta) {
      paperMeta = await copyPaperAndAttachments(paperMeta)
      const id = await insertToDB(paperMeta)
      paperMeta.id = id
      if (id) {
        return await this.$refs.xTable.insertAt(paperMeta, null)
      } else {
        return false
      }
    },
    async deleteMeta (paperMeta) {
      await deletePaperAndAttachments(paperMeta)
      const success = await deleteFromDB(paperMeta)
      if (success) {
        this.$refs.xTable.remove(paperMeta)
      } else {
        console.log('Cannot delete')
      }
    },
    editMeta (paperMeta) {
      this.editWindowMeta = newPaperMetafromObj(paperMeta)
      this.editWindowVisiable = true
    },
    async applyEditMetaEvent () {
      const success = await insertToDB(this.editWindowMeta)
      if (success) {
        this.selectedMeta.update(this.editWindowMeta)
      }
      this.editWindowVisiable = false
    },

    // Detail panel ==============================================================
    getAttachmentLabel (filePath) {
      if (filePath) {
        if (filePath.endsWith('.pdf')) {
          return 'PDF'
        } else if (filePath.startsWith('http')) {
          return 'HTML'
        }
      }
    },

    trigerAddAttachment () {
      this.$refs.detailsAddAttachment.pickFiles()
    },

    async addAttachmentEvent (file) {
      if (file) {
        this.selectedMeta.addFile(file.path, 'attachment')
        this.selectedMeta = await copyPaperAndAttachments(this.selectedMeta)
        await insertToDB(this.selectedMeta)
      }
    },

    async addPaperEvent (file) {
      if (file) {
        this.selectedMeta.addFile(file.path, 'paper')
        this.selectedMeta = await copyPaperAndAttachments(this.selectedMeta)
        await insertToDB(this.selectedMeta)
      }
    },

    ratingChangedEvent (rating) {
      updateRating(this.selectedMeta.id, rating)
    },

    noteChangedEvent (event) {
      updateNote(this.selectedMeta.id, this.selectedMeta.note)
    },

    async addTagEvent (value, initialValue) {
      if (!this.selectedMeta.tagsList.includes(value)) {
        this.selectedMeta.tagsList.push(value)
        this.selectedMeta.tagsStr = this.selectedMeta.tagsList.join(';')
        await addTags(this.selectedMeta.id, this.selectedMeta.tagsStr)
        if (!this.allTags.includes(value)) {
          this.allTags.push(value)
        }
      }
      this.newTag = null
    },

    async deleteTag (tag) {
      const tags = this.selectedMeta.tagsList.filter(item => item !== tag)
      const tagsStr = tags.join(';')
      const success = await addTags(this.selectedMeta.id, tagsStr)
      if (success) {
        this.selectedMeta.tagsList = tags
        this.selectedMeta.tagsStr = tagsStr
      }
    },

    // Files
    openPaperFile (filePath) {
      if (filePath) {
        this.openFile(filePath)
      } else {
        this.$refs.detailsAddPaper.pickFiles()
      }
    },

    openFile (filePath) {
      if (typeof filePath !== 'undefined' && filePath && filePath !== null) {
        if (filePath.startsWith('http')) {
          shell.openExternal(filePath)
        } else {
          shell.openPath(filePath)
        }
      }
    },

    async deletePaperFile () {
      if (this.selectedMeta.hasPaperFile()) {
        const success = await deleteFileFromDB(this.selectedMeta.id, this.selectedMeta.paperFile)
        if (success) {
          this.selectedMeta.paperFile = null
        }
      }
    },

    async deleteAttachment (filePath) {
      const success = await deleteFileFromDB(this.selectedMeta.id, filePath)
      if (success) {
        this.selectedMeta.attachments = this.selectedMeta.attachments.filter(item => item !== filePath)
      }
    },

    async queryFiles (paperMeta) {
      const files = await queryFilesFromDB(paperMeta.id)
      for (const i in files) {
        const file = files[i]
        paperMeta.addFile(file.path, file.type)
      }
      return paperMeta
    },

    async queryTagsFromDB (paperMeta) {
      const tagsStr = await queryTagsFromDB(paperMeta.id)
      paperMeta.tagsStr = tagsStr
      if (paperMeta.tagsStr) {
        paperMeta.tagsList = tagsStr.split(';')
      }
      return paperMeta
    },

    async tableRowClickEvent ({ row }) {
      if (typeof row.hasPaperFile === 'undefined') {
        row = newPaperMetafromObj(row)
      }
      if (!row.hasPaperFile()) {
        row = await this.queryFiles(row)
      }
      row = await this.queryTagsFromDB(row)
      this.selectedMeta = row
    },

    async tableRowDBLClickEvent ({ row }) {
      if (typeof row.hasPaperFile === 'undefined') {
        row = newPaperMetafromObj(row)
      }
      if (row.hasPaperFile()) {
        this.openFile(row.paperFile)
      } else {
        row = await this.queryFiles(row)
        if (row.hasPaperFile()) {
          this.openFile(row.paperFile)
        }
      }
    },

    async exportBibtexEvent (paperMeta) {
      paperMeta.constructBib()
      copyToClipboard(paperMeta.bib)
        .then(() => {
          // alert
        })
        .catch(() => {
          // alert
        })
    },

    async exportBibtexsEvent () {
      this.exportBibtexsString = ''
      const tableData = this.$refs.xTable.getTableData().visibleData
      for (const paperMeta of tableData) {
        paperMeta.constructBib()
        this.exportBibtexsString += paperMeta.bib + '\r'
      }
      this.showExportWindow = true
    },

    async manuallyMatch (paperMetas) {
      this.showLoadingLibIcon = true
      paperMetas = await manuallyMatchPipeline(paperMetas)
      await Promise.all(paperMetas.map(async (paperMeta) => {
        const success = await insertToDB(paperMeta)
        if (success) {
          if (this.selectedMeta.id === paperMeta.id) {
            this.selectedMeta = paperMeta
          }
        }
      }))
      this.showLoadingLibIcon = false
    },

    manuallyMatchAll () {
      const tableData = this.$refs.xTable.getTableData().visibleData
      this.manuallyMatch(tableData)
    },

    menuClickEvent ({ menu, row, column }) {
      switch (menu.code) {
        case 'remove':
          this.deleteMeta(row)
          break
        case 'refresh':
          this.quaryAllMetas()
          break
        case 'edit':
          this.editMeta(row)
          break
        case 'match':
          this.manuallyMatch([row])
          break
        case 'matchall':
          this.manuallyMatchAll()
          break
        case 'exportbib':
          this.exportBibtexEvent(row)
          break
        case 'debug':
          console.log(row)
          break
        default:
          console.log(menu.code)
      }
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
    }

  },
  mounted: async function () {
    // Initialize
    const initDBsuccess = await initDB()
    if (!initDBsuccess) {
      console.log('Init DB failed.')
    } else {
      this.quaryAllMetas()
    }
    // Drag to import file.
    dragDrop('.vxe-table', async (files, pos, fileList, directories) => {
      this.showLoadingLibIcon = true
      const filePaths = []
      files.forEach(file => {
        filePaths.push(file.path)
      })
      const paperMetas = await fromFilesPipeline(filePaths)
      await Promise.all(paperMetas.map(async (paperMeta) => {
        await this.insertMeta(paperMeta)
      }))
      this.showLoadingLibIcon = false
    })
  }
}

</script>
