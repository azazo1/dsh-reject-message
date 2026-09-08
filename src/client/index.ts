/**
 * dsh-reject-message 浏览器半区.
 *
 * 以低于原生 ui-approval 的 composer 优先级接管 PendingApproval, 复用同一张
 * 提权卡片; 点拒绝后切到可填写描述的拒绝窗口, 再经 Remote 交给 Host.
 */

import {
  PLUGIN_NAME,
  REJECT_REMOTE_CONTRIBUTION,
  REMOTE_NAMESPACE,
} from '../shared.ts'
import type { ClientContext, RejectMessageRemoteFace } from './context.ts'
import { en, zh } from './locales.ts'
import { isPendingApproval } from './pending.ts'
import { RejectPanel, setRecordReject } from './RejectPanel.tsx'
import { injectStyles } from './styles.ts'

const NS = PLUGIN_NAME

export const inject = ['slots', 'locale', 'remote']

function unwrapRecorded(result: Awaited<ReturnType<RejectMessageRemoteFace['record']>>): void {
  if (result.ok === true) return
  throw new Error(result.error.message)
}

/**
 * 注入样式, 注册拒绝窗口文案, 接管审批 composer, 并挂上 Remote.
 * @param ctx - Web Client 插件上下文.
 */
export function apply(ctx: ClientContext): void {
  ctx.logger.info('%s: client applying', PLUGIN_NAME)
  injectStyles()
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), `${PLUGIN_NAME}: dictionaries`)

  ctx.slots.inject('conversation.composer', () => ctx.slots.register({
    name: 'conversation.composer',
    priority: 0,
    select: ({ pendingInteraction }: { pendingInteraction?: unknown }) => (
      isPendingApproval(pendingInteraction) ? pendingInteraction : null
    ),
    locale: NS,
    children: {
      'conversation.approval.detail': { kind: 'single', scope: 'session' },
    },
  }, RejectPanel))

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
