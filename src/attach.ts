/**
 * 把暂存的拒绝描述折进 tools/post-execute 决策.
 * 错误结果会把描述追加到模型可见 content, 并额外挂一条 additionalContext.
 */

import { createUserMessage, type ContentBlock } from '@deepseek-ai/dsh-llm'
import type { PostToolDecision, ToolExecution, ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import { formatRejectNote, PLUGIN_NAME } from './shared.ts'
import type { RejectMessageStore } from './store.ts'

/** 从工具执行里取出会话 id. */
export function sessionIdOf(exec: Pick<ToolExecution, 'agent'>): string | undefined {
  const id = exec.agent?.session.id
  return id === undefined ? undefined : String(id)
}

/**
 * 把一段拒绝描述追加到已有 content blocks 末尾.
 * 末块是 text 时直接拼接, 否则再开一块, 避免打散原有投影.
 */
export function appendRejectContent(content: readonly ContentBlock[], note: string): ContentBlock[] {
  const last = content[content.length - 1]
  if (last !== undefined && last.type === 'text') {
    return [...content.slice(0, -1), { type: 'text', text: `${last.text}\n\n${note}` }]
  }
  return [...content, { type: 'text', text: note }]
}

function existingContexts(decision: PostToolDecision): NonNullable<PostToolDecision['additionalContexts']> {
  return decision.additionalContexts ?? []
}

/**
 * 若本次工具结果对应一条未消费的拒绝描述, 把它附加到下游决策上.
 * 没有描述时原样返回下游决策, 不改成功结果的 value.
 * @param store - Host 暂存.
 * @param exec - 当前工具执行.
 * @param result - 进入 post-execute 的规范结果.
 * @param downstream - 下游 listener 返回的决策.
 */
export function attachRejectMessage(
  store: RejectMessageStore,
  exec: ToolExecution,
  result: ToolExecutionResult,
  downstream: PostToolDecision,
): PostToolDecision {
  const sessionId = sessionIdOf(exec)
  if (sessionId === undefined) return downstream
  const note = store.takeFor(sessionId, exec.name, exec.callId)
  if (note === undefined) return downstream

  const extra = createUserMessage({
    content: [{ type: 'text', text: formatRejectNote(exec.name, note) }],
    source: { kind: 'plugin', plugin: PLUGIN_NAME },
  })
  const additionalContexts = [...existingContexts(downstream), extra]

  if (downstream.kind === 'block') {
    return { ...downstream, additionalContexts }
  }
  if ('value' in downstream) {
    return { ...downstream, additionalContexts }
  }
  if (!result.isError) {
    return { ...downstream, additionalContexts }
  }

  const baseContent = downstream.content ?? result.content
  return {
    kind: 'accept',
    content: appendRejectContent(baseContent, formatRejectNote(exec.name, note)),
    additionalContexts,
  }
}
