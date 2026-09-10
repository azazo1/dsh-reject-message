import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  approvePlanAnswer,
  isPendingApproval,
  keepPlanningAnswer,
  parsePlanReview,
  selectComposerPending,
} from '../src/client/pending.ts'

const planQuestions = () => [{
  id: 'plan-review',
  detail: '# Ship\n\n- do the work\n',
  options: [
    { label: 'Approve', description: 'Leave plan mode.' },
    { label: 'Keep planning', description: 'Stay in plan mode.' },
  ],
  intent: { kind: 'plan-review', approve: 'Approve' },
}]

const planCarrier = (overrides: Record<string, unknown> = {}) => ({
  kind: 'plan-review',
  key: 'question:1',
  sessionId: 's1',
  questions: planQuestions(),
  answer: async () => {},
  cancel: async () => {},
  ...overrides,
})

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

describe('parsePlanReview', () => {
  it('accepts a native-shaped binary plan-review', () => {
    const parsed = parsePlanReview(planCarrier())
    assert.equal(parsed?.reviewId, 'plan-review')
    assert.equal(parsed?.plan.startsWith('# Ship'), true)
    assert.equal(parsed?.approveLabel, 'Approve')
    assert.equal(parsed?.declineLabel, 'Keep planning')
    assert.equal(parsed?.pending.key, 'question:1')
  })

  it('rejects a generic question', () => {
    assert.equal(parsePlanReview({ kind: 'question' }), undefined)
  })

  it('rejects a third option', () => {
    const [question] = planQuestions()
    assert.equal(parsePlanReview(planCarrier({
      questions: [{
        ...question,
        options: [
          ...question.options,
          { label: 'Start over' },
        ],
      }],
    })), undefined)
  })

  it('rejects multiSelect', () => {
    const [question] = planQuestions()
    assert.equal(parsePlanReview(planCarrier({
      questions: [{ ...question, multiSelect: true }],
    })), undefined)
  })

  it('rejects a review without plan detail', () => {
    const [question] = planQuestions()
    const { detail: _detail, ...rest } = question
    assert.equal(parsePlanReview(planCarrier({ questions: [rest] })), undefined)
  })

  it('rejects approve-only', () => {
    const [question] = planQuestions()
    assert.equal(parsePlanReview(planCarrier({
      questions: [{
        ...question,
        options: [{ label: 'Approve' }],
      }],
    })), undefined)
  })

  it('rejects a missing cancel', () => {
    const carrier = planCarrier()
    const { cancel: _cancel, ...rest } = carrier
    assert.equal(parsePlanReview(rest), undefined)
  })
})

describe('selectComposerPending', () => {
  it('returns the approval carrier', () => {
    const approval = {
      kind: 'approval' as const,
      key: 'approval:1',
      sessionId: 's1',
      toolName: 'bash',
      answer: async () => {},
    }
    assert.equal(selectComposerPending(approval), approval)
  })

  it('returns the same plan-review object', () => {
    const carrier = planCarrier()
    assert.equal(selectComposerPending(carrier), carrier)
  })

  it('returns null for other pending', () => {
    assert.equal(selectComposerPending({ kind: 'question' }), null)
    assert.equal(selectComposerPending(null), null)
  })
})

describe('plan review answers', () => {
  it('approves without custom', () => {
    assert.deepEqual(approvePlanAnswer('plan-review', 'Approve'), {
      answers: [{ id: 'plan-review', selected: ['Approve'] }],
    })
  })

  it('keeps planning without custom when the note is empty', () => {
    assert.deepEqual(keepPlanningAnswer('plan-review', 'Keep planning'), {
      answers: [{ id: 'plan-review', selected: ['Keep planning'] }],
    })
  })

  it('keeps planning with custom when a note is present', () => {
    assert.deepEqual(keepPlanningAnswer('plan-review', 'Keep planning', 'too broad'), {
      answers: [{ id: 'plan-review', selected: ['Keep planning'], custom: 'too broad' }],
    })
  })
})
