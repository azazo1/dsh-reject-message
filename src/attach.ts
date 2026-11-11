/**
 * 把暂存的拒绝描述折进 tools/post-execute 决策, 并改写宿主那句 "拒绝即终结" 的尾句.
 * 错误结果会把描述插到模型可见 content 开头, 并额外挂一条 additionalContext.
 */

import { createUserMessage, type ContentBlock } from '@deepseek-ai/dsh-llm'
import type { PostToolDecision, ToolExecution, ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import { rewriteEscalationTailBlocks } from './escalation-tail.ts'
import { formatRejectNote, PLUGIN_NAME } from './shared.ts'
import type { RejectMessageStore } from './store.ts'

/** 从工具执行里取出会话 id. */
export function sessionIdOf(exec: Pick<ToolExecution, 'agent'>): string | undefined {
  const id = exec.agent?.session.id
  return id === undefined ? undefined : String(id)
}

/**
 * 把一段拒绝描述插到已有 content blocks 开头.
 * 描述排在错误正文之前, 模型先读到用户的真实意思, 而不是把它当成附注掠过.
 */
export function prependRejectContent(content: readonly ContentBlock[], note: string): ContentBlock[] {
  const first = content[0]
  if (first !== undefined && first.type === 'text') {
    return [{ type: 'text', text: `${note}\n\n${first.text}` }, ...content.slice(1)]
  }
  return [{ type: 'text', text: note }, ...content]
}

function existingContexts(decision: PostToolDecision): NonNullable<PostToolDecision['additionalContexts']> {
  return decision.additionalContexts ?? []
}

/** 只在真有上下文时改决策对象, 否则原样返回, 保住下游决策的身份. */
function withContexts(
  decision: PostToolDecision,
  contexts: NonNullable<PostToolDecision['additionalContexts']>,
): PostToolDecision {
  return contexts.length === 0 ? decision : { ...decision, additionalContexts: contexts }
}

/**
 * 把拒绝描述折进下游决策, 并改写宿主拒绝升权的终结尾句.
 *
 * 描述要有会话与 callId 才认得出来, 尾句改写则只看文本, 所以没有描述时同样生效.
 * 下游已经给出 block 或 value, 以及结果本身是成功时, 都不动 content.
 *
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
  const note = sessionId === undefined ? undefined : store.takeFor(sessionId, exec.name, exec.callId)
  const noteText = note === undefined ? undefined : formatRejectNote(exec.name, note)
  const extra = noteText === undefined ? undefined : createUserMessage({
    content: [{ type: 'text', text: noteText }],
    source: {
      kind: PLUGIN_NAME,
      form: 'notice',
      summary: `The user rejected ${exec.name}.`,
    },
  })
  const contexts = [...existingContexts(downstream), ...extra === undefined ? [] : [extra]]

  if (downstream.kind === 'block' || 'value' in downstream || !result.isError) {
    return withContexts(downstream, contexts)
  }

  const baseContent = downstream.content ?? result.content
  const rewritten = rewriteEscalationTailBlocks(baseContent)
  const content = noteText === undefined
    ? rewritten
    : prependRejectContent(rewritten ?? baseContent, noteText)
  if (content === undefined) return withContexts(downstream, contexts)
  return contexts.length === 0
    ? { kind: 'accept', content }
    : { kind: 'accept', content, additionalContexts: contexts }
}
