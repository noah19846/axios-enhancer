import { describe, expect, it, vi } from 'vitest'
import axios, { AxiosError } from 'axios'
import axiosEnhancer from '../src/index'

const url1 = 'http://httpbin.org/status/200'
const url2 = 'http://httpbin.org/status/404'
const url3 = 'http://httpbin.org/status/200/a'
const url4 = 'http://httpbin.org/delay/2'

// axios use setTimeout to run async task
const sleep = (s = 0) => new Promise(r => setTimeout(r, s * 1000))

const enhancedAxios = axiosEnhancer(axios, { cancel: true, retry: true })

describe('cancel request', () => {
  it.concurrent('enhance axios static', async () => {
    expect(enhancedAxios).toHaveProperty('$$ctlManager')

    const rPromise = enhancedAxios.get(url1, {
      adapter: async config => {
        await sleep()
        return Promise.resolve({
          data: {},
          status: 200,
          statusText: 'ok',
          headers: {},
          config
        })
      },
      $$userConfig: {
        needCancel: true
      }
    })

    await sleep()
    expect(enhancedAxios.$$ctlManager.getControllerMap().size).toBe(1)
    expect(enhancedAxios.$$ctlManager.getControllerByKey(url1)!.length).toBe(1)
    expect(enhancedAxios.$$ctlManager.getControllerByKey(url1)![0].signal.aborted).toBe(false)
    await expect(rPromise).resolves.toBeDefined()
    expect(enhancedAxios.$$ctlManager.getControllerMap().size).toBe(0)

    const rPromise2 = enhancedAxios.get(url2, {
      adapter: async config => {
        await sleep()
        return Promise.reject(new AxiosError('', '404', config))
      },
      $$userConfig: {
        needCancel: true
      }
    })

    await sleep()
    expect(enhancedAxios.$$ctlManager.getControllerMap().size).toBe(1)
    expect(enhancedAxios.$$ctlManager.getControllerByKey(url2)!.length).toBe(1)
    expect(enhancedAxios.$$ctlManager.getControllerByKey(url2)![0].signal.aborted).toBe(false)
    await expect(rPromise2).rejects.toThrowError()

    expect(enhancedAxios.$$ctlManager.getControllerMap().size).toBe(0)

    const rPromise3 = enhancedAxios.get(url3, {
      adapter: async config => {
        await sleep()
        return Promise.resolve({
          data: {},
          status: 200,
          statusText: 'ok',
          headers: {},
          config
        })
      },
      $$userConfig: {
        needCancel: true
      }
    })

    const rPromise4 = enhancedAxios.get(url3, {
      adapter: async config => {
        await sleep()
        return Promise.resolve({
          data: {},
          status: 200,
          statusText: 'ok',
          headers: {},
          config
        })
      },
      $$userConfig: {
        needCancel: true
      }
    })

    await sleep()

    expect(enhancedAxios.$$ctlManager.getControllerMap().size).toBe(1)
    expect(enhancedAxios.$$ctlManager.getControllerByKey(url3)!.length).toBe(2)
    axios.$$ctlManager.abortAndRemove(url3)
    expect(enhancedAxios.$$ctlManager.getControllerMap().size).toBe(0)
    await expect(rPromise3).rejects.toThrowError()
    await expect(rPromise4).rejects.toThrowError()
  })

  it.concurrent('enhance axios instance', async () => {
    const enhancedAxiosIns = axiosEnhancer(axios.create(), { cancel: true, retry: true })

    expect(enhancedAxiosIns).toHaveProperty('$$ctlManager')
  })
})

describe('retry request', () => {
  const enhancedAxiosIns = axiosEnhancer(
    axios.create({
      timeout: 1000
    }),
    { cancel: true, retry: true }
  )

  it('no retry', async () => {
    const callEnhancedAxios = vi.spyOn(axios, 'isAxiosError')
    const rPromise = enhancedAxiosIns.get(url2)

    await expect(rPromise).rejects.toThrowError()
    expect(callEnhancedAxios).toBeCalledTimes(2)

    const rPromise1 = enhancedAxiosIns.get(url2, {
      $$userConfig: {
        retryCount: 3
      }
    })
    await expect(rPromise1).rejects.toThrowError()
    expect(callEnhancedAxios).toBeCalledTimes(4)

    const rPromise2 = enhancedAxiosIns.get(url2, {
      $$userConfig: {
        retryCount: -2
      }
    })
    await expect(rPromise2).rejects.toThrowError()
    expect(callEnhancedAxios).toBeCalledTimes(6)
  })

  it('retry 2 times', async () => {
    const callEnhancedAxios = vi.spyOn(axios, 'isAxiosError')
    const rPromise = enhancedAxiosIns.get(url4, {
      adapter: async config => {
        await sleep(2)
        return Promise.reject(new AxiosError('', '', config))
      },
      $$userConfig: {
        retryCount: 1
      }
    })

    await expect(rPromise).rejects.toThrowError()
    expect(callEnhancedAxios).toBeCalledTimes(2)
  })
})
