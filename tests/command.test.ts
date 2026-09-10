import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { commandOf } from '../src/client/command.ts'

/** 造一个 chat 快照形状, 只保留 commandOf 关心的部分. */
function snapshot(nodes: unknown[]): unknown {
  return { nodes: { values: () => nodes } }
}

const toolCall = (callId: string, argsRaw: string) => ({
  kind: 'tool-call',
  data: { root: { callId, argsRaw } },
})

describe('commandOf', () => {
  it('reads the command of the correlated tool call', () => {
    assert.equal(
      commandOf(snapshot([toolCall('call-1', '{"command":"ls -la"}')]), 'call-1'),
      'ls -la',
    )
  })

  it('ignores other calls and non-tool nodes', () => {
    assert.equal(
      commandOf(snapshot([{ kind: 'message' }, toolCall('call-2', '{"command":"pwd"}')]), 'call-1'),
      undefined,
    )
  })

  it('skips a root that is itself a node', () => {
    assert.equal(
      commandOf(snapshot([{ kind: 'tool-call', data: { root: { callId: 'call-1', kind: 'x' } } }]), 'call-1'),
      undefined,
    )
  })

  it('survives malformed arguments and unknown snapshots', () => {
    assert.equal(commandOf(snapshot([toolCall('call-1', 'not json')]), 'call-1'), undefined)
    assert.equal(commandOf(null, 'call-1'), undefined)
    assert.equal(commandOf({ nodes: [] }, 'call-1'), undefined)
    assert.equal(commandOf({ nodes: new Map() }, 'call-1'), undefined)
  })
})
