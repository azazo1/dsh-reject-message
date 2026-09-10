/**
 * 审批卡片的命令读数.
 *
 * 审批详情 slot (`conversation.approval.detail`) 的声明权归原生 ui-approval.
 * 0.1.5 起一个 slot 只允许一个 entry 声明, 本插件不再声明它, 改为在同一个
 * session scope 下直接用 chat 快照取关联工具调用的命令.
 */

/** Session scope 的 chat 选择器: 订阅快照并返回命令. */
export type ChatSelector = (snapshot: unknown) => string | undefined

/** Session scope 的 useChat hook: 订阅 chat 快照并跑选择器. */
export type UseChat = (select: ChatSelector) => string | undefined

const COMMAND_ARGS_KEY = 'command'

/**
 * 从 chat 快照里取与本次审批关联的工具调用命令.
 * 结构与 `@deepseek-ai/dsh-client-ui-chat` 的 ApprovalCommand 一致; 取不到就
 * 不显示命令, 不允许影响卡片本身.
 * @param snapshot - useChat 传入的 chat 快照.
 * @param callId - 关联的工具调用 id.
 * @returns 命令文本, 或 `undefined`.
 */
export function commandOf(snapshot: unknown, callId: string): string | undefined {
  if (typeof snapshot !== 'object' || snapshot === null) return undefined
  const nodes = (snapshot as { nodes?: unknown }).nodes
  if (typeof nodes !== 'object' || nodes === null) return undefined
  // nodes 是 ChatNodeStore, 不是 Map; 只要它能 values() 就按原生读法遍历.
  const values = (nodes as { values?: unknown }).values
  if (typeof values !== 'function') return undefined
  for (const node of (values.call(nodes) as Iterable<unknown>)) {
    if (typeof node !== 'object' || node === null) continue
    const entry = node as Record<string, unknown>
    if (entry.kind !== 'tool-call') continue
    const root = (entry.data as { root?: unknown } | undefined)?.root
    if (typeof root !== 'object' || root === null) continue
    const call = root as Record<string, unknown>
    // 带 kind 的 root 不是工具调用节点本身.
    if (call.callId !== callId || 'kind' in call) continue
    if (typeof call.argsRaw !== 'string') return undefined
    try {
      const args = JSON.parse(call.argsRaw) as Record<string, unknown>
      return typeof args[COMMAND_ARGS_KEY] === 'string' ? args[COMMAND_ARGS_KEY] : undefined
    } catch {
      return undefined
    }
  }
  return undefined
}
