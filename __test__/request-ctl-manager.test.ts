import { expect, it } from 'vitest'

import RCM from '../src/request-ctl-manager'

it('controller manager', () => {
  const rcm = new RCM()
  const ac1 = new AbortController()

  expect(rcm.getControllerMap().size).toBe(0)
  expect(rcm.getControllerByKey('key1')?.length).toBeUndefined()

  rcm.addController('key1', ac1)
  expect(rcm.getControllerMap().size).toBe(1)
  expect(rcm.getControllerByKey('key1')?.length).toBe(1)
  expect(rcm.getControllerByKey('key1')?.[0]).toBe(ac1)
  rcm.addController('key1', ac1)
  expect(rcm.getControllerByKey('key1')?.length).toBe(1)

  const ac2 = new AbortController()

  rcm.addController('key1', ac2)
  expect(rcm.getControllerByKey('key1')?.length).toBe(2)
  expect(rcm.getControllerByKey('key1')?.[1]).toBe(ac2)
  expect(rcm.getControllerMap().size).toBe(1)

  const ac3 = new AbortController()

  rcm.addController('key2', ac3)
  expect(rcm.getControllerMap().size).toBe(2)
  rcm.removeControllerBySignal('key1', ac1.signal)
  expect(ac1.signal.aborted).toBe(false)
  expect(rcm.getControllerByKey('key1')?.length).toBe(1)
  expect(rcm.getControllerByKey('key1')?.[0]).toBe(ac2)
  rcm.removeControllerBySignal('key1', ac2.signal)
  expect(rcm.getControllerByKey('key1')).toBeUndefined()
  expect(rcm.getControllerMap().size).toBe(1)

  const ac4 = new AbortController()

  rcm.addController('key2', ac4)
  rcm.abortAndRemove('key2')
  expect(ac3.signal.aborted).toBe(true)
  expect(ac4.signal.aborted).toBe(true)
  expect(rcm.getControllerByKey('key2')).toBeUndefined()
  expect(rcm.getControllerMap().size).toBe(0)
})
