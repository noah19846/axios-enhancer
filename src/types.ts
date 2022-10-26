import type { AxiosRequestConfig, AxiosResponse } from 'axios'

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
  retryValidator?: (error?: any) => Boolean
}
export type CancelConfig = {
  key?: string
  needCancel: boolean
}
export type CallbackConfig = {
  reject?: boolean
  onBefore?(config?: AxiosRequestConfig): void
  successValidator?(res?: AxiosResponse): boolean
  onSuccess?(res?: AxiosResponse): void
  getFulfillDataFromResponse?<D = unknown>(res?: AxiosResponse<D>): unknown
  onFailed?(res: AxiosResponse): void
  onError?(error: unknown): void
  onFinally?(data?: unknown): void
}

type Optional<T> = {
  [P in keyof T]+?: T[P]
}

export type UserConfig<D = { [index: string]: unknown }> = D &
  Optional<RetryConfig> &
  Optional<CancelConfig> &
  Optional<CallbackConfig>
