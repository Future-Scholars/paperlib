<template>
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
            <q-icon class="q-mr-md lib-icon" name="fa fa-book-open" />
            <span class="lib-text">All</span>
          </q-item-section>
          <q-item-section>
          </q-item-section>
          <q-item-section avatar v-if="showLoadingLibIcon">
            <q-spinner-oval color="primary" size="1em" />
          </q-item-section>
        </q-item>
        <q-separator class="q-mt-md q-mb-md" inset />

        <q-item class="radius">
          <q-item-section avatar top>
            <span class="lib-label">Tags</span>
          </q-item-section>
        </q-item>

        <q-item class="radius" clickable v-ripple :active="selectedTags[tag]" active-class="lib-active"
          v-for="tag in allTags" :key="tag" @click="selectTag(tag)">
          <q-item-section avatar>
            <q-icon class="q-mr-md lib-icon" name="fa fa-tag" />
            <span class="lib-text">{{tag}}</span>
          </q-item-section>
        </q-item>
      </q-list>
    </q-page>
  </q-page-container>
</template>
<style lang="sass">
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
