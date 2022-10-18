import type { AxiosStatic, AxiosInstance } from 'axios'
import axios from 'axios'

import RequestCtlManager from './request-ctl-manager'

declare module 'axios' {
  export interface AxiosRequestConfig {
    $$userConfig?: UserConfig
  }
  export interface AxiosStatic {
    $$ctlManager: RequestCtlManager
  }
  export interface AxiosInstance {
    $$ctlManager: RequestCtlManager
  }
}

export type UserConfig = {
  key?: string
  needCancel?: boolean
  retryCount?: number
  [index: string]: unknown
}

const isTimeoutInAxios = (code?: string) => code === 'ECONNABORTED' || code === 'ETIMEDOUT'

export default function axiosEnhancer(axiosOrInstance: AxiosInstance | AxiosStatic) {
  const ctlManager = new RequestCtlManager()
  const DEFAULT_USER_CONFIG: UserConfig = {
    needCancel: false,
    retryCount: 0
  }

  axiosOrInstance.interceptors.request.use(config => {
    const cfg = config

    if (!cfg.$$userConfig) {
      cfg.$$userConfig = DEFAULT_USER_CONFIG
    } else {
      cfg.$$userConfig = {
        ...DEFAULT_USER_CONFIG,
        ...cfg.$$userConfig
      }
    }

    if (cfg.$$userConfig.needCancel && !cfg.signal) {
      const ac = new AbortController()

      if (typeof cfg.$$userConfig.key !== 'string') {
        cfg.$$userConfig.key = cfg.url
      }
      cfg.signal = ac.signal
      ctlManager.addController(cfg.$$userConfig.key!, ac)
    }

    return cfg
  })

  axiosOrInstance.interceptors.response.use(
    response => {
      // remove the controller from map when resolved
      if (response.config.$$userConfig?.needCancel && response.config.signal) {
        ctlManager.removeControllerBySignal(response.config.$$userConfig.key!, response.config.signal as AbortSignal)
      }

      return response
    },

    error => {
      const err = error

      if (axios.isAxiosError(err) && err.config) {
        const { retryCount } = err.config.$$userConfig!

        if (isTimeoutInAxios(err.code) && typeof retryCount === 'number' && retryCount > 0) {
          err.config.$$userConfig!.retryCount = retryCount - 1

          return axiosOrInstance(err.config)
        }
        // remove the controller from map when rejected
        if (err.config.$$userConfig!.needCancel) {
          ctlManager.removeControllerBySignal(err.config.$$userConfig!.key as string, err.config.signal as AbortSignal)
        }
      }

      return Promise.reject(err)
    }
  )

  Object.defineProperty(axiosOrInstance, '$$ctlManager', {
    value: ctlManager
  })

  return axiosOrInstance
}
