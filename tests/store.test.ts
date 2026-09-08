import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { RejectMessageStore } from '../src/store.ts'

describe('RejectMessageStore', () => {
  it('stores and takes a call-scoped description once', () => {
    const store = new RejectMessageStore(1000)
    const key = store.key('s1', 'bash', 'c1')
    store.put(key, 'stay in workspace', 10)
    assert.equal(store.take(key, 20), 'stay in workspace')
    assert.equal(store.take(key, 30), undefined)
  })

  it('expires an overdue record', () => {
    const store = new RejectMessageStore(100)
    const key = store.key('s1', 'bash')
    store.put(key, 'too late', 0)
    assert.equal(store.take(key, 101), undefined)
  })

  it('prefers the call key then falls back to the tool key', () => {
    const store = new RejectMessageStore(1000)
    store.put(store.key('s1', 'bash'), 'tool-level', 0)
    assert.equal(store.takeFor('s1', 'bash', 'c1', 10), 'tool-level')
    assert.equal(store.takeFor('s1', 'bash', 'c1', 20), undefined)
  })
})
