import { STYLE_ATTR, STYLE_ID } from '../shared.ts'

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
`

/** 把拒绝窗口样式注入 document.head, 重复加载时跳过. */
export function injectStyles(): void {
  if (typeof document === 'undefined') return
  if (document.querySelector(`style[${STYLE_ATTR}="${STYLE_ID}"]`) !== null) return
  const style = document.createElement('style')
  style.setAttribute(STYLE_ATTR, STYLE_ID)
  style.textContent = CSS_TEXT
  document.head.appendChild(style)
}
