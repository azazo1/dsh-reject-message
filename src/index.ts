/**
 * dsh-reject-message Host 半区.
 *
 * 提供 Remote 接收拒绝描述, 并在 tools/post-execute 把它附加到模型可见的
 * 工具结果. 审批 UI 本身由 Client 接管原生提权窗口.
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type { PostToolDecision, ToolExecution, ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-typert-registry'
import { attachRejectMessage } from './attach.ts'
import { RejectMessageRuntime } from './runtime.ts'
import {
  clampMaxLength,
  DEFAULT_MAX_LENGTH,
  MAX_MAX_LENGTH,
  MIN_MAX_LENGTH,
  PLUGIN_NAME,
  REJECT_MANIFEST,
  REJECT_TTL_MS,
} from './shared.ts'
import { RejectMessageStore } from './store.ts'

export const name = PLUGIN_NAME

export const inject = ['typert']

/** 插件配置: 拒绝描述截断上限. */
export interface Config {
  /** 拒绝描述最大字符数. */
  maxLength?: number
}

/** Loader 校验用 schema. */
export const Config: z<Config> = z.object({
  maxLength: z.number().step(1).min(MIN_MAX_LENGTH).max(MAX_MAX_LENGTH).default(DEFAULT_MAX_LENGTH),
})

/**
 * 挂上 Remote 和 post-execute 附加.
 * @param ctx - Host 插件上下文.
 * @param config - Loader 校验后的行配置.
 */
export function apply(ctx: Context, config?: Config): void {
  const resolved = Config(config)
  const maxLength = clampMaxLength(resolved.maxLength)
  const store = new RejectMessageStore(REJECT_TTL_MS)
  new RejectMessageRuntime(ctx, store, maxLength)
  ctx.logger.info('%s: host loaded, maxLength=%d', PLUGIN_NAME, maxLength)

  ctx.effect(() => {
    const dispose = ctx.typert.register(REJECT_MANIFEST)
    return () => { void dispose() }
  }, `${PLUGIN_NAME}: typert manifest`)

  ctx.on('tools/post-execute', async (
    exec: ToolExecution,
    result: ToolExecutionResult,
    next: () => Promise<PostToolDecision>,
  ): Promise<PostToolDecision> => {
    const downstream = await next()
    const attached = attachRejectMessage(store, exec, result, downstream)
    if (attached !== downstream) {
      ctx.logger.info(
        '%s: attached reject description to tool=%s',
        PLUGIN_NAME,
        exec.name,
      )
    }
    return attached
  })
}
