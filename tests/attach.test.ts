import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { ToolExecution, ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import { appendRejectContent, attachRejectMessage } from '../src/attach.ts'
import { formatRejectNote } from '../src/shared.ts'
import { RejectMessageStore } from '../src/store.ts'

function exec(partial: { sessionId?: string, name?: string, callId?: string }): ToolExecution {
  return {
    name: partial.name ?? 'bash',
    callId: (partial.callId ?? 'c1') as ToolExecution['callId'],
    agent: partial.sessionId === undefined
      ? undefined
      : { session: { id: partial.sessionId } },
  } as unknown as ToolExecution
}

function failure(text: string): ToolExecutionResult {
  return {
    isError: true,
    error: { message: text },
    content: [{ type: 'text', text }],
  } as ToolExecutionResult
}

describe('appendRejectContent', () => {
  it('appends to the last text block', () => {
    const next = appendRejectContent([{ type: 'text', text: 'denied' }], 'note')
    assert.deepEqual(next, [{ type: 'text', text: 'denied\n\nnote' }])
  })

  it('adds a text block when the last block is not text', () => {
    const next = appendRejectContent([], 'note')
    assert.deepEqual(next, [{ type: 'text', text: 'note' }])
  })
})

describe('attachRejectMessage', () => {
  it('returns the downstream decision when nothing is stored', () => {
    const store = new RejectMessageStore(1000)
    const downstream = { kind: 'accept' as const }
    const attached = attachRejectMessage(store, exec({ sessionId: 's1' }), failure('denied'), downstream)
    assert.equal(attached, downstream)
  })

  it('appends the description to an error result', () => {
    const store = new RejectMessageStore(1000)
    store.put(store.key('s1', 'bash', 'c1'), 'stay in workspace')
    const attached = attachRejectMessage(
      store,
      exec({ sessionId: 's1', callId: 'c1' }),
      failure('the user rejected tool "bash"'),
      { kind: 'accept' },
    )
    assert.equal(attached.kind, 'accept')
    if (attached.kind !== 'accept' || !('content' in attached)) {
      throw new Error('expected content replacement')
    }
    const text = attached.content?.[0]
    assert.equal(text?.type, 'text')
    if (text?.type !== 'text') throw new Error('expected text')
    assert.equal(text.text.includes('the user rejected tool "bash"'), true)
    assert.equal(text.text.includes(formatRejectNote('bash', 'stay in workspace')), true)
    assert.equal(attached.additionalContexts?.length, 1)
  })
})
