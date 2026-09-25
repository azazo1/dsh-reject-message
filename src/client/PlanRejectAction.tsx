/**
 * 原生 plan 审查卡上的拒绝入口.
 *
 * 卡片本身由原生 PlanReviewPanel 渲染, 本插件只往
 * conversation.plan-review.actions 挂一个 entry: 点开后用弹窗填写描述,
 * 再以 Keep planning + custom 交回 user-questions.
 */

import { useRef, useState, type KeyboardEvent } from 'react'
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { normalizeRejectMessage } from '../shared.ts'
import type { RejectMessageKey } from './locales.ts'
import { planReviewPending } from './plan-pending.ts'
import { keepPlanningAnswer, type PendingPlanReviewView } from './pending.ts'

/** 原生审查卡收窄后的视图, 只列本入口用到的字段. */
export interface PlanReviewView {
  /** 审查问题 id, 原样回传. */
  readonly id: string
  /** 确认执行的 option. */
  readonly approve: { readonly label: string }
  /** Keep planning 的 option, 缺省表示这次审查没有第二个选项. */
  readonly decline?: { readonly label: string }
}

/** conversation.plan-review.actions 交给本插件 entry 的 owner 份额. */
export interface PlanRejectActionProps {
  /** 原生收窄后的审查视图. */
  review: PlanReviewView
  /** 审查卡的渲染身份, 与 pending.key 一致. */
  requestKey: string
  /** 本插件 locale 命名空间. */
  t: (key: RejectMessageKey, params?: Record<string, string>) => string
}

/**
 * 渲染原生卡上的拒绝入口; 拿不到对应 pending 或没有第二个选项时不出现.
 * @param props - actions slot 的 owner 份额与插件文案.
 */
export function PlanRejectAction(props: PlanRejectActionProps) {
  const decline = props.review.decline
  const pending = planReviewPending(props.requestKey)
  if (decline === undefined || pending === undefined) return null
  return (
    <PlanRejectDialog
      key={props.requestKey}
      reviewId={props.review.id}
      declineLabel={decline.label}
      answer={pending.answer}
      t={props.t}
    />
  )
}

function PlanRejectDialog({ reviewId, declineLabel, answer, t }: {
  reviewId: string
  declineLabel: string
  answer: PendingPlanReviewView['answer']
  t: PlanRejectActionProps['t']
}) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const waiting = useRef(false)

  const submit = (): void => {
    if (waiting.current) return
    waiting.current = true
    setBusy(true)
    setError(null)
    const message = normalizeRejectMessage(note)
    void (async () => {
      try {
        await answer(keepPlanningAnswer(reviewId, declineLabel, message))
        setOpen(false)
      } catch (cause) {
        waiting.current = false
        setBusy(false)
        setError(cause instanceof Error ? cause.message : String(cause))
      }
    })()
  }

  const onNoteKey = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key !== 'Enter' || (!event.metaKey && !event.ctrlKey)) return
    event.preventDefault()
    submit()
  }

  return (
    <>
      <span className="drm-plan-action">
        <Button
          variant="ghost"
          size="sm"
          className="drm-plan-reject"
          disabled={busy}
          onClick={() => { setOpen(true) }}
        >
          {t('plan.rejectAction')}
        </Button>
      </span>
      <Modal
        open={open}
        onClose={() => { if (!busy) setOpen(false) }}
        title={t('plan.rejectTitle')}
        description={t('plan.rejectHint')}
        closeLabel={t('plan.rejectCancel')}
        footer={(
          <>
            <Button variant="outline" disabled={busy} onClick={() => { setOpen(false) }}>
              {t('plan.rejectCancel')}
            </Button>
            <Button variant="outline" className="drm-reject" disabled={busy} onClick={submit}>
              {t('plan.rejectConfirm')}
            </Button>
          </>
        )}
      >
        <textarea
          className="drm-note"
          value={note}
          disabled={busy}
          data-modal-autofocus=""
          aria-label={t('plan.reject.aria')}
          placeholder={t('plan.rejectPlaceholder')}
          onChange={(event) => { setNote(event.currentTarget.value) }}
          onKeyDown={onNoteKey}
        />
        {error !== null && <div className="drm-error">{error}</div>}
      </Modal>
    </>
  )
}
