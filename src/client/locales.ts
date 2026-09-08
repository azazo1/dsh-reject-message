/** `dsh-reject-message` 命名空间文案. 审批步复用原生提权窗口用词. */

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
} satisfies Record<RejectMessageKey, string>
