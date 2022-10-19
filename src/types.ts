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

export type RetryConfig = {
  retryCount: number
  // eslint-disable-next-line no-unused-vars
  retryValidator?: (error?: any) => Boolean
}
export type CancelConfig = {
  key?: string
  needCancel: boolean
}

type Optional<T> = {
  [P in keyof T]+?: T[P]
}

export type UserConfig = {
  [index: string]: unknown
} & Optional<RetryConfig> &
  Optional<CancelConfig>
