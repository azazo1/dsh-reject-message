/**
 * 原生 PendingApproval 的结构视图.
 * 不依赖 `@deepseek-ai/dsh-client-ui-approval` 的 class 身份, 避免跨包 instanceof 失效.
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
