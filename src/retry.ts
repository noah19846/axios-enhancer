import type { AxiosStatic, AxiosInstance } from 'axios'
import type { RetryConfig } from './types'

import axios from 'axios'

const isTimeoutErrorInAxios = (error?: any) =>
  axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')

export default function retryEnhancer(axiosOrInstance: AxiosInstance | AxiosStatic) {
  const DEFAULT_CONFIG: RetryConfig = {
    retryCount: 0,
    retryValidator: isTimeoutErrorInAxios
  }

  axiosOrInstance.interceptors.request.use(config => {
    config.$$userConfig = {
      ...DEFAULT_CONFIG,
      ...config.$$userConfig
    }

    return config
  })

  axiosOrInstance.interceptors.response.use(
    response => response,
    error => {
      if (error?.config?.$$userConfig?.retryValidator(error)) {
        const retryCount = parseInt(error.config.$$userConfig.retryCount)

        if (retryCount > 0) {
          error.config.$$userConfig.retryCount = retryCount - 1

          return axiosOrInstance(error.config)
        }
      }

      return Promise.reject(error)
    }
  )

  return axiosOrInstance
}
