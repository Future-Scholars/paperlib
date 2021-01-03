import Store from 'electron-store'
import { remote } from 'electron'

const store = new Store()

function initial () {
  if (typeof store.get('libPath') === 'undefined') {
    console.log('Initialize config.')
    setSetting('libPath', remote.app.getPath('home') + '/paperlib')
    setSetting('proxyURL', null)
    setSetting('proxyPort', null)
  }
}

initial()

export function getSetting (key) {
  const value = store.get(key)
  return value
}

export function setSetting (key, value) {
  return store.set(key, value)
}
