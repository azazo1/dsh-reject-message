/**
 * conversation.composer 入口: 按 pending.kind 分到提权卡或 plan 审查卡.
 */

import { PlanRejectPanel } from './PlanRejectPanel.tsx'
import { RejectPanel, type RejectPanelProps } from './RejectPanel.tsx'
import type { PendingApprovalView, PendingPlanReviewView } from './pending.ts'

/** composer chain 选中提权或 plan-review 后的 props. */
export interface ComposerPanelProps extends Omit<RejectPanelProps, 'matched'> {
  /** 选中的 pending. */
  matched: PendingApprovalView | PendingPlanReviewView
}

/**
 * 按 kind 渲染对应接管卡片.
 * @param props - composer chain 交给本插件的 props.
 */
export function ComposerPanel(props: ComposerPanelProps) {
  if (props.matched.kind === 'plan-review') {
    return <PlanRejectPanel matched={props.matched} t={props.t} />
  }
  return <RejectPanel matched={props.matched} t={props.t} useChat={props.useChat} />
}
