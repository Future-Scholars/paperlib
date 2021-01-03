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
      <q-item class="radius">
        <q-item-section avatar top>
          <span class="lib-label">Library</span>
        </q-item-section>
      </q-item>

      <q-item class="radius" clickable v-ripple :active="selectedAll" active-class="lib-active" @click="selectAll">
        <q-item-section avatar>
          <q-icon class="q-mr-md lib-icon" name="fa fa-book-open"/>
          <span class="lib-text">All</span>
        </q-item-section>
        <q-item-section>
        </q-item-section>
        <q-item-section avatar v-if="showLoadingLibIcon">
          <q-spinner-oval color="primary" size="1em"/>
        </q-item-section>
      </q-item>
      <q-separator class="q-mt-md q-mb-md" inset />

      <q-item class="radius">
        <q-item-section avatar top>
          <span class="lib-label">Tags</span>
        </q-item-section>
      </q-item>

      <q-item class="radius" clickable v-ripple :active="selectedTags[tag]" active-class="lib-active" v-for="tag in allTags" :key="tag" @click="selectTag(tag)">
        <q-item-section avatar>
          <q-icon class="q-mr-md lib-icon" name="fa fa-tag"/>
          <span class="lib-text">{{tag}}</span>
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
                <div class="text-h6 ">Settings</div>
              </q-card-section>
              <q-card-section class="q-pl-xl">
                <div class="row">
                  <div class="col-2">
                    <q-avatar color="grey-3" size="lg" text-color="grey-9" icon="folder" />
                  </div>
                  <div class="col" style="margin-left:-20px">
                    <div >Library Folder</div>
                    <div style="color:#BBBBBB; font-size: 12px" @click="selectLibFolder" class="setting-lib-path-text"> {{ getLibPath() }} </div>
                    <q-file dense ref="settingLibfolderPicker" webkitdirectory v-model="settingBuffer.libPathPickerFile" style="display: none" />
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

        <q-dialog v-model="showManuallyWindow" persistent>
          <q-card class="q-pl-md q-pr-md" style="min-width: 450px">
            <q-card-section>
              <div class="text-bold">Please input paper metadata manually</div>
            </q-card-section>

            <q-card-section class="q-pt-none">
              <q-input dense v-model="manuallyMeta.title" autofocus label="Title" />
            </q-card-section>

            <q-card-section class="q-pt-none">
              <q-input dense v-model="manuallyMeta.authors"  label="Authors (e.g., Lebron James and Stephen Curry)" />
            </q-card-section>

            <q-card-section class="q-pt-none">
              <q-input dense v-model="manuallyMeta.pub"  label="Publication" />
            </q-card-section>

            <q-card-section class="q-pt-none">
              <q-select dense v-model="manuallyMeta.pubType" :options="manuallyTypeOptions" label="Type" />
            </q-card-section>

            <q-card-section class="q-pt-none">
              <q-input dense v-model="manuallyMeta.pubTime"  label="Year" />
            </q-card-section>

            <q-card-section class="q-pt-none">
              <q-input dense v-model="manuallyMeta.doi"  label="DOI" />
            </q-card-section>

            <q-card-section class="q-pt-none">
              <q-file dense v-model="manuallyMeta.file" :label="manuallyMeta.paperFile" />
            </q-card-section>

            <q-card-actions align="right" class="text-primary">
              <q-btn no-caps flat label="Match" :disable="manuallyMatchFlag()" :loading="manuallyMatchLoading" @click="matchManualMeta"/>
              <q-btn no-caps flat label="Cancel" v-close-popup />
              <q-btn no-caps flat label="Add" v-close-popup @click="addManualMeta" />
            </q-card-actions>
          </q-card>
        </q-dialog>
        <div class="column col absolute-full">
          <div style="height: 50px; width:100%">
            <q-bar class="q-electron-drag no-shadow" style="background-color:#F1F1F1; height: 50px; width: 100%">
              <div class="row justify-between" style="width: 100%">
                <div class="col-4">
                  <q-input round v-model="filterName" placeholder="Search"
                    style="margin-left:20px; font-size: 14px; width: 300px">
                    <template v-slot:prepend>
                      <q-icon size="xs" name="search" />
                    </template>
                  </q-input>
                </div>
                <div class="col-3" style="text-align: right;">
                  <q-btn outline round size="xs" color="grey-7" icon="add" class="q-mt-md q-mr-md" @click="manuallyAddEvent" />
                  <q-btn outline round size="xs" color="grey-7" icon="settings" class="q-mt-md q-mr-md" @click="openSetting" />
                </div>
              </div>
            </q-bar>
          </div>
          <div class="col" style="padding-left: 10px; padding-right: 10px; width:100%">
            <div class="row items-start no-wrap" style="height: 100%;width:100%">
              <div class="col" style="height: 100%">
                <vxe-table ref="xTable" resizable highlight-current-row highlight-hover-row auto-resize stripe border="none"
                  empty-text="Library empty"
                  height="99%" style="padding-right: 10px; width: 100%"
                  @cell-dblclick="tableRowDBLClickEvent"
                  @cell-click="tableRowClickEvent"
                  :menu-config="tableMenu"
                  @menu-click="menuClickEvent"
                  :sort-config="{iconAsc: 'fa fa-chevron-up', iconDesc: 'fa fa-chevron-down', trigger: 'cell', defaultSort: {field: 'add', order: 'desc'}, orders: ['desc', 'asc', null]}"
                  :align="allAlign" :data="listMetas">
                  <vxe-table-column show-overflow="ellipsis" field="title" title="Title" width="40%"></vxe-table-column>
                  <vxe-table-column show-overflow="ellipsis" field="authorsStr" title="Authors" width="10%"></vxe-table-column>
                  <vxe-table-column show-overflow="ellipsis" field="pub" title="Publication" width="25%"></vxe-table-column>
                  <vxe-table-column show-overflow="ellipsis" sortable field="pubTime" title="Year" width="10%"></vxe-table-column>
                  <vxe-table-column show-overflow="ellipsis" sortable field="addTime" title="AddTime" width="15%"></vxe-table-column>
                </vxe-table>
              </div>
              <div class="col-1" style="color: #343434; height: 100%; width: 250px; border-left: 1px solid #DBDBDB; padding-top: 5px; ">
                <q-card flat>
                  <q-card-section class="q-pb-sm">
                    <div class="text-weight-bold">{{ selectedMeta.title }}</div>
                    <div style="color: gray; font-size:12px">{{ selectedMeta.authorsStr }}</div>
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
                      <q-chip rounded outline dense size="md" color="cyan-9" clickable :disable="selectedMeta.paperFile === null" @click="openFile(selectedMeta.paperFile)" class="q-mt-none q-ml-none">
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
                        <div style="font-size: 10px">{{ getAttachmentLable(attachment) }}</div>
                        <q-menu touch-position context-menu>
                          <q-list dense style="min-width: 80px">
                            <q-item clickable v-close-popup @click="deleteAttachment(attachment)">
                              <q-item-section>Delete</q-item-section>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </q-chip>
                      <q-file ref="detailsAddAttachment" dense rounded outlined bottom-slots v-model="newAttachment" label="Add Attachment" style="display:none" @input="addAttachmentEvent"/>
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
                    <q-rating v-model="selectedMeta.rating" size="1em" :max="5" color="grey-6" @input="ratingChangedEvent"/>
                  </q-card-section>
                  <q-card-section class="q-pt-none q-pb-sm">
                    <div class="detail-label">Note</div>
                    <q-input v-model="selectedMeta.note" outlined autogrow color="grey-6" class="q-mt-sm" @blur="noteChangedEvent" style="font-size:12px"/>
                  </q-card-section>
                </q-card>
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
@import 'vxe-table/styles/variable.scss'
$vxe-font-size: 12px
$vxe-font-color: #666
$vxe-table-row-height-default: 22px
$vxe-table-row-line-height: 18px
$vxe-table-row-striped-background-color: #f1f3f2
@import 'vxe-table/styles/modules.scss'
table-box
  width: calc(100%-250px)
  height: 100%
table
  border-collapse: separate
td
  border: solid 0px #00000000
  user-select: none
td:first-child
  border-top-left-radius: 5px
  border-bottom-left-radius: 5px
td:last-child
  border-top-right-radius: 5px
  border-bottom-right-radius: 5px
.keyword-lighten
  color: #000
  background-color: #FFFF00
.vxe-sort--asc-btn
  font-size: 8px
  padding-top: 2px
.vxe-sort--desc-btn
  font-size: 8px
  padding-bottom: 2px
.detail-label
  user-select: none
  font-size:10px
  color: #898989
  font-weight: 500
.lib-active
  background-color: #C1C1C1
  color: #212121
  font-weight: 500
.radius
  height: 28px !important
  min-height: 28px !important
  line-height: 28px !important
  border: solid 0px #00000000
  border-top-left-radius: 5px
  border-bottom-left-radius: 5px
  border-top-right-radius: 5px
  border-bottom-right-radius: 5px
.lib-icon
  font-size: 12px !important
  color: #454545
  margin-left: -5px
  margin-right: 8px
.lib-text
  color: #565656
  font-size: 12px !important
.lib-label
  color: #454545
  font-size: 12px
  font-weight: 600
  margin-left: 5px
.vxe-table--context-menu-wrapper,.vxe-table--context-menu-clild-wrapper
  background-color: #EFEFEF
  box-shadow: 0px 0px 10px 5px rgba(0,0,0,.1)
  border: solid 1px #00000011
  border-top-left-radius: 8px
  border-bottom-left-radius: 8px
  border-top-right-radius: 8px
  border-bottom-right-radius: 8px
.vxe-context-menu--link-content
  color: #000000
.vxe-context-menu--link
  padding-left: 10px !important
.link--active
  background-color: #DADADA !important
.vxe-context-menu--option-wrapper, .vxe-table--context-menu-clild-wrapper
  padding: 2px
.vxe-context-menu--option-wrapper li,.vxe-table--context-menu-clild-wrapper li
  border: solid 0px #00000000
  border-top-left-radius: 8px
  border-bottom-left-radius: 8px
  border-top-right-radius: 8px
  border-bottom-right-radius: 8px
.setting-lib-path-text:hover
  color: #121212 !important
  cursor: pointer
</style>

<script>

import { fromFilePipeline, manuallyMatchPipeline } from 'src/js/pipline/pipeline'
import { newPaperMetafromObj, PaperMeta } from 'src/js/pipline/structure'
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
      splitterModel: 20,
      showDetailWindow: false,
      showSettingWindow: false,
      settingBuffer: { libPathPickerFile: null, proxyURL: null, proxyPort: null },
      showManuallyWindow: false,
      manuallyMatchLoading: false,
      manuallyTypeOptions: ['journal', 'conference'],
      manuallyMeta: {
        title: null,
        authorsStr: null,
        pub: null,
        pubType: null,
        pubTime: null,
        doi: null,
        paperFile: null,
        file: null
      },
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
      newTag: null,
      allTags: [],
      selectedAll: true,
      selectedTags: [],
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
      if (filterName) {
        const filterRE = new RegExp(filterName, 'gi')
        const searchProps = ['title', 'authorsStr']
        const rest = this.allMetas.filter(item => searchProps.some(key => this.$XEUtils.toString(item[key]).toLowerCase().indexOf(filterName) > -1))
        return rest.map(row => {
          const item = Object.assign({}, row)
          searchProps.forEach(key => {
            item[key] = this.$XEUtils.toString(item[key]).replace(filterRE, match => `${match}`)
          })
          return item
        })
      }
      return this.allMetas
    }

  },
  methods: {

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

    // Navigation Panel ===============================================================
    selectAll () {
      this.selectedAll = true
      this.allTags.forEach(tag => {
        this.selectedTags[tag] = false
      })
      this.quaryAllMetas()
    },

    async selectTag (tag) {
      this.selectedAll = false
      this.allTags.forEach(t => {
        this.selectedTags[t] = false
      })
      this.selectedTags[tag] = true
      const filteredMeta = []
      const allData = await queryAllMetaFromDB()
      allData.forEach(currentMeta => {
        if (currentMeta.tagsList.includes(tag)) {
          filteredMeta.push(currentMeta)
        }
      })
      this.allMetas.length = 0
      this.allMetas = filteredMeta
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
            this.selectedTags[tag] = false
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

    // Detail panel ==============================================================
    getAttachmentLable (filePath) {
      if (filePath.endsWith('.pdf')) {
        return 'PDF'
      } else if (filePath.startsWith('http')) {
        return 'HTML'
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
      console.log(paperMeta.bib)
      copyToClipboard(paperMeta.bib)
        .then(() => {
          // alert
        })
        .catch(() => {
          // alert
        })
    },

    menuClickEvent ({ menu, row, column }) {
      switch (menu.code) {
        case 'remove':
          this.deleteMeta(row)
          break
        case 'refresh':
          this.quaryAllMetas()
          break
        case 'match':
          this.showLoadingLibIcon = true
          manuallyMatchPipeline(row).then((paperMeta) => {
            insertToDB(paperMeta).then((id) => {
              row = paperMeta
              if (this.selectedMeta.id === paperMeta.id) {
                this.selectedMeta = paperMeta
              }
              this.showLoadingLibIcon = false
            })
          })
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

    initManualMeta () {
      this.manuallyMeta.title = null
      this.manuallyMeta.authorsStr = null
      this.manuallyMeta.pub = null
      this.manuallyMeta.pubType = null
      this.manuallyMeta.pubTime = null
      this.manuallyMeta.doi = null
    },

    addManualMeta () {
      const paperMeta = new PaperMeta()
      paperMeta.title = this.manuallyMeta.title
      paperMeta.authorsStr = this.manuallyMeta.authorsStr
      paperMeta.pub = this.manuallyMeta.pub
      paperMeta.pubType = this.manuallyMeta.pubType
      paperMeta.pubTime = this.manuallyMeta.pubTime
      paperMeta.doi = this.manuallyMeta.doi
      if (typeof this.manuallyMeta.paperFile === 'string' && this.manuallyMeta.paperFile !== '') {
        paperMeta.paperFile = this.manuallyMeta.paperFile
      } else if (this.manuallyMeta.file) {
        paperMeta.paperFile = this.manuallyMeta.file.path
      }

      insertToDB(paperMeta).then((id) => {
        this.quaryAllMetas()
      })
    },

    matchManualMeta () {
      this.manuallyMatchLoading = true
      manuallyMatchPipeline(newPaperMetafromObj(this.manuallyMeta)).then((paperMeta) => {
        this.manuallyMeta = paperMeta
        this.manuallyMatchLoading = false
      }
      )
    },

    manuallyMatchFlag () {
      return !((this.manuallyMeta.title && this.manuallyMeta.title !== '') || (this.manuallyMeta.doi && this.manuallyMeta.doi !== ''))
    },

    manuallyAddEvent () {
      this.initManualMeta()
      this.showManuallyWindow = true
    },

    // Setting Window ===============
    openSetting () {
      this.initialSettingBuffer()
      this.showSettingWindow = true
    },

    initialSettingBuffer () {
      console.log('Init')
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
    this.$q.loading.hide()
    const initDBsuccess = await initDB()
    if (!initDBsuccess) {
      console.log('Init DB failed.')
      return
    }
    this.quaryAllMetas()
    // Drag to import file.
    const importQueue = []
    dragDrop('.vxe-table', (files, pos, fileList, directories) => {
      for (const i in files) {
        if (!importQueue.includes(files[i].path)) {
          importQueue.push(files[i].path)
        }
      }
      while (true) {
        const filePath = importQueue.pop()
        if (typeof filePath !== 'undefined' && filePath) {
          this.$q.loading.show({
            message: (importQueue.length + 1) + ' remaining in the queue...'
          })
          fromFilePipeline(filePath).then(
            async (paperMeta) => {
              if (paperMeta.hasTitle()) {
                await this.insertMeta(paperMeta)
                if (importQueue.length === 0) {
                  this.$q.loading.hide()
                }
              } else {
                this.manuallyAddEvent()
                this.manuallyMeta.paperFile = paperMeta.paperFile
                this.$q.loading.hide()
              }
            }
          )
        } else {
          break
        }
      }
    })
  }
}

</script>
