import type { AxiosStatic, AxiosInstance } from 'axios'
import type { UserConfig } from './types'

import retryEnhancer from './retry'
import cancelEnhancer from './cancel'

type EnhancerConfig = {
  retry?: boolean
  cancel?: boolean
}
type AxiosEnhancer = (
  // eslint-disable-next-line no-unused-vars
  axiosOrInstance: AxiosInstance | AxiosStatic,
  // eslint-disable-next-line no-unused-vars
  enhancerConfig?: EnhancerConfig
) => AxiosInstance | AxiosStatic

const axiosEnhancer: AxiosEnhancer = (
  axiosOrInstance: AxiosInstance | AxiosStatic,
  enhancerConfig?: EnhancerConfig
) => {
  const DEFAULT_CONFIG: UserConfig = {}

  // add $$userConfig property to config
  axiosOrInstance.interceptors.request.use(config => {
    if (!config.$$userConfig) {
      config.$$userConfig = DEFAULT_CONFIG
    }

    return config
  })

  if (!enhancerConfig) {
    return cancelEnhancer(retryEnhancer(axiosOrInstance))
  }

  if (enhancerConfig.retry) {
    retryEnhancer(axiosOrInstance)
  }

  if (enhancerConfig.cancel) {
    cancelEnhancer(axiosOrInstance)
  }

  return axiosOrInstance
}

export default axiosEnhancer
export { retryEnhancer, cancelEnhancer }
