import { describe, expect, it } from 'vitest'
import axios from 'axios'
import axiosEnhancer from '../src/index'
import { sleep, URL } from './utils'

describe('`$$ctlManager` property', () => {
  it('axios enhanced with cancel should have `$$ctlManager`', () => {
    const enhancedAxios = axiosEnhancer(axios, { cancel: true })

    expect(enhancedAxios).toHaveProperty('$$ctlManager')
  })

  it('axios instance enhanced with cancel should have `$$ctlManager`', () => {
    const enhancedAxiosInstance = axiosEnhancer(axios.create(), { cancel: true })

    expect(enhancedAxiosInstance).toHaveProperty('$$ctlManager')
  })
})

describe('cancel the request', () => {
  it('a cancellable request shout have a signal in map', async () => {
    const enhancedAxios = axiosEnhancer(axios.create(), { cancel: true })
    const promise1 = enhancedAxios(URL, {
      $$userConfig: {
        needCancel: true
      }
    })

    await sleep()
    expect(enhancedAxios.$$ctlManager.getControllerMap().has(URL)).toBe(true)
    expect(enhancedAxios.$$ctlManager.getControllerMap().get(URL)!.length).toBe(1)
    expect(enhancedAxios.$$ctlManager.getControllerMap().size).toBe(1)
    enhancedAxios.$$ctlManager.abortAndRemove(URL)
    expect(enhancedAxios.$$ctlManager.getControllerMap().has(URL)).toBe(false)
    expect(enhancedAxios.$$ctlManager.getControllerMap().size).toBe(0)
    await expect(promise1).rejects.toThrowError()
  })
})

describe('the resolved request will remove the signal', () => {
  it('a cancellable request shout have a signal in map', async () => {
    const enhancedAxios = axiosEnhancer(axios.create(), { cancel: true })
    const promise1 = enhancedAxios(URL, {
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
    expect(enhancedAxios.$$ctlManager.getControllerMap().has(URL)).toBe(true)
    expect(enhancedAxios.$$ctlManager.getControllerMap().get(URL)!.length).toBe(1)
    expect(enhancedAxios.$$ctlManager.getControllerMap().size).toBe(1)
    await expect(promise1).resolves.toBeDefined()
    expect(enhancedAxios.$$ctlManager.getControllerMap().has(URL)).toBe(false)
    expect(enhancedAxios.$$ctlManager.getControllerMap().size).toBe(0)
  })
})

describe('the rejected request will remove the signal', () => {
  it('a cancellable request shout have a signal in map', async () => {
    const enhancedAxios = axiosEnhancer(axios.create(), { cancel: true })
    const promise1 = enhancedAxios(URL, {
      $$userConfig: {
        needCancel: true
      }
    })

    await sleep()
    expect(enhancedAxios.$$ctlManager.getControllerMap().has(URL)).toBe(true)
    expect(enhancedAxios.$$ctlManager.getControllerMap().get(URL)!.length).toBe(1)
    expect(enhancedAxios.$$ctlManager.getControllerMap().size).toBe(1)
    await expect(promise1).rejects.toThrowError()
    expect(enhancedAxios.$$ctlManager.getControllerMap().has(URL)).toBe(false)
    expect(enhancedAxios.$$ctlManager.getControllerMap().size).toBe(0)
  })
})
