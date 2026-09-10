/**
 * dsh-reject-message 浏览器半区.
 *
 * 以低于原生 ui-approval / ui-user-questions 的 composer 优先级接管
 * PendingApproval 和 plan-review; 提权拒绝经 Remote 交给 Host, plan 拒绝
 * 走 questions 的 custom.
 */

import {
  PLUGIN_NAME,
  REJECT_REMOTE_CONTRIBUTION,
  REMOTE_NAMESPACE,
} from '../shared.ts'
import type { ClientContext, RejectMessageRemoteFace } from './context.ts'
import { ComposerPanel } from './ComposerPanel.tsx'
import { en, zh } from './locales.ts'
import { selectComposerPending } from './pending.ts'
import { setRecordReject } from './RejectPanel.tsx'
import { injectStyles } from './styles.ts'

const NS = PLUGIN_NAME

export const inject = ['slots', 'locale', 'remote']

function unwrapRecorded(result: Awaited<ReturnType<RejectMessageRemoteFace['record']>>): void {
  if (result.ok === true) return
  throw new Error(result.error.message)
}

/**
 * 注入样式, 注册拒绝窗口文案, 接管审批和 plan-review composer, 并挂上 Remote.
 * @param ctx - Web Client 插件上下文.
 */
export function apply(ctx: ClientContext): void {
  ctx.logger.info('%s: client applying', PLUGIN_NAME)
  injectStyles()
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), `${PLUGIN_NAME}: dictionaries`)

  ctx.slots.inject('conversation.composer', () => ctx.slots.register({
    name: 'conversation.composer',
    priority: -1,
    select: ({ pendingInteraction }: { pendingInteraction?: unknown }) => (
      selectComposerPending(pendingInteraction)
    ),
    locale: NS,
    // 不声明 conversation.approval.detail: 0.1.5 起一个 slot 只允许一个
    // entry 声明, 原生 ui-approval 已经声明了它. 重复声明会让后注册的一方
    // 抛错; 在全局 / main 配置下会拖垮整个 client boot.
  }, ComposerPanel))

  ctx.effect(async () => {
    const dispose = await ctx.remote.$mount(REJECT_REMOTE_CONTRIBUTION)
    const face = ctx.reflect.get(`remote.${REMOTE_NAMESPACE}`) as RejectMessageRemoteFace | undefined
    if (face === undefined) throw new Error(`${PLUGIN_NAME}: Remote did not mount`)
    setRecordReject(async (args) => {
      try {
        unwrapRecorded(await face.record(args))
      } catch (error) {
        ctx.logger.warn('%s: record failed: %s', PLUGIN_NAME, error)
      }
    })
    ctx.logger.info('%s: remote mounted', PLUGIN_NAME)
    return () => {
      setRecordReject(undefined)
      void dispose()
    }
  }, `${PLUGIN_NAME}: remote`)
}
