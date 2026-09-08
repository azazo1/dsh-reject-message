import type { REJECT_REMOTE_CONTRIBUTION } from '../shared.ts'

/** Client 插件实际用到的 Cordis 面. */
export interface ClientContext {
  logger: {
    info: (...args: unknown[]) => void
    warn: (...args: unknown[]) => void
    debug: (...args: unknown[]) => void
  }
  locale: {
    register: (ns: string, dictionaries: Record<string, Record<string, string>>) => () => void
  }
  slots: {
    inject: (name: string, factory: () => unknown) => void
    register: (options: Record<string, unknown>, component: unknown) => unknown
  }
  remote: {
    $mount: (contribution: typeof REJECT_REMOTE_CONTRIBUTION) => Promise<() => void>
  }
  reflect: {
    get: (name: string) => unknown
  }
  effect: (callback: () => (() => void) | void | Promise<() => void>, name?: string) => void
}

/** 挂在 `remote.rejectMessage` 下的 face. */
export interface RejectMessageRemoteFace {
  record: (args: {
    sessionId: string
    toolName: string
    callId?: string
    message: string
  }, signal?: AbortSignal) => Promise<{
    ok: true
    value: { recorded: boolean }
  } | {
    ok: false
    error: { code: string; message: string }
  }>
}
