class RequestCtlManager {
  private readonly key2ControllerMap: Map<string, AbortController[]>

  constructor() {
    this.key2ControllerMap = new Map()
  }

  getControllerMap(): Map<string, AbortController[]> {
    return this.key2ControllerMap
  }

  getControllerByKey(key: string): AbortController[] | undefined {
    return this.key2ControllerMap.get(key)
  }

  addController(key: string, controller: AbortController) {
    const ctl = this.getControllerByKey(key)

    if (!ctl) {
      this.key2ControllerMap.set(key, [controller])
    } else if (!ctl.includes(controller)) {
      ctl.push(controller)
    }
  }

  // 在 request 回调中调用
  removeControllerBySignal(key: string, signal: AbortSignal) {
    const ctl = this.getControllerByKey(key)

    if (ctl) {
      const index = ctl.findIndex(c => c.signal === signal)

      if (index !== -1) {
        ctl.splice(index, 1)

        if (ctl.length === 0) {
          this.key2ControllerMap.delete(key)
        }
      }
    }
  }

  // 主动 cancel request 时调用
  abortAndRemove(key: string) {
    const ctl = this.getControllerByKey(key)

    if (ctl) {
      ctl.forEach(c => c.abort())
      this.key2ControllerMap.delete(key)
    }
  }
}

export default RequestCtlManager
