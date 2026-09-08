import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isPendingApproval } from '../src/client/pending.ts'

describe('isPendingApproval', () => {
  it('accepts a native-shaped approval carrier', () => {
    assert.equal(isPendingApproval({
      kind: 'approval',
      key: 'approval:1',
      sessionId: 's1',
      toolName: 'bash',
      answer: async () => {},
    }), true)
  })

  it('rejects other pending interactions', () => {
    assert.equal(isPendingApproval({ kind: 'question' }), false)
    assert.equal(isPendingApproval(null), false)
    assert.equal(isPendingApproval({
      kind: 'approval',
      key: 'approval:1',
      sessionId: 's1',
      toolName: 'bash',
    }), false)
  })
})
