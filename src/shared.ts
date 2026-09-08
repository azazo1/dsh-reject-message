/**
 * Host / Client 共用的包名, 拒绝描述契约和 Remote 描述符.
 * codec 只依赖 schema.parse, 不引入 zod, 避免 Client bundle 打进额外运行时.
 */

/** 插件包名, Client loader 注册 id, Loader row 名共用. */
export const PLUGIN_ID = 'dsh-reject-message'

/** Host Cordis 插件名. */
export const PLUGIN_NAME = PLUGIN_ID

/** Typert Remote 的服务键 / 线命名空间. */
export const REMOTE_NAMESPACE = 'rejectMessage'

/** 拒绝描述默认最大字符数. */
export const DEFAULT_MAX_LENGTH = 4000

/** 拒绝描述允许的最小最大字符数. */
export const MIN_MAX_LENGTH = 32

/** 拒绝描述允许的最大最大字符数. */
export const MAX_MAX_LENGTH = 16_000

/** Host 暂存拒绝描述的存活时间. */
export const REJECT_TTL_MS = 60_000

/** 注入样式的标记, 避免重复插入. */
export const STYLE_ATTR = 'data-plugin-css'

/** 注入样式的 id. */
export const STYLE_ID = PLUGIN_ID

/** 客户端记录拒绝描述的入参. */
export interface RecordRejectArgs {
  /** 发起审批的会话. */
  sessionId: string
  /** 被拒绝的工具名. */
  toolName: string
  /** 关联的工具调用 id, 原生审批有时不带. */
  callId?: string
  /** 用户填写的拒绝描述, 已 trim. */
  message: string
}

/** 客户端记录拒绝描述的结果. */
export interface RecordRejectResult {
  /** 是否写入了 Host 暂存. 空白描述不算记录. */
  recorded: boolean
}

/** 把未知值夹到合法的最大字符数. */
export function clampMaxLength(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return DEFAULT_MAX_LENGTH
  return Math.min(MAX_MAX_LENGTH, Math.max(MIN_MAX_LENGTH, Math.round(n)))
}

/**
 * 规范化拒绝描述: trim, 超长截断, 空白视为没有描述.
 * @param value - 用户输入或 Remote 入参.
 * @param maxLength - 截断上限.
 * @returns 有效描述, 或空白时的 `undefined`.
 */
export function normalizeRejectMessage(value: unknown, maxLength = DEFAULT_MAX_LENGTH): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined
  const limit = Number.isFinite(maxLength) && maxLength > 0
    ? Math.floor(maxLength)
    : DEFAULT_MAX_LENGTH
  return trimmed.length > limit ? trimmed.slice(0, limit) : trimmed
}

/**
 * 模型可见的拒绝描述正文. 工具结果和 additionalContexts 共用这段英文.
 * @param toolName - 被拒绝的工具名.
 * @param message - 已经规范化的拒绝描述.
 */
export function formatRejectNote(toolName: string, message: string): string {
  return `The user rejected this privileged request for tool "${toolName}" with this description:\n${message}`
}

function asNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} 必须是非空字符串`)
  }
  return value
}

function parseRecordRejectArgs(value: unknown): RecordRejectArgs {
  if (typeof value !== 'object' || value === null) throw new Error('record args 必须是对象')
  const record = value as Record<string, unknown>
  const args: RecordRejectArgs = {
    sessionId: asNonEmptyString(record.sessionId, 'sessionId'),
    toolName: asNonEmptyString(record.toolName, 'toolName'),
    message: asNonEmptyString(record.message, 'message'),
  }
  if (record.callId !== undefined) args.callId = asNonEmptyString(record.callId, 'callId')
  return args
}

function parseRecordRejectResult(value: unknown): RecordRejectResult {
  if (typeof value !== 'object' || value === null) throw new Error('result 必须是对象')
  const recorded = (value as Record<string, unknown>).recorded
  if (typeof recorded !== 'boolean') throw new Error('recorded 必须是布尔值')
  return { recorded }
}

function strictCodec(typeSymbol: string, parse: (value: unknown) => unknown) {
  return { mode: 'strict' as const, typeSymbol, schema: { parse } }
}

const recordArgsCodec = strictCodec('dsh-reject-message#RecordRejectArgs', parseRecordRejectArgs)
const recordResultCodec = strictCodec('dsh-reject-message#RecordRejectResult', parseRecordRejectResult)

/** Host ctx.typert.register 与 Client ctx.remote.$mount 共用的调用描述符. */
export const REJECT_INVOCATIONS = [
  {
    id: 'dsh-reject-message#rejectMessage/record',
    service: REMOTE_NAMESPACE,
    namespace: REMOTE_NAMESPACE,
    method: 'record',
    invocation: { kind: 'direct' as const },
    parameters: [{
      name: 'args',
      wire: 'args',
      source: 'json' as const,
      codec: recordArgsCodec,
    }],
    result: recordResultCodec,
  },
]

/** 客户端 Remote 贡献. */
export const REJECT_REMOTE_CONTRIBUTION = {
  package: PLUGIN_NAME,
  descriptors: REJECT_INVOCATIONS,
}

/** Host Typert 清单. */
export const REJECT_MANIFEST = {
  package: PLUGIN_NAME,
  face: 'host' as const,
  schemas: [],
  model: {
    services: [{
      key: REMOTE_NAMESPACE,
      exportName: 'RejectMessageRuntime',
      description: 'Record a user reject description for the current approval.',
      tags: [],
      members: [
        { kind: 'method' as const, name: 'record', signature: 'record(args: RecordRejectArgs): Promise<RecordRejectResult>' },
      ],
      types: [],
    }],
    events: [],
    objects: [],
  },
  invocations: REJECT_INVOCATIONS,
}

export { parseRecordRejectArgs, parseRecordRejectResult }
