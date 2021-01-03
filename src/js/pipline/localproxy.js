const tunnel = require('tunnel')
import { getSetting } from 'src/js/settings'

export function getProxy () {
  const proxyURL = getSetting('proxyURL')
  if (proxyURL && proxyURL !== '') {
    return {
      https: tunnel.httpsOverHttp({
        proxy: {
          host: getSetting('proxyURL'),
          port: getSetting('proxyPort')
        }
      })
    }
  } else {
    return null
  }
}
