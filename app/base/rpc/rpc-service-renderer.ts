import { RendererProcessMessagePortRPCProtocol } from './renderer-process-messageport-rpc-protocol'
import { RPCService } from './rpc-service'

export class RendererProcessRPCService extends RPCService {
  constructor(
    protected readonly _processID: string,
    protected readonly _exposeAPIGroup?: string
  ) {
    super(_processID, _exposeAPIGroup)

    if (globalThis.window === undefined) {
      throw new Error(
        'RendererProcessRPCService should only be instantiated in the renderer process'
      )
    }
  }

  async initCommunication(): Promise<void> {
    // 1. Notify all processes that the current process is happy to communicate now.
    // 2. All other processes will try to send a messageport to here via the main process as a bridge.
    // 3. Once receiving a messageport, the current process will create a MessagePortProtocol for communication.
    // 4. All actionors in the current process will be binded with this protocol immediately.

    // 5. After the protocol is created, we will send a message through the protocol to request the exposed APIs.
    //    All this code should be in the protocol class.
    window.addEventListener('message', (event) => {
      const { type, value } = event.data

      if (type === 'response-port') {
        const port = event.ports[0]
        if (!this._protocols[value]) {
          const protocol = new RendererProcessMessagePortRPCProtocol(port, this._processID, false)

          this._protocols[value] = protocol
          this.initActionor(protocol)

          this._exposeAPIGroup && protocol.sendExposedAPI(this._exposeAPIGroup)
        }
      } else if (type === 'destroy-port') {
        if (this._protocols[value]) {
          delete this._protocols[value]
        }
      }
    })

    console.log('RendererProcessRPCService: initCommunication', this._processID)
    window["electron"].ipcRenderer.send('request-port', this._processID)
  }
}
