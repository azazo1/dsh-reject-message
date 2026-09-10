/** `dsh-reject-message` 命名空间文案. 审批步复用原生提权窗口用词, plan 步对齐原生审查卡. */

/** 简体中文词典, 也是 key 集合的来源. */
export const zh = {
  waiting: '等待审批',
  'detail.aria': '审批详情',
  escalation: '工具 {toolName} 请求越权执行',
  reject: '拒绝',
  allowOnce: '允许一次',
  rejectWaiting: '拒绝此次提权',
  rejectHint: '可填写拒绝原因, 模型会看到这段描述. 留空则按普通拒绝处理.',
  rejectPlaceholder: '拒绝原因 (可选)',
  rejectConfirm: '确认拒绝',
  rejectBack: '返回',
  'reject.aria': '拒绝描述',
  'plan.header': '计划待审',
  'plan.approve': '确认执行',
  'plan.decline': '拒绝',
  'plan.discuss': '去聊天里说',
  'plan.aria': '计划内容',
  'plan.rejectWaiting': '拒绝此计划',
  'plan.rejectHint': '可填写拒绝原因, 模型会看到这段描述. 留空则按普通拒绝处理.',
  'plan.rejectPlaceholder': '拒绝原因 (可选)',
  'plan.reject.aria': '拒绝描述',
  copy: '复制',
  copied: '已复制',
  'markdown.footnotes': '脚注',
} satisfies Record<string, string>

/** 拒绝窗口词典 key. */
export type RejectMessageKey = keyof typeof zh

/** 英文词典, 与中文 key 对齐. */
export const en = {
  waiting: 'Waiting for approval',
  'detail.aria': 'Approval details',
  escalation: 'Tool {toolName} requests privileged execution',
  reject: 'Reject',
  allowOnce: 'Allow once',
  rejectWaiting: 'Reject this request',
  rejectHint: 'You can add a reject description. The model will see it. Leave empty to reject without a note.',
  rejectPlaceholder: 'Reject description (optional)',
  rejectConfirm: 'Confirm reject',
  rejectBack: 'Back',
  'reject.aria': 'Reject description',
  'plan.header': 'Plan review',
  'plan.approve': 'Approve',
  'plan.decline': 'Refuse',
  'plan.discuss': 'Chat about it',
  'plan.aria': 'Plan content',
  'plan.rejectWaiting': 'Refuse this plan',
  'plan.rejectHint': 'You can add a reject description. The model will see it. Leave empty to reject without a note.',
  'plan.rejectPlaceholder': 'Reject description (optional)',
  'plan.reject.aria': 'Reject description',
  copy: 'Copy',
  copied: 'Copied',
  'markdown.footnotes': 'Footnotes',
} satisfies Record<RejectMessageKey, string>
