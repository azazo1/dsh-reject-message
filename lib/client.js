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
				plan: question.detail,
				approveLabel,
				declineLabel
			};
		}
		/**
		* composer 入口: 提权审批或标准 plan-review, 其余交给下游.
		* @param value - conversation.composer 的 pendingInteraction.
		*/
		function selectComposerPending(value) {
			if (isPendingApproval(value)) return value;
			return parsePlanReview(value)?.pending ?? null;
		}
		/**
		* 组装确认执行的答案, 不带 custom.
		* @param reviewId - 审查问题 id.
		* @param approveLabel - 确认执行的 option label.
		*/
		function approvePlanAnswer(reviewId, approveLabel) {
			return { answers: [{
				id: reviewId,
				selected: [approveLabel]
			}] };
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
		//#region src/client/PlanRejectPanel.tsx
		/**
		* 原生 plan-review 卡片的接管: 确认执行和去聊天里说仍直接结算,
		* 拒绝则进入同款窗口填写描述, 经 questions 的 custom 交给模型.
		*/
		/** 原生审查卡 "去聊天里说" 用的 14px 编辑图标. */
		function DiscussIcon() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				width: 14,
				height: 14,
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M9.94076 1.34942C10.7047 0.90231 11.6503 0.902415 12.4143 1.34942C12.7061 1.52015 12.9688 1.79118 13.3104 2.13284C13.6521 2.47448 13.9231 2.73721 14.0939 3.02894C14.5408 3.79294 14.5409 4.73856 14.0939 5.50251C13.9231 5.79415 13.652 6.05704 13.3104 6.39861L6.65932 13.0497C6.28068 13.4284 6.00695 13.7108 5.66543 13.9097C5.32391 14.1085 4.94315 14.2074 4.42705 14.3498L3.24394 14.6761C2.77527 14.8054 2.34538 14.9262 2.00131 14.9684C1.65196 15.0112 1.17964 15.0013 0.810764 14.6325C0.441921 14.2637 0.432107 13.7913 0.47486 13.442C0.517035 13.0979 0.6379 12.668 0.767181 12.1993L1.09352 11.0162C1.23588 10.5001 1.33481 10.1193 1.5336 9.77784C1.7325 9.43632 2.0149 9.1626 2.39355 8.78395L9.04466 2.13284C9.38625 1.79126 9.64911 1.52016 9.94076 1.34942ZM15.5427 14.8398H7.55223L8.96707 13.425H15.5427V14.8398ZM3.39382 9.78422C2.965 10.213 2.84244 10.3436 2.75709 10.49C2.67183 10.6366 2.61862 10.8079 2.45733 11.3925L2.13099 12.5756C2.00183 13.0439 1.92194 13.3419 1.88863 13.5536C2.10041 13.5204 2.39872 13.4416 2.86764 13.3123L4.05075 12.9859C4.63544 12.8246 4.80669 12.7715 4.95323 12.6862C5.09968 12.6008 5.23022 12.4783 5.65905 12.0494L10.721 6.98644L8.45577 4.72121L3.39382 9.78422ZM11.7 2.57079C11.3774 2.38198 10.9777 2.38198 10.6551 2.57079C10.5602 2.62647 10.4487 2.72931 10.0449 3.13311L9.45604 3.72094L11.7213 5.98617L12.3102 5.39833C12.7139 4.99457 12.8168 4.88307 12.8725 4.78818C13.0613 4.46561 13.0612 4.06585 12.8725 3.74326C12.8169 3.64827 12.7146 3.53752 12.3102 3.13311C11.9057 2.72863 11.795 2.6264 11.7 2.57079Z",
					fill: "currentColor"
				})
			});
		}
		/**
		* 渲染一次 plan 审查, 并在拒绝时切换到描述窗口.
		* @param props - composer chain 选中的 plan-review.
		*/
		function PlanRejectPanel(props) {
			const parsed = parsePlanReview(props.matched);
			if (parsed === void 0) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PlanRejectFlow, {
				pending: parsed.pending,
				reviewId: parsed.reviewId,
				plan: parsed.plan,
				approveLabel: parsed.approveLabel,
				declineLabel: parsed.declineLabel,
				t: props.t
			}, parsed.pending.key);
		}
		function PlanRejectFlow({ pending, reviewId, plan, approveLabel, declineLabel, t }) {
			const [phase, setPhase] = (0, react.useState)("ask");
			const [note, setNote] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const noteRef = (0, react.useRef)(null);
			const markdownLabels = (0, react.useMemo)(() => ({
				code: {
					copyLabel: t("copy"),
					copiedLabel: t("copied")
				},
				footnotes: t("markdown.footnotes")
			}), [t]);
			(0, react.useEffect)(() => {
				if (phase !== "reject") return;
				noteRef.current?.focus();
			}, [phase]);
			const finish = (run) => {
				setBusy(true);
				(async () => {
					try {
						await run();
					} catch {
						setBusy(false);
					}
				})();
			};
			const confirmReject = () => {
				const message = normalizeRejectMessage(note);
				finish(() => pending.answer(keepPlanningAnswer(reviewId, declineLabel, message)));
			};
			const onNoteKey = (event) => {
				if (event.key !== "Enter" || !event.metaKey && !event.ctrlKey) return;
				event.preventDefault();
				if (!busy) confirmReject();
			};
			const planBody = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "drm-plan",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, {
					text: plan,
					labels: markdownLabels
				})
			});
			if (phase === "reject") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "drm-root",
				"data-plan-review-key": pending.key,
				"data-reject-mode": "",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "drm-card",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "drm-strip",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "drm-dot" }), t("plan.rejectWaiting")]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "drm-body",
							"data-plan-review-scroll": "",
							tabIndex: 0,
							role: "group",
							"aria-label": t("plan.reject.aria"),
							children: [
								planBody,
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "drm-hint",
									children: t("plan.rejectHint")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
									ref: noteRef,
									className: "drm-note",
									value: note,
									disabled: busy,
									placeholder: t("plan.rejectPlaceholder"),
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
				"data-plan-review-key": pending.key,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "drm-card",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "drm-strip",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "drm-dot" }), t("plan.header")]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "drm-body",
							"data-plan-review-scroll": "",
							tabIndex: 0,
							role: "group",
							"aria-label": t("plan.aria"),
							children: planBody
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "drm-actions",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "drm-btn drm-btn-discuss",
									disabled: busy,
									onClick: () => {
										finish(() => pending.cancel());
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(DiscussIcon, {}), t("plan.discuss")]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "drm-btn drm-btn-outline drm-btn-reject",
									disabled: busy,
									onClick: () => {
										setPhase("reject");
									},
									children: t("plan.decline")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "drm-btn drm-btn-primary",
									disabled: busy,
									onClick: () => {
										finish(() => pending.answer(approvePlanAnswer(reviewId, approveLabel)));
									},
									children: t("plan.approve")
								})
							]
						})
					]
				})
			});
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
		//#region src/client/ComposerPanel.tsx
		/**
		* conversation.composer 入口: 按 pending.kind 分到提权卡或 plan 审查卡.
		*/
		/**
		* 按 kind 渲染对应接管卡片.
		* @param props - composer chain 交给本插件的 props.
		*/
		function ComposerPanel(props) {
			if (props.matched.kind === "plan-review") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PlanRejectPanel, {
				matched: props.matched,
				t: props.t
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RejectPanel, {
				matched: props.matched,
				t: props.t,
				useChat: props.useChat
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** `dsh-reject-message` 命名空间文案. 审批步复用原生提权窗口用词, plan 步对齐原生审查卡. */
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
			"plan.header": "计划待审",
			"plan.approve": "确认执行",
			"plan.decline": "拒绝",
			"plan.discuss": "去聊天里说",
			"plan.aria": "计划内容",
			"plan.rejectWaiting": "拒绝此计划",
			"plan.rejectHint": "可填写拒绝原因, 模型会看到这段描述. 留空则按普通拒绝处理.",
			"plan.rejectPlaceholder": "拒绝原因 (可选)",
			"plan.reject.aria": "拒绝描述",
			copy: "复制",
			copied: "已复制",
			"markdown.footnotes": "脚注"
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
			"plan.header": "Plan review",
			"plan.approve": "Approve",
			"plan.decline": "Refuse",
			"plan.discuss": "Chat about it",
			"plan.aria": "Plan content",
			"plan.rejectWaiting": "Refuse this plan",
			"plan.rejectHint": "You can add a reject description. The model will see it. Leave empty to reject without a note.",
			"plan.rejectPlaceholder": "Reject description (optional)",
			"plan.reject.aria": "Reject description",
			copy: "Copy",
			copied: "Copied",
			"markdown.footnotes": "Footnotes"
		};
		//#endregion
		//#region src/client/styles.ts
		/** 原生提权 / plan 审查窗口同款卡片, 外加拒绝描述输入. */
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
.drm-plan {
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 22px;
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
.drm-root[data-plan-review-key] .drm-actions {
  padding: 8px 16px 12px;
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
.drm-btn-discuss {
  gap: 6px;
  color: var(--dsw-alias-label-secondary);
}
.drm-btn-discuss:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary);
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
		* 以低于原生 ui-approval / ui-user-questions 的 composer 优先级接管
		* PendingApproval 和 plan-review; 提权拒绝经 Remote 交给 Host, plan 拒绝
		* 走 questions 的 custom.
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
		* 注入样式, 注册拒绝窗口文案, 接管审批和 plan-review composer, 并挂上 Remote.
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
				select: ({ pendingInteraction }) => selectComposerPending(pendingInteraction),
				locale: NS
			}, ComposerPanel));
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