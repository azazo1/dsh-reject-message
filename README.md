# dsh-reject-message

DeepSeek Harness Web 插件: 接管原生提权窗口, 并在原生 plan 审查卡上补一个拒绝入口. 拒绝时可以填写描述, 模型会看到这段话.

原生审批点 "拒绝" 只会回一条固定的 `rejected`, 模型不知道为什么被拒. 本插件用同一张提权卡片接住这次询问, 点拒绝后切到同款拒绝窗口, 描述可选; 留空则行为和原生拒绝一样.

plan 审查卡原生没有拒绝输入框. 本插件不重画这张卡: 卡片, 摘要, 右侧栏里的完整计划, "去聊天里说" / "确认执行" 都由原生渲染, 插件只在卡上多挂一个拒绝入口, 点开弹窗填写描述; 描述走 `exit_plan_mode` 的 Keep planning `custom`, 不是提权那条 post-execute.

## 效果

- 提权卡片的等待条, 标题, 工具详情, "拒绝" / "允许一次" 都用原生原子组件与原生窗口排布, Enter 允许一次, Escape 进入拒绝窗口.
- 点拒绝不会立刻结束审批, 而是进入拒绝窗口, 仍展示原来的原因和命令, 并多一个描述输入框.
- 确认拒绝后, Host 把描述追加到该次工具的错误结果, 并挂一条 plugin additionalContext.
- 返回可以回到提权窗口. 允许一次仍直接放行.
- plan 审查卡外观完全跟随原生: 摘要, 完整计划预览, 侧栏自动打开都不受影响, 插件只在卡上多一个 "拒绝" 入口; 弹窗留空等于原生 Keep planning.

## 安装

Web 端装进 `web` profile:

```shell
dsh plugin --profile web add azazo1/dsh-reject-message
```

固定版本:

```shell
dsh plugin --profile web add azazo1/dsh-reject-message#v0.1.0
```

本地目录:

```shell
dsh plugin --profile web add "link:$(pwd)"
```

装完重启 `dsh web`, 浏览器里刷新一次页面. 卸载: `dsh plugin --profile web remove dsh-reject-message`.

桌面端装进 `desktop` profile. 它由 Electron 应用独占管理, `dsh plugin` 会拒绝 `--profile desktop`, 所以要用应用内的插件管理器: 在插件页的安装入口填上面命令里对应的包名或本地目录. 装上后重启应用, 窗口刷新一次.

引擎版本线要求 `@deepseek-ai/dsh-*` 不低于 `0.1.7-rc.2`, 且仍在 `0.1.x` 上 (peerDependencies 与 devDependencies 都写作 `>=0.1.7-rc.2 <0.2.0`). 更早的引擎线装不上这个版本.

web 与 desktop 两个 profile 跑的是同一套 Web 应用, 桌面端只是多起一个 Host 子进程并给 `<html>` 打上平台标记, 所以同一份包在两边通用, 不需要分别构建.

开发检查: `just verify`.

## 配置

`cordis.patch.yml` 行配置:

| 键 | 默认 | 说明 |
| --- | --- | --- |
| `maxLength` | `4000` | 拒绝描述最大字符数 |

## 实现

Client 以 `conversation.composer` 优先级 `-1` 只接管 `kind === 'approval'`; 遇到标准二选一的 `kind === 'plan-review'` 时先登记这次 pending, 再返回 `null` 让原生 `ui-user-questions` 渲染原生审查卡. 插件另注册 `conversation.plan-review.actions` 里的拒绝入口, 按卡片的 `requestKey` 取回 pending 提交答案. 提权拒绝走 Host `rejectMessage/record` 和 `tools/post-execute`; plan 拒绝把描述放进 questions 答案的 `custom`. 审批和审查生命周期仍由原生 waterfall 负责.
