import { describe, expect, it, vi } from 'vitest'
import axios, { AxiosError } from 'axios'
import axiosEnhancer from '../src/index'
import { URL } from './utils'

describe('retry request', () => {
  const enhancedAxiosIns = axiosEnhancer(
    axios.create({
      timeout: 1000
    }),
    { retry: true }
  )

  it('no retry', async () => {
    const callEnhancedAxios = vi.spyOn(axios, 'isAxiosError')
    const rPromise = enhancedAxiosIns.get(URL)

    await expect(rPromise).rejects.toThrowError()
    expect(callEnhancedAxios).toBeCalledTimes(1)

    const rPromise1 = enhancedAxiosIns.get(URL, {
      $$userConfig: {
        retryCount: 3
      }
    })
    await expect(rPromise1).rejects.toThrowError()
    expect(callEnhancedAxios).toBeCalledTimes(2)

    const rPromise2 = enhancedAxiosIns.get(URL, {
      $$userConfig: {
        retryCount: -2
      }
    })
    await expect(rPromise2).rejects.toThrowError()
    expect(callEnhancedAxios).toBeCalledTimes(3)
  })

  it('retry once', async () => {
    const callEnhancedAxios = vi.spyOn(axios, 'isAxiosError')
    const rPromise = enhancedAxiosIns.get(URL, {
      adapter: async config => {
        if (config.$$userConfig?.retryCount! > 0) {
          return Promise.reject(new AxiosError('', AxiosError.ETIMEDOUT, config))
        }

        return Promise.reject(new AxiosError('', '', config))
      },
      $$userConfig: {
        retryCount: 1
      }
    })

    await expect(rPromise).rejects.toThrowError()
    expect(callEnhancedAxios).toBeCalledTimes(2)
  })

  it('retry twice', async () => {
    const callEnhancedAxios = vi.spyOn(axios, 'isAxiosError')
    const rPromise = enhancedAxiosIns.get(URL, {
      adapter: async config => {
        if (config.$$userConfig?.retryCount! > 0) {
          return Promise.reject(new AxiosError('', AxiosError.ECONNABORTED, config))
        }

        return Promise.resolve({
          data: {},
          status: 200,
          statusText: 'ok',
          headers: {},
          config
        })
      },
      $$userConfig: {
        retryCount: 2
      }
    })

    const res = await rPromise

    expect(res.config.$$userConfig?.retryCount).toBe(0)
    expect(callEnhancedAxios).toBeCalledTimes(2)
  })

  it('retry three times', async () => {
    const callEnhancedAxios = vi.spyOn(axios, 'isAxiosError')
    const rPromise = enhancedAxiosIns.get(URL, {
      adapter: async config => {
        if (config.$$userConfig?.retryCount! > 0) {
          return Promise.reject(new AxiosError('', '', config))
        }

        return Promise.resolve({
          data: {},
          status: 200,
          statusText: 'ok',
          headers: {},
          config
        })
      },

      $$userConfig: {
        retryCount: 3,
        retryValidator: () => true
      }
    })

    const res = await rPromise

    expect(res.config.$$userConfig?.retryCount).toBe(0)
    expect(callEnhancedAxios).toBeCalledTimes(0)
  })
})
