window.__ModuleLoader__.load({
	id: "dsh-reject-message",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/shared.ts
		/**
		* Host / Client 共用的包名, 拒绝描述契约和 Remote 描述符.
		* codec 只依赖 schema.parse, 不引入 zod, 避免 Client bundle 打进额外运行时.
		*/
		/** 插件包名, Client loader 注册 id, Loader row 名共用. */
		const PLUGIN_ID = "dsh-reject-message";
		/** Host Cordis 插件名. */
		const PLUGIN_NAME = PLUGIN_ID;
		/** Typert Remote 的服务键 / 线命名空间. */
		const REMOTE_NAMESPACE = "rejectMessage";
		/** 拒绝描述默认最大字符数. */
		const DEFAULT_MAX_LENGTH = 4e3;
		/** 注入样式的标记, 避免重复插入. */
		const STYLE_ATTR = "data-plugin-css";
		/** 注入样式的 id. */
		const STYLE_ID = PLUGIN_ID;
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
		/** 客户端 Remote 贡献. */
		const REJECT_REMOTE_CONTRIBUTION = {
			package: PLUGIN_NAME,
			descriptors: [{
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
		//#region src/client/locales.ts
		/** `dsh-reject-message` 命名空间文案. 审批步复用原生提权窗口用词. */
		/** 简体中文词典, 也是 key 集合的来源. */
		const zh = {
			waiting: "等待审批",
			"detail.aria": "审批详情",
			escalation: "工具 {toolName} 请求越权执行",
			reject: "拒绝",
			allowOnce: "允许一次",
			rejectWaiting: "拒绝此次提权",
			rejectHint: "可填写拒绝原因, 模型会看到这段描述. 留空则按普通拒绝处理.",
			rejectPlaceholder: "拒绝原因 (可选)",
			rejectConfirm: "确认拒绝",
			rejectBack: "返回",
			"reject.aria": "拒绝描述"
		};
		/** 英文词典, 与中文 key 对齐. */
		const en = {
			waiting: "Waiting for approval",
			"detail.aria": "Approval details",
			escalation: "Tool {toolName} requests privileged execution",
			reject: "Reject",
			allowOnce: "Allow once",
			rejectWaiting: "Reject this request",
			rejectHint: "You can add a reject description. The model will see it. Leave empty to reject without a note.",
			rejectPlaceholder: "Reject description (optional)",
			rejectConfirm: "Confirm reject",
			rejectBack: "Back",
			"reject.aria": "Reject description"
		};
		//#endregion
		//#region src/client/pending.ts
		/**
		* 判断当前 composer pending 是不是原生审批.
		* @param value - conversation.composer 的 pendingInteraction.
		*/
		function isPendingApproval(value) {
			if (typeof value !== "object" || value === null) return false;
			const item = value;
			return item.kind === "approval" && typeof item.key === "string" && typeof item.sessionId === "string" && typeof item.toolName === "string" && typeof item.answer === "function";
		}
		//#endregion
		//#region src/client/command.ts
		const COMMAND_ARGS_KEY = "command";
		/**
		* 从 chat 快照里取与本次审批关联的工具调用命令.
		* 结构与 `@deepseek-ai/dsh-client-ui-chat` 的 ApprovalCommand 一致; 取不到就
		* 不显示命令, 不允许影响卡片本身.
		* @param snapshot - useChat 传入的 chat 快照.
		* @param callId - 关联的工具调用 id.
		* @returns 命令文本, 或 `undefined`.
		*/
		function commandOf(snapshot, callId) {
			if (typeof snapshot !== "object" || snapshot === null) return void 0;
			const nodes = snapshot.nodes;
			if (typeof nodes !== "object" || nodes === null) return void 0;
			const values = nodes.values;
			if (typeof values !== "function") return void 0;
			for (const node of values.call(nodes)) {
				if (typeof node !== "object" || node === null) continue;
				const entry = node;
				if (entry.kind !== "tool-call") continue;
				const root = entry.data?.root;
				if (typeof root !== "object" || root === null) continue;
				const call = root;
				if (call.callId !== callId || "kind" in call) continue;
				if (typeof call.argsRaw !== "string") return void 0;
				try {
					const args = JSON.parse(call.argsRaw);
					return typeof args[COMMAND_ARGS_KEY] === "string" ? args[COMMAND_ARGS_KEY] : void 0;
				} catch {
					return;
				}
			}
		}
		//#endregion
		//#region src/client/RejectPanel.tsx
		/**
		* 原生提权窗口的接管实现: 允许一次仍直接放行, 拒绝则进入同款拒绝窗口填写描述.
		*/
		let recordReject = async () => {
			throw new Error("dsh-reject-message: remote is not mounted");
		};
		/**
		* 绑定 Host Remote. 插件卸载时清掉, 避免窗口把描述打到已销毁的通道.
		* @param next - 当前可用的记录函数, 或 `undefined`.
		*/
		function setRecordReject(next) {
			recordReject = next ?? (async () => {
				throw new Error("dsh-reject-message: remote is not mounted");
			});
		}
		/** 有 chat 读数时才挂载, 组件内部无条件调用 hook. */
		function CommandDetail({ callId, useChat }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: useChat((snapshot) => commandOf(snapshot, callId)) });
		}
		/**
		* 渲染一次审批, 并在拒绝时切换到描述窗口.
		* @param props - composer chain 选中的审批.
		*/
		function RejectPanel(props) {
			const approval = props.matched;
			const detail = approval.callId === void 0 || props.useChat === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CommandDetail, {
				callId: approval.callId,
				useChat: props.useChat
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RejectFlow, {
				pending: approval,
				detail,
				t: props.t
			}, approval.key);
		}
		function RejectFlow({ pending, detail, t }) {
			const [phase, setPhase] = (0, react.useState)("ask");
			const [note, setNote] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const noteRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (phase !== "reject") return;
				noteRef.current?.focus();
			}, [phase]);
			const finish = (outcome, run) => {
				setBusy(true);
				(async () => {
					try {
						if (run !== void 0) await run();
						await pending.answer(outcome);
					} catch {
						setBusy(false);
					}
				})();
			};
			const confirmReject = () => {
				const message = normalizeRejectMessage(note);
				finish("rejected", message === void 0 ? void 0 : async () => {
					try {
						await recordReject({
							sessionId: pending.sessionId,
							toolName: pending.toolName,
							message,
							...pending.callId === void 0 ? {} : { callId: pending.callId }
						});
					} catch {}
				});
			};
			const onNoteKey = (event) => {
				if (event.key !== "Enter" || !event.metaKey && !event.ctrlKey) return;
				event.preventDefault();
				if (!busy) confirmReject();
			};
			if (phase === "reject") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "drm-root",
				"data-approval-key": pending.key,
				"data-reject-mode": "",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "drm-card",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "drm-strip",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "drm-dot" }), t("rejectWaiting")]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "drm-body",
							"data-approval-scroll": "",
							tabIndex: 0,
							role: "group",
							"aria-label": t("reject.aria"),
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "drm-headline",
									children: pending.reason ?? t("escalation", { toolName: pending.toolName })
								}),
								detail !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "drm-command",
									children: detail
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "drm-hint",
									children: t("rejectHint")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
									ref: noteRef,
									className: "drm-note",
									value: note,
									disabled: busy,
									placeholder: t("rejectPlaceholder"),
									onChange: (event) => {
										setNote(event.currentTarget.value);
									},
									onKeyDown: onNoteKey
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "drm-actions",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "drm-btn drm-btn-outline",
								disabled: busy,
								onClick: () => {
									setPhase("ask");
								},
								children: t("rejectBack")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "drm-btn drm-btn-outline drm-btn-reject",
								disabled: busy,
								onClick: confirmReject,
								children: t("rejectConfirm")
							})]
						})
					]
				})
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "drm-root",
				"data-approval-key": pending.key,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "drm-card",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "drm-strip",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "drm-dot" }), t("waiting")]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "drm-body",
							"data-approval-scroll": "",
							tabIndex: 0,
							role: "group",
							"aria-label": t("detail.aria"),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "drm-headline",
								children: pending.reason ?? t("escalation", { toolName: pending.toolName })
							}), detail !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "drm-command",
								children: detail
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "drm-actions",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "drm-btn drm-btn-outline drm-btn-reject",
								disabled: busy,
								onClick: () => {
									setPhase("reject");
								},
								children: t("reject")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "drm-btn drm-btn-primary",
								disabled: busy,
								onClick: () => {
									finish("allowed-once");
								},
								children: t("allowOnce")
							})]
						})
					]
				})
			});
		}
		//#endregion
		//#region src/client/styles.ts
		/** 原生提权窗口同款卡片, 外加拒绝描述输入. */
		const CSS_TEXT = `
.drm-root {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px calc(var(--dsh-composer-side-clearance) + 16px) 12px;
}
.drm-card {
  overflow: hidden;
  width: 100%;
  max-width: var(--dsh-chat-content-width);
  border: 1px solid var(--dsw-alias-state-warn-secondary);
  border-radius: 20px;
  background: var(--dsw-specific-input-major);
  box-shadow: var(--dsw-shadow-lv2);
  --dsh-scrollbar-thumb: var(--dsw-alias-scrollbar-bg-l2);
  --dsh-scrollbar-thumb-hover: var(--dsw-alias-scrollbar-hover-l2);
}
.drm-root[data-reject-mode] .drm-card {
  border-color: var(--dsw-alias-state-error-secondary, var(--dsw-alias-state-warn-secondary));
}
.drm-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--dsw-alias-state-warn-tertiary);
  color: var(--dsw-alias-state-warn-primary);
  font-size: 13px;
  line-height: 18px;
}
.drm-root[data-reject-mode] .drm-strip {
  background: var(--dsw-alias-state-error-tertiary, var(--dsw-alias-state-warn-tertiary));
  color: var(--dsw-alias-state-error-primary, var(--dsw-alias-state-warn-primary));
}
.drm-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dsw-alias-state-warn-primary);
}
.drm-root[data-reject-mode] .drm-dot {
  background: var(--dsw-alias-state-error-primary, var(--dsw-alias-state-warn-primary));
}
.drm-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-sizing: border-box;
  max-height: var(--dsh-composer-text-max-height);
  overflow-y: auto;
  padding: 12px 16px 0;
}
.drm-headline {
  color: var(--dsw-alias-label-primary);
  font-size: 15px;
  font-weight: 500;
  line-height: 24px;
}
.drm-command {
  color: var(--dsw-alias-label-tertiary);
  font-family: var(--ds-font-family-code);
  font-size: 13px;
  line-height: 20px;
  white-space: pre-wrap;
  word-break: break-all;
}
.drm-hint {
  color: var(--dsw-alias-label-tertiary);
  font-size: 13px;
  line-height: 20px;
}
.drm-note {
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-height: 88px;
  margin: 4px 0 8px;
  padding: 10px 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-3);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  resize: vertical;
}
.drm-note:focus-visible {
  outline: none;
  border-color: var(--dsw-alias-brand-primary);
}
.drm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 16px;
}
.drm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 14px;
  border: none;
  border-radius: 18px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  cursor: pointer;
  font-size: 14px;
  line-height: 22px;
}
.drm-btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
.drm-btn-outline {
  border: 0.5px solid var(--dsw-alias-border-l3);
  background: transparent;
}
.drm-btn-outline:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover);
}
.drm-btn-primary {
  background: var(--dsw-alias-button-primary-fill);
  color: var(--dsw-alias-label-primary-foreground);
}
.drm-btn-primary:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover);
}
.drm-btn-reject:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover-danger);
  color: var(--dsw-alias-state-error-primary);
  border-color: transparent;
}
`;
		/** 把拒绝窗口样式注入 document.head, 重复加载时跳过. */
		function injectStyles() {
			if (typeof document === "undefined") return;
			if (document.querySelector(`style[data-plugin-css="dsh-reject-message"]`) !== null) return;
			const style = document.createElement("style");
			style.setAttribute(STYLE_ATTR, STYLE_ID);
			style.textContent = CSS_TEXT;
			document.head.appendChild(style);
		}
		//#endregion
		//#region src/client/index.ts
		/**
		* dsh-reject-message 浏览器半区.
		*
		* 以低于原生 ui-approval 的 composer 优先级接管 PendingApproval, 复用同一张
		* 提权卡片; 点拒绝后切到可填写描述的拒绝窗口, 再经 Remote 交给 Host.
		*/
		const NS = PLUGIN_NAME;
		const inject = [
			"slots",
			"locale",
			"remote"
		];
		function unwrapRecorded(result) {
			if (result.ok === true) return;
			throw new Error(result.error.message);
		}
		/**
		* 注入样式, 注册拒绝窗口文案, 接管审批 composer, 并挂上 Remote.
		* @param ctx - Web Client 插件上下文.
		*/
		function apply(ctx) {
			ctx.logger.info("%s: client applying", PLUGIN_NAME);
			injectStyles();
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), `${PLUGIN_NAME}: dictionaries`);
			ctx.slots.inject("conversation.composer", () => ctx.slots.register({
				name: "conversation.composer",
				priority: 0,
				select: ({ pendingInteraction }) => isPendingApproval(pendingInteraction) ? pendingInteraction : null,
				locale: NS
			}, RejectPanel));
			ctx.effect(async () => {
				const dispose = await ctx.remote.$mount(REJECT_REMOTE_CONTRIBUTION);
				const face = ctx.reflect.get(`remote.${REMOTE_NAMESPACE}`);
				if (face === void 0) throw new Error(`${PLUGIN_NAME}: Remote did not mount`);
				setRecordReject(async (args) => {
					try {
						unwrapRecorded(await face.record(args));
					} catch (error) {
						ctx.logger.warn("%s: record failed: %s", PLUGIN_NAME, error);
					}
				});
				ctx.logger.info("%s: remote mounted", PLUGIN_NAME);
				return () => {
					setRecordReject(void 0);
					dispose();
				};
			}, `${PLUGIN_NAME}: remote`);
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map