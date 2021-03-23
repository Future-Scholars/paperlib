import { version } from '../../package.json'
import { getProxy } from 'src/js/pipline/localproxy'
const got = require('got')

export async function checkUpdate () {
  try {
    const res = await got('https://raw.githubusercontent.com/GeoffreyChen777/paperlib/master/VERSION', {
      agent: getProxy(),
      headers: {
        'accept-encoding': 'UTF-32BE'
      }
    })
    const releaseVersion = res.body
    if (releaseVersion !== version) {
      return true
    } else {
      return false
    }
  } catch (error) {
    return false
  }
}
