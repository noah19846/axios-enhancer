import type { AxiosStatic, AxiosInstance } from 'axios'
import type { CancelConfig } from './types'

import axios from 'axios'
import RequestCtlManager from './request-ctl-manager'

export default function cancelEnhancer(axiosOrInstance: AxiosInstance | AxiosStatic) {
  const ctlManager = new RequestCtlManager()
  const DEFAULT_CONFIG: CancelConfig = {
    needCancel: false
  }

  axiosOrInstance.interceptors.request.use(config => {
    config.$$userConfig = {
      ...DEFAULT_CONFIG,
      ...config.$$userConfig
    }

    if (config.$$userConfig.needCancel && !config.signal) {
      const ac = new AbortController()

      if (typeof config.$$userConfig.key !== 'string') {
        config.$$userConfig.key = config.url
      }

      config.signal = ac.signal
      ctlManager.addController(config.$$userConfig.key!, ac)
    }

    return config
  })

  axiosOrInstance.interceptors.response.use(
    response => {
      // remove the controller from map when resolved
      if (response.config.$$userConfig!.needCancel && response.config.signal) {
        ctlManager.removeControllerBySignal(response.config.$$userConfig!.key!, response.config.signal as AbortSignal)
      }

      return response
    },

    error => {
      if (axios.isAxiosError(error) && error.config) {
        // remove the controller from map when rejected
        if (error.config.$$userConfig!.needCancel) {
          ctlManager.removeControllerBySignal(error.config.$$userConfig!.key!, error.config.signal as AbortSignal)
        }
      }

      return Promise.reject(error)
    }
  )

  Object.defineProperty(axiosOrInstance, '$$ctlManager', {
    value: ctlManager
  })

  return axiosOrInstance
}
