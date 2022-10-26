import type { AxiosStatic, AxiosInstance } from 'axios'
import type { CallbackConfig } from './types'

const dumbFunc = () => {}

export default function callbackEnhancer(axiosOrInstance: AxiosInstance | AxiosStatic) {
  const DEFAULT_CONFIG: CallbackConfig = {
    reject: true,
    onBefore: dumbFunc,
    successValidator: () => true,
    onSuccess: dumbFunc,
    getFulfillDataFromResponse: res => res,
    onFailed: dumbFunc,
    onError: dumbFunc,
    onFinally: dumbFunc
  }

  axiosOrInstance.interceptors.request.use(config => {
    config.$$userConfig = {
      ...DEFAULT_CONFIG,
      ...config.$$userConfig
    }
    config.$$userConfig.onBefore!()

    return config
  })

  axiosOrInstance.interceptors.response.use(
    response => {
      const fulfilledData = response.config.$$userConfig!.getFulfillDataFromResponse!(response)

      if (response.config.$$userConfig!.successValidator!(response)) {
        response.config.$$userConfig!.onSuccess!(response)
        response.config.$$userConfig!.onFinally!(response)

        return fulfilledData
      }

      response.config.$$userConfig!.onFailed!(response)
      response.config.$$userConfig!.onFinally!(response)

      if (response.config.$$userConfig!.reject) {
        return Promise.reject(fulfilledData)
      }

      return fulfilledData
    },

    error => {
      // doesn't work for those errors that don't have config values, such as `ERR_CANCELED`
      if (error?.config?.$$userConfig) {
        error.config.$$userConfig.onError(error)
        error.config.$$userConfig.onFinally(error)
      }

      return Promise.reject(error)
    }
  )

  return axiosOrInstance
}
