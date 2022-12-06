import type { CallbackConfig } from '../src/types'

import { describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import axiosEnhancer from '../src/index'
import { URL, sleep } from './utils'

type D = {
  origin: string
}

const cfg = {
  onBefore() {},
  onSuccess() {},
  onFailed() {},
  onError() {},
  onFinally() {}
}

describe('callback', () => {
  it('error', async () => {
    const enhancedAxiosIns = axiosEnhancer(axios.create())
    const callOnBefore = vi.spyOn(cfg, 'onBefore')
    const callOnSuccess = vi.spyOn(cfg, 'onSuccess')
    const callOnFailed = vi.spyOn(cfg, 'onFailed')
    const callOnError = vi.spyOn(cfg, 'onError')
    const callOnFinally = vi.spyOn(cfg, 'onFinally')
    const rPromise = enhancedAxiosIns.get(URL, {
      $$userConfig: { ...cfg }
    })

    await expect(rPromise).rejects.toThrowError()
    expect(callOnBefore).toBeCalledTimes(1)
    expect(callOnSuccess).toBeCalledTimes(0)
    expect(callOnFailed).toBeCalledTimes(0)
    expect(callOnError).toBeCalledTimes(1)
    expect(callOnFinally).toBeCalledTimes(1)
  })

  it('success', async () => {
    const enhancedAxiosIns = axiosEnhancer(axios.create())
    const callOnBefore = vi.spyOn(cfg, 'onBefore')
    const callOnSuccess = vi.spyOn(cfg, 'onSuccess')
    const callOnFailed = vi.spyOn(cfg, 'onFailed')
    const callOnError = vi.spyOn(cfg, 'onError')
    const callOnFinally = vi.spyOn(cfg, 'onFinally')

    const rPromise = enhancedAxiosIns.get(URL, {
      adapter: async config => {
        return Promise.resolve({
          data: {},
          status: 200,
          statusText: 'ok',
          headers: {},
          config
        })
      },
      $$userConfig: {
        ...cfg
      }
    })

    await expect(rPromise).resolves.toBeDefined()
    expect(callOnBefore).toBeCalledTimes(1)
    expect(callOnSuccess).toBeCalledTimes(1)
    expect(callOnFailed).toBeCalledTimes(0)
    expect(callOnError).toBeCalledTimes(0)
    expect(callOnFinally).toBeCalledTimes(1)
  })

  it('success by res, getFulfillDataFromResponse', async () => {
    const enhancedAxiosIns = axiosEnhancer(axios.create())
    const callOnBefore = vi.spyOn(cfg, 'onBefore')
    const callOnSuccess = vi.spyOn(cfg, 'onSuccess')
    const callOnFailed = vi.spyOn(cfg, 'onFailed')
    const callOnError = vi.spyOn(cfg, 'onError')
    const callOnFinally = vi.spyOn(cfg, 'onFinally')

    const eC: CallbackConfig<D> = {
      successValidator: res => {
        return !!res.data.origin
      },
      getFulfillDataFromResponse(res) {
        return res.data
      }
    }

    const rPromise = enhancedAxiosIns.get(URL, {
      adapter: async config => {
        return Promise.resolve({
          data: {
            origin: 'hi'
          },
          status: 200,
          statusText: 'ok',
          headers: {},
          config
        })
      },
      $$userConfig: {
        ...cfg,
        ...eC
      }
    })

    await expect(rPromise).resolves.toHaveProperty('origin')
    expect(callOnBefore).toBeCalledTimes(1)
    expect(callOnSuccess).toBeCalledTimes(1)
    expect(callOnFailed).toBeCalledTimes(0)
    expect(callOnError).toBeCalledTimes(0)
    expect(callOnFinally).toBeCalledTimes(1)
  })

  it('failed with res', async () => {
    const enhancedAxiosIns = axiosEnhancer(axios.create())
    const callOnBefore = vi.spyOn(cfg, 'onBefore')
    const callOnSuccess = vi.spyOn(cfg, 'onSuccess')
    const callOnFailed = vi.spyOn(cfg, 'onFailed')
    const callOnError = vi.spyOn(cfg, 'onError')
    const callOnFinally = vi.spyOn(cfg, 'onFinally')

    const eC: CallbackConfig<D> = {
      reject: false,
      successValidator: res => {
        return !res.data.origin
      },
      getFulfillDataFromResponse(res) {
        return res.data.origin
      }
    }

    const rPromise = enhancedAxiosIns.get(URL, {
      adapter: async config => {
        return Promise.resolve({
          data: {
            origin: 'hi'
          },
          status: 200,
          statusText: 'ok',
          headers: {},
          config
        })
      },
      $$userConfig: {
        ...cfg,
        ...eC
      }
    })

    const data = await rPromise

    expect(data).toBe('hi')
    expect(callOnBefore).toBeCalledTimes(1)
    expect(callOnSuccess).toBeCalledTimes(0)
    expect(callOnFailed).toBeCalledTimes(1)
    expect(callOnError).toBeCalledTimes(0)
    expect(callOnFinally).toBeCalledTimes(1)
  })

  it('error with res', async () => {
    const enhancedAxiosIns = axiosEnhancer(axios.create())
    const callOnBefore = vi.spyOn(cfg, 'onBefore')
    const callOnSuccess = vi.spyOn(cfg, 'onSuccess')
    const callOnFailed = vi.spyOn(cfg, 'onFailed')
    const callOnError = vi.spyOn(cfg, 'onError')
    const callOnFinally = vi.spyOn(cfg, 'onFinally')

    const eC: CallbackConfig<D> = {
      successValidator: res => {
        return !res.data.origin
      }
    }

    const rPromise = enhancedAxiosIns.get(URL, {
      adapter: async config => {
        return Promise.resolve({
          data: {
            origin: 'hi'
          },
          status: 200,
          statusText: 'ok',
          headers: {},
          config
        })
      },
      $$userConfig: {
        ...cfg,
        ...eC
      }
    })

    await expect(rPromise).rejects.toBeDefined()
    expect(callOnBefore).toBeCalledTimes(1)
    expect(callOnSuccess).toBeCalledTimes(0)
    expect(callOnFailed).toBeCalledTimes(1)
    expect(callOnError).toBeCalledTimes(0)
    expect(callOnFinally).toBeCalledTimes(1)
  })

  it('error with cancel', async () => {
    const enhancedAxiosIns = axiosEnhancer(axios.create())
    const callOnBefore = vi.spyOn(cfg, 'onBefore')
    const callOnSuccess = vi.spyOn(cfg, 'onSuccess')
    const callOnFailed = vi.spyOn(cfg, 'onFailed')
    const callOnError = vi.spyOn(cfg, 'onError')
    const callOnFinally = vi.spyOn(cfg, 'onFinally')

    const rPromise = enhancedAxiosIns.get(URL, {
      adapter: async config => {
        await sleep()

        return Promise.resolve({
          data: {
            origin: 'hi'
          },
          status: 200,
          statusText: 'ok',
          headers: {},
          config
        })
      },
      $$userConfig: {
        ...cfg,
        needCancel: true
      }
    })

    await sleep()
    enhancedAxiosIns.$$ctlManager.abortAndRemove(URL)
    await expect(rPromise).rejects.toThrow()
    expect(callOnBefore).toBeCalledTimes(1)
    expect(callOnSuccess).toBeCalledTimes(0)
    expect(callOnFailed).toBeCalledTimes(0)
    expect(callOnError).toBeCalledTimes(1)
    expect(callOnFinally).toBeCalledTimes(1)
  })
})
