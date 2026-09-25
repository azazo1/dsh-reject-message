window.__ModuleLoader__.load({
	id: "dsh-reject-message",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/shared.ts
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
			const schema = { parse };
			return {
				mode: "strict",
				typeSymbol,
				create: () => schema
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
		/** `dsh-reject-message` 命名空间文案. 审批步复用原生提权窗口用词, plan 步只提供拒绝入口的用词. */
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
			"reject.aria": "拒绝描述",
			"plan.rejectAction": "拒绝",
			"plan.rejectTitle": "拒绝此计划",
			"plan.rejectHint": "可填写拒绝原因, 模型会看到这段描述. 留空则按 Keep planning 处理.",
			"plan.rejectPlaceholder": "拒绝原因 (可选)",
			"plan.rejectConfirm": "确认拒绝",
			"plan.rejectCancel": "取消",
			"plan.reject.aria": "拒绝描述"
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
			"reject.aria": "Reject description",
			"plan.rejectAction": "Refuse",
			"plan.rejectTitle": "Refuse this plan",
			"plan.rejectHint": "You can add a reject description. The model will see it. Leave empty to keep planning without a note.",
			"plan.rejectPlaceholder": "Reject description (optional)",
			"plan.rejectConfirm": "Confirm reject",
			"plan.rejectCancel": "Cancel",
			"plan.reject.aria": "Reject description"
		};
		//#endregion
		//#region src/client/pending.ts
		function asRecord(value) {
			if (typeof value !== "object" || value === null) return void 0;
			return value;
		}
		function optionLabel(value) {
			const item = asRecord(value);
			if (item === void 0) return void 0;
			return typeof item.label === "string" && item.label.length > 0 ? item.label : void 0;
		}
		/**
		* 判断当前 composer pending 是不是原生审批.
		* @param value - conversation.composer 的 pendingInteraction.
		*/
		function isPendingApproval(value) {
			if (typeof value !== "object" || value === null) return false;
			const item = value;
			return item.kind === "approval" && typeof item.key === "string" && typeof item.sessionId === "string" && typeof item.toolName === "string" && typeof item.answer === "function";
		}
		/**
		* 提取可接管的原生审批, 其余交给下游.
		* @param value - conversation.composer 的 pendingInteraction.
		*/
		function selectApproval(value) {
			return isPendingApproval(value) ? value : null;
		}
		/**
		* 从未知 pending 解析标准二选一的 plan-review.
		* 第三 option, multiSelect, 无 detail, 或只有 approve 时返回 undefined, 交给原生.
		* @param value - conversation.composer 的 pendingInteraction.
		*/
		function parsePlanReview(value) {
			const item = asRecord(value);
			if (item === void 0) return void 0;
			if (item.kind !== "plan-review") return void 0;
			if (typeof item.key !== "string" || typeof item.sessionId !== "string") return void 0;
			if (typeof item.answer !== "function" || typeof item.cancel !== "function") return void 0;
			if (!Array.isArray(item.questions) || item.questions.length !== 1) return void 0;
			const question = asRecord(item.questions[0]);
			if (question === void 0) return void 0;
			if (typeof question.id !== "string" || question.id.length === 0) return void 0;
			if (typeof question.detail !== "string") return void 0;
			if (question.multiSelect === true) return void 0;
			const intent = asRecord(question.intent);
			if (intent === void 0 || intent.kind !== "plan-review") return void 0;
			if (typeof intent.approve !== "string" || intent.approve.length === 0) return void 0;
			const options = Array.isArray(question.options) ? question.options : [];
			if (options.length > 2) return void 0;
			const labels = options.flatMap((option) => {
				const label = optionLabel(option);
				return label === void 0 ? [] : [label];
			});
			const approveLabel = labels.find((label) => label === intent.approve);
			const declineLabel = labels.find((label) => label !== intent.approve);
			if (approveLabel === void 0 || declineLabel === void 0) return void 0;
			return {
				pending: item,
				reviewId: question.id,
				declineLabel
			};
		}
		/**
		* 组装 Keep planning 的答案. 有描述才带 custom.
		* @param reviewId - 审查问题 id.
		* @param declineLabel - Keep planning 的 option label.
		* @param custom - 已经规范化的拒绝描述.
		*/
		function keepPlanningAnswer(reviewId, declineLabel, custom) {
			return { answers: [{
				id: reviewId,
				selected: [declineLabel],
				...custom === void 0 ? {} : { custom }
			}] };
		}
		//#endregion
		//#region src/client/plan-pending.ts
		/**
		* plan 审查 pending 的登记表与 composer 路由.
		*
		* plan 卡由原生 PlanReviewPanel 渲染, 插件不再接管 conversation.composer 的
		* plan 分支. 选择器让位之前把当前 plan-review 记在这里, 原生卡上的拒绝入口
		* 再按 requestKey 取回同一个 pending, 以 Keep planning + custom 交回答案.
		*/
		const pendingByKey = /* @__PURE__ */ new Map();
		const keyBySession = /* @__PURE__ */ new Map();
		/**
		* 记下一次待审计划, 同一 session 只保留最新的一条.
		* @param sessionId - 审查所属会话.
		* @param pending - 原生 plan-review pending.
		*/
		function rememberPlanReview(sessionId, pending) {
			const previous = keyBySession.get(sessionId);
			if (previous !== void 0 && previous !== pending.key) pendingByKey.delete(previous);
			pendingByKey.set(pending.key, pending);
			keyBySession.set(sessionId, pending.key);
		}
		/**
		* 忘掉一个 session 的待审计划.
		* @param sessionId - 审查所属会话.
		*/
		function forgetPlanReview(sessionId) {
			const key = keyBySession.get(sessionId);
			if (key === void 0) return;
			pendingByKey.delete(key);
			keyBySession.delete(sessionId);
		}
		/**
		* 按渲染身份取回待审计划, 供原生卡上的拒绝入口提交答案.
		* @param requestKey - 原生审查卡的 requestKey, 即 pending.key.
		*/
		function planReviewPending(requestKey) {
			return pendingByKey.get(requestKey);
		}
		/**
		* composer chain 的路由: 只接管原生审批, plan-review 记录后让位给原生卡.
		* @param value - conversation.composer 的 pendingInteraction.
		* @param sessionId - 当前 composer 所属会话.
		* @returns 需要本插件渲染的审批, 或 `null` 表示交给下游.
		*/
		function routeComposerPending(value, sessionId) {
			const approval = selectApproval(value);
			if (approval !== null) {
				if (sessionId !== void 0) forgetPlanReview(sessionId);
				return approval;
			}
			const review = parsePlanReview(value);
			if (review !== void 0 && sessionId !== void 0) {
				rememberPlanReview(sessionId, review.pending);
				return null;
			}
			if (sessionId !== void 0) forgetPlanReview(sessionId);
			return null;
		}
		//#endregion
		//#region src/client/PlanRejectAction.tsx
		/**
		* 原生 plan 审查卡上的拒绝入口.
		*
		* 卡片本身由原生 PlanReviewPanel 渲染, 本插件只往
		* conversation.plan-review.actions 挂一个 entry: 点开后用弹窗填写描述,
		* 再以 Keep planning + custom 交回 user-questions.
		*/
		/**
		* 渲染原生卡上的拒绝入口; 拿不到对应 pending 或没有第二个选项时不出现.
		* @param props - actions slot 的 owner 份额与插件文案.
		*/
		function PlanRejectAction(props) {
			const decline = props.review.decline;
			const pending = planReviewPending(props.requestKey);
			if (decline === void 0 || pending === void 0) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PlanRejectDialog, {
				reviewId: props.review.id,
				declineLabel: decline.label,
				pending,
				t: props.t
			}, props.requestKey);
		}
		function PlanRejectDialog({ reviewId, declineLabel, pending, t }) {
			const [open, setOpen] = (0, react.useState)(false);
			const [note, setNote] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const waiting = (0, react.useRef)(false);
			const submit = () => {
				if (waiting.current) return;
				waiting.current = true;
				setBusy(true);
				setError(null);
				const message = normalizeRejectMessage(note);
				(async () => {
					try {
						await pending.answer(keepPlanningAnswer(reviewId, declineLabel, message));
						setOpen(false);
					} catch (cause) {
						waiting.current = false;
						setBusy(false);
						setError(cause instanceof Error ? cause.message : String(cause));
					}
				})();
			};
			const onNoteKey = (event) => {
				if (event.key !== "Enter" || !event.metaKey && !event.ctrlKey) return;
				event.preventDefault();
				submit();
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: "drm-plan-action",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "ghost",
					size: "sm",
					className: "drm-plan-reject",
					disabled: busy,
					onClick: () => {
						setOpen(true);
					},
					children: t("plan.rejectAction")
				})
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open,
				onClose: () => {
					if (!busy) setOpen(false);
				},
				title: t("plan.rejectTitle"),
				description: t("plan.rejectHint"),
				closeLabel: t("plan.rejectCancel"),
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					disabled: busy,
					onClick: () => {
						setOpen(false);
					},
					children: t("plan.rejectCancel")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					className: "drm-reject",
					disabled: busy,
					onClick: submit,
					children: t("plan.rejectConfirm")
				})] }),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
					className: "drm-note",
					value: note,
					disabled: busy,
					"data-modal-autofocus": "",
					"aria-label": t("plan.reject.aria"),
					placeholder: t("plan.rejectPlaceholder"),
					onChange: (event) => {
						setNote(event.currentTarget.value);
					},
					onKeyDown: onNoteKey
				}), error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "drm-error",
					children: error
				})]
			})] });
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
		* 卡片结构, 原子组件与键盘行为对齐原生 ApprovalPanel.
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
			const reason = approval.displayReason !== void 0 && props.resolveReason !== void 0 ? props.resolveReason(approval.displayReason) : approval.reason;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RejectFlow, {
				pending: approval,
				detail,
				reason,
				t: props.t
			}, approval.key);
		}
		function RejectFlow({ pending, detail, reason, t }) {
			const [phase, setPhase] = (0, react.useState)("ask");
			const [note, setNote] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const noteRef = (0, react.useRef)(null);
			const active = (0, react.useRef)(true);
			const waiting = (0, react.useRef)(false);
			const composing = (0, react.useRef)(false);
			const compositionEnded = (0, react.useRef)(false);
			(0, react.useEffect)(() => {
				active.current = true;
				return () => {
					active.current = false;
				};
			}, []);
			(0, react.useEffect)(() => {
				if (phase !== "reject") return;
				noteRef.current?.focus();
			}, [phase]);
			const answerable = pending.answerable !== false;
			const answer = (outcome, run) => {
				if (waiting.current || pending.answerable === false) return;
				waiting.current = true;
				setBusy(true);
				(async () => {
					try {
						if (run !== void 0) await run();
						await pending.answer(outcome);
					} catch {
						if (!active.current || pending.answerable === false) return;
						waiting.current = false;
						setBusy(false);
					}
				})();
			};
			const confirmReject = () => {
				const message = normalizeRejectMessage(note);
				answer("rejected", message === void 0 ? void 0 : async () => {
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
				confirmReject();
			};
			const keydown = (event) => {
				if (phase !== "ask") return;
				const element = event.target;
				if (event.defaultPrevented || !event.currentTarget.contains(document.activeElement) || element.closest("input, textarea, select, [contenteditable=\"true\"], [contenteditable=\"\"]") !== null) return;
				if (event.key !== "Enter" && event.key !== "Escape") return;
				if (event.key === "Enter" && element.closest("button, a[href], [role=\"button\"]") !== null) return;
				if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
				event.preventDefault();
				event.stopPropagation();
				if (event.repeat || composing.current || compositionEnded.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
				if (event.key === "Enter") answer("allowed-once");
				else setPhase("reject");
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
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: busy ? "ongoing" : "warning" }), t("rejectWaiting")]
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
									children: reason ?? t("escalation", { toolName: pending.toolName })
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
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								disabled: busy,
								onClick: () => {
									setPhase("ask");
								},
								children: t("rejectBack")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								className: "drm-reject",
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
				"aria-busy": busy,
				onKeyDown: keydown,
				onKeyUpCapture: () => {
					compositionEnded.current = false;
				},
				onCompositionStartCapture: () => {
					composing.current = true;
				},
				onCompositionEndCapture: () => {
					composing.current = false;
					compositionEnded.current = true;
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "drm-card",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "drm-strip",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: busy ? "ongoing" : "warning" }), t("waiting")]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "drm-body",
							"data-approval-scroll": "",
							tabIndex: 0,
							role: "group",
							"aria-label": t("detail.aria"),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "drm-headline",
								children: reason ?? t("escalation", { toolName: pending.toolName })
							}), detail !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "drm-command",
								children: detail
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "drm-actions",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								className: "drm-reject",
								disabled: busy || !answerable,
								onClick: () => {
									setPhase("reject");
								},
								children: t("reject")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "primary",
								disabled: busy || !answerable,
								onClick: () => {
									answer("allowed-once");
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
		/**
		* 原生提权卡同款骨架, 外加拒绝描述输入与 plan 卡上的拒绝入口.
		* 按钮与状态点用原生原子组件, 这里只保留卡片布局和原生没有的部分.
		*/
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
  border-radius: var(--dsw-radius-xl);
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
.drm-root .drm-reject:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover-danger);
  color: var(--dsw-alias-state-error-primary);
  border-color: transparent;
}
.drm-plan-action {
  display: inline-flex;
  align-items: center;
}
.drm-plan-action > button.drm-plan-reject {
  height: 24px;
  padding: 0 8px;
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
}
.drm-plan-action > button.drm-plan-reject:hover:not(:disabled) {
  color: var(--dsw-alias-state-error-primary);
}
.drm-error {
  margin: 8px 0 0;
  color: var(--dsw-alias-state-error-primary);
  font-size: 12px;
  line-height: 18px;
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
		* composer chain 只接管原生审批; plan 审查卡交回原生 PlanReviewPanel 渲染,
		* 插件只在它上面挂一个拒绝入口. 提权拒绝经 Remote 交给 Host, plan 拒绝走
		* questions 的 custom.
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
		* 注入样式, 注册拒绝窗口文案, 接管审批 composer, 挂上 plan 拒绝入口和 Remote.
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
				priority: -1,
				select: ({ pendingInteraction, sessionId }) => routeComposerPending(pendingInteraction, sessionId),
				locale: NS,
				inject: () => ({ resolveReason: (reason) => ctx.locale.resolveText(reason) })
			}, RejectPanel));
			ctx.slots.inject("conversation.plan-review.actions", () => ctx.slots.register({
				name: "conversation.plan-review.actions",
				id: PLUGIN_NAME,
				order: 10,
				locale: NS
			}, PlanRejectAction));
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