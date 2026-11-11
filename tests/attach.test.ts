import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { ToolExecution, ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import { prependRejectContent, attachRejectMessage } from '../src/attach.ts'
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

/** 宿主拒绝升权的原文, 尾句由 dsh-sandbox 的 approveEscalation 固定. */
const HOST_REJECTION = 'the user rejected escalating this command to "danger-full-access"; '
  + 'it stays denied, so stop and explain instead of working around it'

/** 改写后的同一句: 前段与原档位不动, 尾句换成可重新发起的表述. */
const RETRYABLE_REJECTION = 'the user rejected escalating this command to "danger-full-access"; '
  + 'if this command is still necessary, re-request it with a clearer justification, '
  + 'though a repeat ask may be rejected again'

describe('prependRejectContent', () => {
  it('prepends to the first text block', () => {
    const next = prependRejectContent([{ type: 'text', text: 'denied' }], 'note')
    assert.deepEqual(next, [{ type: 'text', text: 'note\n\ndenied' }])
  })

  it('adds a text block when there is no text block to merge into', () => {
    const next = prependRejectContent([], 'note')
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

  it('prepends the description to an error result', () => {
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
    assert.equal(text.text.startsWith(formatRejectNote('bash', 'stay in workspace')), true)
    assert.equal(text.text.includes('the user rejected tool "bash"'), true)
    assert.equal(attached.additionalContexts?.length, 1)
  })

  it('rewrites the host final tail even without a description', () => {
    const store = new RejectMessageStore(1000)
    const attached = attachRejectMessage(
      store,
      exec({ sessionId: 's1', callId: 'c2' }),
      failure(`Error: ${HOST_REJECTION}`),
      { kind: 'accept' },
    )
    assert.deepEqual(attached, {
      kind: 'accept',
      content: [{ type: 'text', text: `Error: ${RETRYABLE_REJECTION}` }],
    })
  })

  it('prepends the description ahead of a rewritten tail', () => {
    const store = new RejectMessageStore(1000)
    store.put(store.key('s1', 'bash', 'c3'), '提权干什么')
    const attached = attachRejectMessage(
      store,
      exec({ sessionId: 's1', callId: 'c3' }),
      failure(`Error: ${HOST_REJECTION}`),
      { kind: 'accept' },
    )
    if (attached.kind !== 'accept' || !('content' in attached)) {
      throw new Error('expected content replacement')
    }
    const text = attached.content?.[0]
    if (text?.type !== 'text') throw new Error('expected text')
    assert.equal(text.text.startsWith(formatRejectNote('bash', '提权干什么')), true)
    assert.equal(text.text.includes(RETRYABLE_REJECTION), true)
    assert.equal(text.text.includes('it stays denied'), false)
    assert.equal(attached.additionalContexts?.length, 1)
  })

  it('keeps a non-matching failure untouched', () => {
    const store = new RejectMessageStore(1000)
    const downstream = { kind: 'accept' as const }
    const attached = attachRejectMessage(
      store,
      exec({ sessionId: 's1', callId: 'c4' }),
      failure('tool call aborted'),
      downstream,
    )
    assert.equal(attached, downstream)
  })
})
