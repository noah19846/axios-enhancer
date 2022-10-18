import { describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import axiosEnhancer from '../src/index'

const url1 = 'http://httpbin.org/status/200'
const url2 = 'http://httpbin.org/status/404'
const url3 = 'http://httpbin.org/status/200/a'
const url4 = 'http://httpbin.org/delay/2'

const enhancedAxios = axiosEnhancer(axios)

describe('cancel request', () => {
  it.concurrent('enhance axios static', async () => {
    expect(enhancedAxios).toHaveProperty('$$ctlManager')

    const rPromise = enhancedAxios.get(url1, {
      $$userConfig: {
        needCancel: true
      }
    })

    await Promise.resolve()
    expect(enhancedAxios.$$ctlManager.getControllerMap().size).toBe(1)
    expect(enhancedAxios.$$ctlManager.getControllerByKey(url1)!.length).toBe(1)
    expect(enhancedAxios.$$ctlManager.getControllerByKey(url1)![0].signal.aborted).toBe(false)
    await expect(rPromise).resolves.toBeDefined()
    expect(enhancedAxios.$$ctlManager.getControllerMap().size).toBe(0)

    const rPromise2 = enhancedAxios.get(url2, {
      $$userConfig: {
        needCancel: true
      }
    })
    await Promise.resolve()
    expect(enhancedAxios.$$ctlManager.getControllerMap().size).toBe(1)
    expect(enhancedAxios.$$ctlManager.getControllerByKey(url2)!.length).toBe(1)
    expect(enhancedAxios.$$ctlManager.getControllerByKey(url2)![0].signal.aborted).toBe(false)
    await expect(rPromise2).rejects.toThrowError()
    expect(enhancedAxios.$$ctlManager.getControllerMap().size).toBe(0)

    const rPromise3 = enhancedAxios.get(url3, {
      $$userConfig: {
        needCancel: true
      }
    })

    const rPromise4 = enhancedAxios.get(url3, {
      $$userConfig: {
        needCancel: true
      }
    })

    await Promise.resolve()

    expect(enhancedAxios.$$ctlManager.getControllerMap().size).toBe(1)
    expect(enhancedAxios.$$ctlManager.getControllerByKey(url3)!.length).toBe(2)
    axios.$$ctlManager.abortAndRemove(url3)
    expect(enhancedAxios.$$ctlManager.getControllerMap().size).toBe(0)
    await expect(rPromise3).rejects.toThrowError()
    await expect(rPromise4).rejects.toThrowError()
  })

  it.concurrent('enhance axios instance', async () => {
    const enhancedAxiosIns = axiosEnhancer(axios.create())

    expect(enhancedAxiosIns).toHaveProperty('$$ctlManager')
  })
})

describe('retry request', () => {
  const enhancedAxiosIns = axiosEnhancer(
    axios.create({
      timeout: 1000
    })
  )

  it('no retry', async () => {
    const callEnhancedAxios = vi.spyOn(axios, 'isAxiosError')
    const rPromise = enhancedAxiosIns.get(url2)

    await expect(rPromise).rejects.toThrowError()
    expect(callEnhancedAxios).toBeCalledTimes(1)

    const rPromise1 = enhancedAxiosIns.get(url2, {
      $$userConfig: {
        retryCount: 3
      }
    })
    await expect(rPromise1).rejects.toThrowError()
    expect(callEnhancedAxios).toBeCalledTimes(2)

    const rPromise2 = enhancedAxiosIns.get(url2, {
      $$userConfig: {
        retryCount: -2
      }
    })
    await expect(rPromise2).rejects.toThrowError()
    expect(callEnhancedAxios).toBeCalledTimes(3)
  })

  it('retry 2 times', async () => {
    const callEnhancedAxios = vi.spyOn(axios, 'isAxiosError')
    const rPromise = enhancedAxiosIns.get(url4, {
      $$userConfig: {
        retryCount: 1
      }
    })

    await expect(rPromise).rejects.toThrowError()
    expect(callEnhancedAxios).toBeCalledTimes(2)
  })
})
