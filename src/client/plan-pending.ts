/**
 * plan 审查 pending 的登记表与 composer 路由.
 *
 * plan 卡由原生 PlanReviewPanel 渲染, 插件不再接管 conversation.composer 的
 * plan 分支. 选择器让位之前把当前 plan-review 记在这里, 原生卡上的拒绝入口
 * 再按 requestKey 取回同一个 pending, 以 Keep planning + custom 交回答案.
 */

import {
  parsePlanReview,
  selectApproval,
  type PendingApprovalView,
  type PendingPlanReviewView,
} from './pending.ts'

const pendingByKey = new Map<string, PendingPlanReviewView>()
const keyBySession = new Map<string, string>()

/**
 * 记下一次待审计划, 同一 session 只保留最新的一条.
 * @param sessionId - 审查所属会话.
 * @param pending - 原生 plan-review pending.
 */
export function rememberPlanReview(sessionId: string, pending: PendingPlanReviewView): void {
  const previous = keyBySession.get(sessionId)
  if (previous !== undefined && previous !== pending.key) pendingByKey.delete(previous)
  pendingByKey.set(pending.key, pending)
  keyBySession.set(sessionId, pending.key)
}

/**
 * 忘掉一个 session 的待审计划.
 * @param sessionId - 审查所属会话.
 */
export function forgetPlanReview(sessionId: string): void {
  const key = keyBySession.get(sessionId)
  if (key === undefined) return
  pendingByKey.delete(key)
  keyBySession.delete(sessionId)
}

/**
 * 按渲染身份取回待审计划, 供原生卡上的拒绝入口提交答案.
 * @param requestKey - 原生审查卡的 requestKey, 即 pending.key.
 */
export function planReviewPending(requestKey: string): PendingPlanReviewView | undefined {
  return pendingByKey.get(requestKey)
}

/**
 * composer chain 的路由: 只接管原生审批, plan-review 记录后让位给原生卡.
 * @param value - conversation.composer 的 pendingInteraction.
 * @param sessionId - 当前 composer 所属会话.
 * @returns 需要本插件渲染的审批, 或 `null` 表示交给下游.
 */
export function routeComposerPending(
  value: unknown,
  sessionId: string | undefined,
): PendingApprovalView | null {
  const approval = selectApproval(value)
  if (approval !== null) {
    if (sessionId !== undefined) forgetPlanReview(sessionId)
    return approval
  }
  const review = parsePlanReview(value)
  if (review !== undefined && sessionId !== undefined) {
    rememberPlanReview(sessionId, review.pending)
    return null
  }
  if (sessionId !== undefined) forgetPlanReview(sessionId)
  return null
}
