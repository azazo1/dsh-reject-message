import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  forgetPlanReview,
  planReviewPending,
  rememberPlanReview,
  routeComposerPending,
} from '../src/client/plan-pending.ts'

const planCarrier = (sessionId: string, key: string) => ({
  kind: 'plan-review' as const,
  key,
  sessionId,
  questions: [{
    id: 'plan-review',
    detail: '# Ship\n',
    options: [{ label: 'Approve' }, { label: 'Keep planning' }],
    intent: { kind: 'plan-review', approve: 'Approve' },
  }],
  answer: async () => {},
  cancel: async () => {},
})

const approvalCarrier = (sessionId: string, key: string) => ({
  kind: 'approval' as const,
  key,
  sessionId,
  toolName: 'bash',
  answer: async () => {},
})

describe('routeComposerPending', () => {
  it('takes the approval and leaves no plan record', () => {
    const approval = approvalCarrier('route-a', 'approval:route-a')
    assert.equal(routeComposerPending(approval, 'route-a'), approval)
    assert.equal(planReviewPending('question:route-a'), undefined)
  })

  it('lets the native card render a plan-review and records its pending', () => {
    const carrier = planCarrier('route-b', 'question:route-b')
    assert.equal(routeComposerPending(carrier, 'route-b'), null)
    assert.equal(planReviewPending('question:route-b'), carrier)
  })

  it('returns null for other pending and drops a stale plan record', () => {
    const carrier = planCarrier('route-c', 'question:route-c')
    routeComposerPending(carrier, 'route-c')
    assert.equal(routeComposerPending({ kind: 'question' }, 'route-c'), null)
    assert.equal(planReviewPending('question:route-c'), undefined)
  })

  it('ignores a missing session id', () => {
    const carrier = planCarrier('route-d', 'question:route-d')
    assert.equal(routeComposerPending(carrier, undefined), null)
    assert.equal(planReviewPending('question:route-d'), undefined)
  })
})

describe('plan review registry', () => {
  it('keeps one pending per session and drops the replaced key', () => {
    const first = planCarrier('reg-a', 'question:reg-a1')
    const second = planCarrier('reg-a', 'question:reg-a2')
    rememberPlanReview('reg-a', first)
    rememberPlanReview('reg-a', second)
    assert.equal(planReviewPending('question:reg-a1'), undefined)
    assert.equal(planReviewPending('question:reg-a2'), second)
  })

  it('keeps sessions apart', () => {
    const one = planCarrier('reg-b1', 'question:reg-b1')
    const two = planCarrier('reg-b2', 'question:reg-b2')
    rememberPlanReview('reg-b1', one)
    rememberPlanReview('reg-b2', two)
    assert.equal(planReviewPending('question:reg-b1'), one)
    assert.equal(planReviewPending('question:reg-b2'), two)
  })

  it('forgets on demand', () => {
    const carrier = planCarrier('reg-c', 'question:reg-c')
    rememberPlanReview('reg-c', carrier)
    forgetPlanReview('reg-c')
    assert.equal(planReviewPending('question:reg-c'), undefined)
    forgetPlanReview('reg-c')
  })
})
