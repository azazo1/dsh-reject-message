/**
 * 原生提权窗口的接管实现: 允许一次仍直接放行, 拒绝则进入同款拒绝窗口填写描述.
 */

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { normalizeRejectMessage } from '../shared.ts'
import type { PendingApprovalView } from './pending.ts'
import type { RejectMessageKey } from './locales.ts'

/** 拒绝窗口从 Client 入口拿到的 Remote 记录函数. */
export type RecordRejectFn = (args: {
  sessionId: string
  toolName: string
  callId?: string
  message: string
}) => Promise<void>

let recordReject: RecordRejectFn = async () => {
  throw new Error('dsh-reject-message: remote is not mounted')
}

/**
 * 绑定 Host Remote. 插件卸载时清掉, 避免窗口把描述打到已销毁的通道.
 * @param next - 当前可用的记录函数, 或 `undefined`.
 */
export function setRecordReject(next: RecordRejectFn | undefined): void {
  recordReject = next ?? (async () => {
    throw new Error('dsh-reject-message: remote is not mounted')
  })
}

/** conversation.composer 交给本插件的最小 props. */
export interface RejectPanelProps {
  /** 选中的原生审批. */
  matched: PendingApprovalView
  /** 原生审批详情 slot, 例如 bash 命令. */
  renderSlot: (name: string, owner: { callId: string }) => ReactNode
  /** 本插件 locale 命名空间. */
  t: (key: RejectMessageKey, params?: Record<string, string>) => string
}

/**
 * 渲染一次审批, 并在拒绝时切换到描述窗口.
 * @param props - composer chain 选中的审批.
 */
export function RejectPanel(props: RejectPanelProps) {
  const approval = props.matched
  const detail = approval.callId === undefined
    ? null
    : props.renderSlot('conversation.approval.detail', { callId: approval.callId })
  return (
    <RejectFlow
      key={approval.key}
      pending={approval}
      detail={detail}
      t={props.t}
    />
  )
}

function RejectFlow({ pending, detail, t }: {
  pending: PendingApprovalView
  detail: ReactNode
  t: RejectPanelProps['t']
}) {
  const [phase, setPhase] = useState<'ask' | 'reject'>('ask')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const noteRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (phase !== 'reject') return
    noteRef.current?.focus()
  }, [phase])

  const finish = (outcome: 'allowed-once' | 'rejected', run?: () => Promise<void>): void => {
    setBusy(true)
    void (async () => {
      try {
        if (run !== undefined) await run()
        await pending.answer(outcome)
      } catch {
        setBusy(false)
      }
    })()
  }

  const confirmReject = (): void => {
    const message = normalizeRejectMessage(note)
    finish('rejected', message === undefined ? undefined : async () => {
      try {
        await recordReject({
          sessionId: pending.sessionId,
          toolName: pending.toolName,
          message,
          ...pending.callId === undefined ? {} : { callId: pending.callId },
        })
      } catch {
        // Host 没记下描述时仍然拒绝, 避免把用户已经做出的拒绝卡住.
      }
    })
  }

  const onNoteKey = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key !== 'Enter' || (!event.metaKey && !event.ctrlKey)) return
    event.preventDefault()
    if (!busy) confirmReject()
  }

  if (phase === 'reject') {
    return (
      <div className="drm-root" data-approval-key={pending.key} data-reject-mode="">
        <div className="drm-card">
          <div className="drm-strip">
            <span className="drm-dot" />
            {t('rejectWaiting')}
          </div>
          <div className="drm-body" data-approval-scroll="" tabIndex={0} role="group" aria-label={t('reject.aria')}>
            <div className="drm-headline">{pending.reason ?? t('escalation', { toolName: pending.toolName })}</div>
            {detail !== null && <div className="drm-command">{detail}</div>}
            <div className="drm-hint">{t('rejectHint')}</div>
            <textarea
              ref={noteRef}
              className="drm-note"
              value={note}
              disabled={busy}
              placeholder={t('rejectPlaceholder')}
              onChange={(event) => { setNote(event.currentTarget.value) }}
              onKeyDown={onNoteKey}
            />
          </div>
          <div className="drm-actions">
            <button
              type="button"
              className="drm-btn drm-btn-outline"
              disabled={busy}
              onClick={() => { setPhase('ask') }}
            >
              {t('rejectBack')}
            </button>
            <button
              type="button"
              className="drm-btn drm-btn-outline drm-btn-reject"
              disabled={busy}
              onClick={confirmReject}
            >
              {t('rejectConfirm')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="drm-root" data-approval-key={pending.key}>
      <div className="drm-card">
        <div className="drm-strip">
          <span className="drm-dot" />
          {t('waiting')}
        </div>
        <div className="drm-body" data-approval-scroll="" tabIndex={0} role="group" aria-label={t('detail.aria')}>
          <div className="drm-headline">{pending.reason ?? t('escalation', { toolName: pending.toolName })}</div>
          {detail !== null && <div className="drm-command">{detail}</div>}
        </div>
        <div className="drm-actions">
          <button
            type="button"
            className="drm-btn drm-btn-outline drm-btn-reject"
            disabled={busy}
            onClick={() => { setPhase('reject') }}
          >
            {t('reject')}
          </button>
          <button
            type="button"
            className="drm-btn drm-btn-primary"
            disabled={busy}
            onClick={() => { finish('allowed-once') }}
          >
            {t('allowOnce')}
          </button>
        </div>
      </div>
    </div>
  )
}
