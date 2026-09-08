import z from "@deepseek-ai/schemastery";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
import { TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
/** Host Cordis 插件名. */
const PLUGIN_NAME = "dsh-reject-message";
/** Typert Remote 的服务键 / 线命名空间. */
const REMOTE_NAMESPACE = "rejectMessage";
/** 拒绝描述默认最大字符数. */
const DEFAULT_MAX_LENGTH = 4e3;
/** 拒绝描述允许的最大最大字符数. */
const MAX_MAX_LENGTH = 16e3;
/** Host 暂存拒绝描述的存活时间. */
const REJECT_TTL_MS = 6e4;
/** 把未知值夹到合法的最大字符数. */
function clampMaxLength(value) {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n)) return DEFAULT_MAX_LENGTH;
	return Math.min(MAX_MAX_LENGTH, Math.max(32, Math.round(n)));
}
/**
* 规范化拒绝描述: trim, 超长截断, 空白视为没有描述.
* @param value - 用户输入或 Remote 入参.
* @param maxLength - 截断上限.
* @returns 有效描述, 或空白时的 `undefined`.
*/
function normalizeRejectMessage(value, maxLength = DEFAULT_MAX_LENGTH) {
	if (typeof value !== "string") return void 0;
	const trimmed = value.trim();
	if (trimmed.length === 0) return void 0;
	const limit = Number.isFinite(maxLength) && maxLength > 0 ? Math.floor(maxLength) : DEFAULT_MAX_LENGTH;
	return trimmed.length > limit ? trimmed.slice(0, limit) : trimmed;
}
/**
* 模型可见的拒绝描述正文. 工具结果和 additionalContexts 共用这段英文.
* @param toolName - 被拒绝的工具名.
* @param message - 已经规范化的拒绝描述.
*/
function formatRejectNote(toolName, message) {
	return `The user rejected this privileged request for tool "${toolName}" with this description:\n${message}`;
}
function asNonEmptyString(value, label) {
	if (typeof value !== "string" || value.length === 0) throw new Error(`${label} 必须是非空字符串`);
	return value;
}
function parseRecordRejectArgs(value) {
	if (typeof value !== "object" || value === null) throw new Error("record args 必须是对象");
	const record = value;
	const args = {
		sessionId: asNonEmptyString(record.sessionId, "sessionId"),
		toolName: asNonEmptyString(record.toolName, "toolName"),
		message: asNonEmptyString(record.message, "message")
	};
	if (record.callId !== void 0) args.callId = asNonEmptyString(record.callId, "callId");
	return args;
}
function parseRecordRejectResult(value) {
	if (typeof value !== "object" || value === null) throw new Error("result 必须是对象");
	const recorded = value.recorded;
	if (typeof recorded !== "boolean") throw new Error("recorded 必须是布尔值");
	return { recorded };
}
function strictCodec(typeSymbol, parse) {
	return {
		mode: "strict",
		typeSymbol,
		schema: { parse }
	};
}
const recordArgsCodec = strictCodec("dsh-reject-message#RecordRejectArgs", parseRecordRejectArgs);
const recordResultCodec = strictCodec("dsh-reject-message#RecordRejectResult", parseRecordRejectResult);
/** Host Typert 清单. */
const REJECT_MANIFEST = {
	package: PLUGIN_NAME,
	face: "host",
	schemas: [],
	model: {
		services: [{
			key: REMOTE_NAMESPACE,
			exportName: "RejectMessageRuntime",
			description: "Record a user reject description for the current approval.",
			tags: [],
			members: [{
				kind: "method",
				name: "record",
				signature: "record(args: RecordRejectArgs): Promise<RecordRejectResult>"
			}],
			types: []
		}],
		events: [],
		objects: []
	},
	invocations: [{
		id: "dsh-reject-message#rejectMessage/record",
		service: REMOTE_NAMESPACE,
		namespace: REMOTE_NAMESPACE,
		method: "record",
		invocation: { kind: "direct" },
		parameters: [{
			name: "args",
			wire: "args",
			source: "json",
			codec: recordArgsCodec
		}],
		result: recordResultCodec
	}]
};
//#endregion
//#region src/attach.ts
/**
* 把暂存的拒绝描述折进 tools/post-execute 决策.
* 错误结果会把描述追加到模型可见 content, 并额外挂一条 additionalContext.
*/
/** 从工具执行里取出会话 id. */
function sessionIdOf(exec) {
	const id = exec.agent?.session.id;
	return id === void 0 ? void 0 : String(id);
}
/**
* 把一段拒绝描述追加到已有 content blocks 末尾.
* 末块是 text 时直接拼接, 否则再开一块, 避免打散原有投影.
*/
function appendRejectContent(content, note) {
	const last = content[content.length - 1];
	if (last !== void 0 && last.type === "text") return [...content.slice(0, -1), {
		type: "text",
		text: `${last.text}\n\n${note}`
	}];
	return [...content, {
		type: "text",
		text: note
	}];
}
function existingContexts(decision) {
	return decision.additionalContexts ?? [];
}
/**
* 若本次工具结果对应一条未消费的拒绝描述, 把它附加到下游决策上.
* 没有描述时原样返回下游决策, 不改成功结果的 value.
* @param store - Host 暂存.
* @param exec - 当前工具执行.
* @param result - 进入 post-execute 的规范结果.
* @param downstream - 下游 listener 返回的决策.
*/
function attachRejectMessage(store, exec, result, downstream) {
	const sessionId = sessionIdOf(exec);
	if (sessionId === void 0) return downstream;
	const note = store.takeFor(sessionId, exec.name, exec.callId);
	if (note === void 0) return downstream;
	const extra = createUserMessage({
		content: [{
			type: "text",
			text: formatRejectNote(exec.name, note)
		}],
		source: {
			kind: "plugin",
			plugin: PLUGIN_NAME
		}
	});
	const additionalContexts = [...existingContexts(downstream), extra];
	if (downstream.kind === "block") return {
		...downstream,
		additionalContexts
	};
	if ("value" in downstream) return {
		...downstream,
		additionalContexts
	};
	if (!result.isError) return {
		...downstream,
		additionalContexts
	};
	return {
		kind: "accept",
		content: appendRejectContent(downstream.content ?? result.content, formatRejectNote(exec.name, note)),
		additionalContexts
	};
}
//#endregion
//#region src/runtime.ts
/** 拒绝描述 Remote 服务, 挂在 `ctx.rejectMessage`. */
var RejectMessageRuntime = class extends TypertRemoteService {
	store;
	maxLength;
	/**
	* @param ctx - 所属 Cordis 上下文.
	* @param store - 与 tools/post-execute 共用的暂存.
	* @param maxLength - 描述截断上限.
	*/
	constructor(ctx, store, maxLength) {
		super(ctx, REMOTE_NAMESPACE);
		this.store = store;
		this.maxLength = maxLength;
	}
	/**
	* 记录一次拒绝描述. 空白描述不写入暂存.
	* @param args - 会话, 工具和描述.
	*/
	async record(args) {
		const message = normalizeRejectMessage(args.message, this.maxLength);
		if (message === void 0) {
			this.ctx.logger.info("%s: skip blank reject description tool=%s", PLUGIN_NAME, args.toolName);
			return { recorded: false };
		}
		const key = this.store.key(args.sessionId, args.toolName, args.callId);
		this.store.put(key, message);
		this.ctx.logger.info("%s: stored reject description tool=%s chars=%d", PLUGIN_NAME, args.toolName, message.length);
		return { recorded: true };
	}
};
//#endregion
//#region src/store.ts
/** 按会话和工具调用索引拒绝描述. */
var RejectMessageStore = class {
	records = /* @__PURE__ */ new Map();
	ttlMs;
	/**
	* @param ttlMs - 条目存活时间, 超时后 take 视为未命中.
	*/
	constructor(ttlMs) {
		this.ttlMs = ttlMs;
	}
	/**
	* 生成暂存键. 有 callId 时优先按调用对齐, 否则退回 session + toolName.
	* @param sessionId - 审批所属会话.
	* @param toolName - 被拒绝的工具名.
	* @param callId - 原生审批可选的工具调用 id.
	*/
	key(sessionId, toolName, callId) {
		if (callId !== void 0 && callId.length > 0) return `call:${sessionId}:${callId}`;
		return `tool:${sessionId}:${toolName}`;
	}
	/**
	* 写入或覆盖一条拒绝描述.
	* @param key - {@link key} 的返回值.
	* @param message - 已经规范化的描述.
	* @param now - 可注入的当前时间, 便于测试.
	*/
	put(key, message, now = Date.now()) {
		this.records.set(key, {
			message,
			storedAt: now
		});
	}
	/**
	* 取出并删除一条描述. 缺失或过期返回 `undefined`.
	* @param key - {@link key} 的返回值.
	* @param now - 可注入的当前时间, 便于测试.
	*/
	take(key, now = Date.now()) {
		const record = this.records.get(key);
		if (record === void 0) return void 0;
		this.records.delete(key);
		if (now - record.storedAt > this.ttlMs) return void 0;
		return record.message;
	}
	/**
	* 按工具执行取出描述: 先试 callId 键, 再试 tool 键.
	* @param sessionId - 审批所属会话.
	* @param toolName - 被拒绝的工具名.
	* @param callId - 工具调用 id.
	* @param now - 可注入的当前时间, 便于测试.
	*/
	takeFor(sessionId, toolName, callId, now = Date.now()) {
		if (callId !== void 0 && callId.length > 0) {
			const byCall = this.take(this.key(sessionId, toolName, callId), now);
			if (byCall !== void 0) return byCall;
		}
		return this.take(this.key(sessionId, toolName), now);
	}
};
//#endregion
//#region src/index.ts
const name = PLUGIN_NAME;
const inject = ["typert"];
/** Loader 校验用 schema. */
const Config = z.object({ maxLength: z.number().step(1).min(32).max(MAX_MAX_LENGTH).default(DEFAULT_MAX_LENGTH) });
/**
* 挂上 Remote 和 post-execute 附加.
* @param ctx - Host 插件上下文.
* @param config - Loader 校验后的行配置.
*/
function apply(ctx, config) {
	const maxLength = clampMaxLength(Config(config).maxLength);
	const store = new RejectMessageStore(REJECT_TTL_MS);
	new RejectMessageRuntime(ctx, store, maxLength);
	ctx.logger.info("%s: host loaded, maxLength=%d", PLUGIN_NAME, maxLength);
	ctx.effect(() => {
		const dispose = ctx.typert.register(REJECT_MANIFEST);
		return () => {
			dispose();
		};
	}, `${PLUGIN_NAME}: typert manifest`);
	ctx.on("tools/post-execute", async (exec, result, next) => {
		const downstream = await next();
		const attached = attachRejectMessage(store, exec, result, downstream);
		if (attached !== downstream) ctx.logger.info("%s: attached reject description to tool=%s", PLUGIN_NAME, exec.name);
		return attached;
	});
}
//#endregion
export { Config, apply, inject, name };

//# sourceMappingURL=index.js.map