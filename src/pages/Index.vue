<template>
  <q-page-container>
    <q-page>
        <div class="left-p absolute-full">12</div>
        <div ref="rPanel" class="right-p absolute-full">
          <hot-table
            :data="listMetas"
            :rowHeaders="false"
            :colHeaders="['Title', 'Authors', 'Publication', 'Add Time']"
            :stretchH="'all'"
            :autoColumnSize="true"
            :manualColumnResize="true"
            :rowHeights="16"
            :colWidths="calColWidth"
            :columns="[{data: 'title', wordWrap: false}, {data: 'authorsStr', wordWrap: false}, {data: 'pub', wordWrap: false}, {data: 'addTime', wordWrap: false}, ]"
            licenseKey="non-commercial-and-evaluation">
          </hot-table>
        </div>
    </q-page>
  </q-page-container>
</template>
<style lang="sass">
@import './src/css/default.scss'
@import './src/css/leftpanel.scss'
@import './src/css/vxetable.scss'
@import './src/css/detailpanel.scss'

.setting-lib-path-text:hover
  color: #121212 !important
  cursor: pointer

.left-p
  width: 300px
  height: 100%
  background: black

.right-p
  width: calc(100% - 300px)
  left: 300px
  overflow: scroll

th
  text-align: left !important

.handsontable td
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis
</style>

<script>
import { HotTable } from '@handsontable/vue'
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
  components: {
    HotTable
  },
  computed: {
    listMetas () {
      // const filterName = this.$XEUtils.toString(this.filterName).trim().toLowerCase()
      const rest = this.allMetas
      // if (this.selectedTag !== 'All') {
      //   rest = this.allMetas.filter(item => item.tagsList.includes(this.selectedTag))
      // }
      // if (filterName) {
      //   const searchProps = ['title', 'authorsStr']
      //   rest = rest.filter(item => searchProps.some(key => this.$XEUtils.toString(item[key]).toLowerCase().indexOf(filterName) > -1))
      //   return rest
      // }
      return rest
    }
  },
  methods: {
    calColWidth (index) {
      const per = [0.35, 0.15, 0.3, 0.1]
      return this.$refs.rPanel.clientWidth * per[index]
    },

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
<style src="../../node_modules/handsontable/dist/handsontable.full.css"></style>
