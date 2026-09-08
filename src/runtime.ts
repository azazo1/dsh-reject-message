/**
 * Host Remote: 接收 Web 拒绝窗口提交的描述, 写入短暂暂存.
 */

import type { Context } from '@deepseek-ai/cordis'
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import {
  normalizeRejectMessage,
  PLUGIN_NAME,
  REMOTE_NAMESPACE,
  type RecordRejectArgs,
  type RecordRejectResult,
} from './shared.ts'
import type { RejectMessageStore } from './store.ts'

/** 拒绝描述 Remote 服务, 挂在 `ctx.rejectMessage`. */
export class RejectMessageRuntime extends TypertRemoteService {
  private readonly store: RejectMessageStore
  private readonly maxLength: number

  /**
   * @param ctx - 所属 Cordis 上下文.
   * @param store - 与 tools/post-execute 共用的暂存.
   * @param maxLength - 描述截断上限.
   */
  constructor(
    ctx: Context,
    store: RejectMessageStore,
    maxLength: number,
  ) {
    super(ctx, REMOTE_NAMESPACE)
    this.store = store
    this.maxLength = maxLength
  }

  /**
   * 记录一次拒绝描述. 空白描述不写入暂存.
   * @param args - 会话, 工具和描述.
   */
  async record(args: RecordRejectArgs): Promise<RecordRejectResult> {
    const message = normalizeRejectMessage(args.message, this.maxLength)
    if (message === undefined) {
      this.ctx.logger.info(
        '%s: skip blank reject description tool=%s',
        PLUGIN_NAME,
        args.toolName,
      )
      return { recorded: false }
    }
    const key = this.store.key(args.sessionId, args.toolName, args.callId)
    this.store.put(key, message)
    this.ctx.logger.info(
      '%s: stored reject description tool=%s chars=%d',
      PLUGIN_NAME,
      args.toolName,
      message.length,
    )
    return { recorded: true }
  }
}
