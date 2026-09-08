/**
 * 一次审批拒绝描述的短暂暂存.
 *
 * Client 在点确认拒绝前通过 Remote 写入, Host 在 tools/post-execute 取出后
 * 附加到工具结果. 条目带 TTL, 避免审批取消后残留.
 */

export interface RejectRecord {
  /** 已经规范化的拒绝描述. */
  message: string
  /** 写入时刻. */
  storedAt: number
}

/** 按会话和工具调用索引拒绝描述. */
export class RejectMessageStore {
  private readonly records = new Map<string, RejectRecord>()
  private readonly ttlMs: number

  /**
   * @param ttlMs - 条目存活时间, 超时后 take 视为未命中.
   */
  constructor(ttlMs: number) {
    this.ttlMs = ttlMs
  }

  /**
   * 生成暂存键. 有 callId 时优先按调用对齐, 否则退回 session + toolName.
   * @param sessionId - 审批所属会话.
   * @param toolName - 被拒绝的工具名.
   * @param callId - 原生审批可选的工具调用 id.
   */
  key(sessionId: string, toolName: string, callId?: string): string {
    if (callId !== undefined && callId.length > 0) return `call:${sessionId}:${callId}`
    return `tool:${sessionId}:${toolName}`
  }

  /**
   * 写入或覆盖一条拒绝描述.
   * @param key - {@link key} 的返回值.
   * @param message - 已经规范化的描述.
   * @param now - 可注入的当前时间, 便于测试.
   */
  put(key: string, message: string, now = Date.now()): void {
    this.records.set(key, { message, storedAt: now })
  }

  /**
   * 取出并删除一条描述. 缺失或过期返回 `undefined`.
   * @param key - {@link key} 的返回值.
   * @param now - 可注入的当前时间, 便于测试.
   */
  take(key: string, now = Date.now()): string | undefined {
    const record = this.records.get(key)
    if (record === undefined) return undefined
    this.records.delete(key)
    if (now - record.storedAt > this.ttlMs) return undefined
    return record.message
  }

  /**
   * 按工具执行取出描述: 先试 callId 键, 再试 tool 键.
   * @param sessionId - 审批所属会话.
   * @param toolName - 被拒绝的工具名.
   * @param callId - 工具调用 id.
   * @param now - 可注入的当前时间, 便于测试.
   */
  takeFor(sessionId: string, toolName: string, callId?: string, now = Date.now()): string | undefined {
    if (callId !== undefined && callId.length > 0) {
      const byCall = this.take(this.key(sessionId, toolName, callId), now)
      if (byCall !== undefined) return byCall
    }
    return this.take(this.key(sessionId, toolName), now)
  }
}
