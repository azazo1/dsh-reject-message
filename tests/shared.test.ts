import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  clampMaxLength,
  DEFAULT_MAX_LENGTH,
  formatRejectNote,
  MAX_MAX_LENGTH,
  MIN_MAX_LENGTH,
  normalizeRejectMessage,
  parseRecordRejectArgs,
  parseRecordRejectResult,
} from '../src/shared.ts'

describe('clampMaxLength', () => {
  it('keeps a value inside the window', () => {
    assert.equal(clampMaxLength(200), 200)
  })

  it('clamps to the legal range', () => {
    assert.equal(clampMaxLength(1), MIN_MAX_LENGTH)
    assert.equal(clampMaxLength(MAX_MAX_LENGTH + 8), MAX_MAX_LENGTH)
  })

  it('falls back when the value is not a finite number', () => {
    assert.equal(clampMaxLength('nope'), DEFAULT_MAX_LENGTH)
    assert.equal(clampMaxLength(Number.NaN), DEFAULT_MAX_LENGTH)
  })
})

describe('normalizeRejectMessage', () => {
  it('returns undefined for blank input', () => {
    assert.equal(normalizeRejectMessage('   '), undefined)
    assert.equal(normalizeRejectMessage(1), undefined)
  })

  it('trims and truncates', () => {
    assert.equal(normalizeRejectMessage('  stay in workspace  '), 'stay in workspace')
    assert.equal(normalizeRejectMessage('abcdef', 4), 'abcd')
  })
})

describe('formatRejectNote', () => {
  it('keeps the tool name and user description', () => {
    const note = formatRejectNote('bash', 'do not touch /etc')
    assert.equal(note.includes('bash'), true)
    assert.equal(note.includes('do not touch /etc'), true)
  })
})

describe('record codecs', () => {
  it('accepts a complete record payload', () => {
    assert.deepEqual(parseRecordRejectArgs({
      sessionId: 's1',
      toolName: 'bash',
      callId: 'c1',
      message: 'no',
    }), {
      sessionId: 's1',
      toolName: 'bash',
      callId: 'c1',
      message: 'no',
    })
  })

  it('rejects a blank sessionId', () => {
    assert.throws(() => parseRecordRejectArgs({
      sessionId: '',
      toolName: 'bash',
      message: 'no',
    }))
  })

  it('reads a recorded flag', () => {
    assert.deepEqual(parseRecordRejectResult({ recorded: true }), { recorded: true })
  })
})
