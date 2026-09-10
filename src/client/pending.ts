/**
 * 原生 pending 的结构视图.
 * 不依赖 ui-approval / ui-user-questions 的 class 身份, 避免跨包 instanceof 失效.
 */

/** 原生审批 composer 实际用到的字段. */
export interface PendingApprovalView {
  /** 会话 pending-interaction 的域标记. */
  readonly kind: 'approval'
  /** 渲染身份, 一次审批只挂一次. */
  readonly key: string
  /** 审批所属会话. */
  readonly sessionId: string
  /** 请求提权的工具. */
  readonly toolName: string
  /** 关联工具调用, 原生审批有时不带. */
  readonly callId?: string
  /** 原生审批展示的原因. */
  readonly reason?: string
  /** 把用户决定交回 Host waterfall. */
  answer(outcome: 'allowed-once' | 'rejected'): Promise<void>
}

/** plan-review 交回 Host 的单条答案. */
export interface PlanReviewAnswerItem {
  /** 审查问题 id, 原样回传. */
  id: string
  /** 选中的 option label. */
  selected: string[]
  /** Keep planning 的拒绝描述, 缺省表示留空. */
  custom?: string
}

/** plan-review 交回 Host 的整批答案. */
export interface PlanReviewAnswer {
  /** 只有一条审查题. */
  answers: PlanReviewAnswerItem[]
}

/** 原生 plan-review pending 的结构视图, 字段仍挂在原对象上. */
export interface PendingPlanReviewView {
  /** 会话 pending-interaction 的域标记. */
  readonly kind: 'plan-review'
  /** 渲染身份, 一次审查只挂一次. */
  readonly key: string
  /** 审查所属会话. */
  readonly sessionId: string
  /** 原生 questions 批次, 解析时再读. */
  readonly questions: readonly unknown[]
  /** 把用户决定交回 user-questions waterfall. */
  answer(answer: PlanReviewAnswer): Promise<void>
  /** 关掉审查卡, 让用户回普通输入框. */
  cancel(): Promise<void>
}

/** 从 plan-review pending 抽出的审查字段. */
export interface ParsedPlanReview {
  /** 原生 pending, 身份不变. */
  pending: PendingPlanReviewView
  /** 审查问题 id. */
  reviewId: string
  /** 待审计划正文. */
  plan: string
  /** 确认执行的 option label. */
  approveLabel: string
  /** Keep planning 的 option label. */
  declineLabel: string
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  return value as Record<string, unknown>
}

function optionLabel(value: unknown): string | undefined {
  const item = asRecord(value)
  if (item === undefined) return undefined
  return typeof item.label === 'string' && item.label.length > 0 ? item.label : undefined
}

/**
 * 判断当前 composer pending 是不是原生审批.
 * @param value - conversation.composer 的 pendingInteraction.
 */
export function isPendingApproval(value: unknown): value is PendingApprovalView {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return item.kind === 'approval'
    && typeof item.key === 'string'
    && typeof item.sessionId === 'string'
    && typeof item.toolName === 'string'
    && typeof item.answer === 'function'
}

/**
 * 从未知 pending 解析标准二选一的 plan-review.
 * 第三 option, multiSelect, 无 detail, 或只有 approve 时返回 undefined, 交给原生.
 * @param value - conversation.composer 的 pendingInteraction.
 */
export function parsePlanReview(value: unknown): ParsedPlanReview | undefined {
  const item = asRecord(value)
  if (item === undefined) return undefined
  if (item.kind !== 'plan-review') return undefined
  if (typeof item.key !== 'string' || typeof item.sessionId !== 'string') return undefined
  if (typeof item.answer !== 'function' || typeof item.cancel !== 'function') return undefined
  if (!Array.isArray(item.questions) || item.questions.length !== 1) return undefined

  const question = asRecord(item.questions[0])
  if (question === undefined) return undefined
  if (typeof question.id !== 'string' || question.id.length === 0) return undefined
  if (typeof question.detail !== 'string') return undefined
  if (question.multiSelect === true) return undefined

  const intent = asRecord(question.intent)
  if (intent === undefined || intent.kind !== 'plan-review') return undefined
  if (typeof intent.approve !== 'string' || intent.approve.length === 0) return undefined

  const options = Array.isArray(question.options) ? question.options : []
  if (options.length > 2) return undefined
  const labels = options.flatMap((option) => {
    const label = optionLabel(option)
    return label === undefined ? [] : [label]
  })
  const approveLabel = labels.find(label => label === intent.approve)
  const declineLabel = labels.find(label => label !== intent.approve)
  if (approveLabel === undefined || declineLabel === undefined) return undefined

  return {
    pending: item as unknown as PendingPlanReviewView,
    reviewId: question.id,
    plan: question.detail,
    approveLabel,
    declineLabel,
  }
}

/**
 * 判断当前 composer pending 是不是可接管的 plan-review.
 * @param value - conversation.composer 的 pendingInteraction.
 */
export function isPendingPlanReview(value: unknown): value is PendingPlanReviewView {
  return parsePlanReview(value) !== undefined
}

/**
 * composer 入口: 提权审批或标准 plan-review, 其余交给下游.
 * @param value - conversation.composer 的 pendingInteraction.
 */
export function selectComposerPending(
  value: unknown,
): PendingApprovalView | PendingPlanReviewView | null {
  if (isPendingApproval(value)) return value
  return parsePlanReview(value)?.pending ?? null
}

/**
 * 组装确认执行的答案, 不带 custom.
 * @param reviewId - 审查问题 id.
 * @param approveLabel - 确认执行的 option label.
 */
export function approvePlanAnswer(reviewId: string, approveLabel: string): PlanReviewAnswer {
  return { answers: [{ id: reviewId, selected: [approveLabel] }] }
}

/**
 * 组装 Keep planning 的答案. 有描述才带 custom.
 * @param reviewId - 审查问题 id.
 * @param declineLabel - Keep planning 的 option label.
 * @param custom - 已经规范化的拒绝描述.
 */
export function keepPlanningAnswer(
  reviewId: string,
  declineLabel: string,
  custom?: string,
): PlanReviewAnswer {
  return {
    answers: [{
      id: reviewId,
      selected: [declineLabel],
      ...(custom === undefined ? {} : { custom }),
    }],
  }
}
