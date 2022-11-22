import { describe, expect, it, vi } from 'vitest'
import axios, { AxiosError } from 'axios'
import axiosEnhancer from '../src/index'
import { sleep, URL } from './utils'

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
        await sleep(2)
        return Promise.reject(new AxiosError('', '', config))
      },
      $$userConfig: {
        retryCount: 1
      }
    })

    await expect(rPromise).rejects.toThrowError()
    expect(callEnhancedAxios).toBeCalledTimes(1)
  })
})
