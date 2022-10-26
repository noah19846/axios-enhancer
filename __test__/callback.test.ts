import { describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import axiosEnhancer from '../src/index'

const url1 = 'http://httpbin.org/ip'
const url2 = 'http://httpbin.org/status/404'
const url3 = 'http://httpbin.org/status/200'
const url4 = 'http://httpbin.org/delay/2'

describe('callback', () => {
  const cfg = {
    onBefore() {},
    onSuccess() {},
    onFailed() {},
    onError() {},
    onFinally() {}
  }
  const enhancedAxiosIns = axiosEnhancer(
    axios.create({
      timeout: 1000
    })
  )

  it('error, retry, success, failed', async () => {
    const callOnBefore = vi.spyOn(cfg, 'onBefore')
    const callOnSuccess = vi.spyOn(cfg, 'onSuccess')
    const callOnFailed = vi.spyOn(cfg, 'onFailed')
    const callOnError = vi.spyOn(cfg, 'onError')
    const callOnFinally = vi.spyOn(cfg, 'onFinally')
    const rPromise = enhancedAxiosIns.get(url2, {
      $$userConfig: cfg
    })

    await expect(rPromise).rejects.toThrowError()
    expect(callOnBefore).toBeCalledTimes(1)
    expect(callOnSuccess).toBeCalledTimes(0)
    expect(callOnFailed).toBeCalledTimes(0)
    expect(callOnError).toBeCalledTimes(1)
    expect(callOnFinally).toBeCalledTimes(1)

    const rPromise1 = enhancedAxiosIns.get(url4, {
      $$userConfig: {
        retryCount: 1,
        ...cfg
      }
    })
    await expect(rPromise1).rejects.toThrowError()
    expect(callOnBefore).toBeCalledTimes(3)
    expect(callOnSuccess).toBeCalledTimes(0)
    expect(callOnFailed).toBeCalledTimes(0)
    expect(callOnError).toBeCalledTimes(3)
    expect(callOnFinally).toBeCalledTimes(3)

    const rPromise2 = enhancedAxiosIns.get(url1, {
      $$userConfig: {
        ...cfg
      }
    })

    await expect(rPromise2).resolves.toBeDefined()
    expect(callOnBefore).toBeCalledTimes(4)
    expect(callOnSuccess).toBeCalledTimes(1)
    expect(callOnFailed).toBeCalledTimes(0)
    expect(callOnError).toBeCalledTimes(3)
    expect(callOnFinally).toBeCalledTimes(4)

    const rPromise3 = enhancedAxiosIns.get(url1, {
      $$userConfig: {
        ...cfg,
        successValidator: res => {
          return !!res?.data.origin
        }
      }
    })

    await expect(rPromise3).resolves.toBeDefined()
    expect(callOnBefore).toBeCalledTimes(5)
    expect(callOnSuccess).toBeCalledTimes(2)
    expect(callOnFailed).toBeCalledTimes(0)
    expect(callOnError).toBeCalledTimes(3)
    expect(callOnFinally).toBeCalledTimes(5)

    const rPromise4 = enhancedAxiosIns.get(url1, {
      $$userConfig: {
        ...cfg,
        successValidator: res => {
          return !res?.data.origin
        }
      }
    })

    await expect(rPromise4).rejects.toBeDefined()
    expect(callOnBefore).toBeCalledTimes(6)
    expect(callOnSuccess).toBeCalledTimes(2)
    expect(callOnFailed).toBeCalledTimes(1)
    expect(callOnError).toBeCalledTimes(3)
    expect(callOnFinally).toBeCalledTimes(6)

    const rPromise5 = enhancedAxiosIns.get(url3, {
      $$userConfig: {
        ...cfg,
        needCancel: true
      }
    })

    await Promise.resolve().then()
    enhancedAxiosIns.$$ctlManager.abortAndRemove(url3)
    await expect(rPromise5).rejects.toThrow()
    expect(callOnBefore).toBeCalledTimes(7)
    expect(callOnSuccess).toBeCalledTimes(2)
    expect(callOnFailed).toBeCalledTimes(1)
    expect(callOnError).toBeCalledTimes(3)
    expect(callOnFinally).toBeCalledTimes(6)

    const rPromise6 = enhancedAxiosIns.get(url1, {
      $$userConfig: {
        ...cfg,
        reject: false,
        successValidator: res => {
          return !res?.data.origin
        }
      }
    })

    await expect(rPromise6).resolves.toBeDefined()
    expect(callOnBefore).toBeCalledTimes(8)
    expect(callOnSuccess).toBeCalledTimes(2)
    expect(callOnFailed).toBeCalledTimes(2)
    expect(callOnError).toBeCalledTimes(3)
    expect(callOnFinally).toBeCalledTimes(7)
  })
})
