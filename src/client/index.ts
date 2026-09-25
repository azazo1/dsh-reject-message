/**
 * dsh-reject-message 浏览器半区.
 *
 * composer chain 只接管原生审批; plan 审查卡交回原生 PlanReviewPanel 渲染,
 * 插件只在它上面挂一个拒绝入口. 提权拒绝经 Remote 交给 Host, plan 拒绝走
 * questions 的 custom.
 */

import {
  PLUGIN_NAME,
  REJECT_REMOTE_CONTRIBUTION,
  REMOTE_NAMESPACE,
} from '../shared.ts'
import type { ClientContext, RejectMessageRemoteFace } from './context.ts'
import { en, zh } from './locales.ts'
import { routeComposerPending } from './plan-pending.ts'
import { PlanRejectAction } from './PlanRejectAction.tsx'
import { RejectPanel, setRecordReject } from './RejectPanel.tsx'
import { injectStyles } from './styles.ts'

const NS = PLUGIN_NAME

export const inject = ['slots', 'locale', 'remote']

function unwrapRecorded(result: Awaited<ReturnType<RejectMessageRemoteFace['record']>>): void {
  if (result.ok === true) return
  throw new Error(result.error.message)
}

/**
 * 注入样式, 注册拒绝窗口文案, 接管审批 composer, 挂上 plan 拒绝入口和 Remote.
 * @param ctx - Web Client 插件上下文.
 */
export function apply(ctx: ClientContext): void {
  ctx.logger.info('%s: client applying', PLUGIN_NAME)
  injectStyles()
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), `${PLUGIN_NAME}: dictionaries`)

  ctx.slots.inject('conversation.composer', () => ctx.slots.register({
    name: 'conversation.composer',
    priority: -1,
    select: ({ pendingInteraction, sessionId }: {
      pendingInteraction?: unknown
      sessionId?: string
    }) => routeComposerPending(pendingInteraction, sessionId),
    locale: NS,
    inject: () => ({
      resolveReason: (reason: Record<string, string>) => ctx.locale.resolveText(reason),
    }),
    // 不声明 conversation.approval.detail 与 conversation.plan-review.actions:
    // 一个 slot 只允许一个 entry 声明, 这两个的声明权都在原生侧. 重复声明会让
    // 后注册的一方抛错; 在全局 / main 配置下会拖垮整个 client boot.
  }, RejectPanel))

  ctx.slots.inject('conversation.plan-review.actions', () => ctx.slots.register({
    name: 'conversation.plan-review.actions',
    id: PLUGIN_NAME,
    order: 10,
    locale: NS,
  }, PlanRejectAction))

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
