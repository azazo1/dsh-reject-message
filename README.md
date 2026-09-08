# dsh-reject-message

DeepSeek Harness Web 插件: 接管原生提权窗口, 拒绝时可以填写描述, 模型会在工具结果里看到这段话.

原生审批点 "拒绝" 只会回一条固定的 `rejected`, 模型不知道为什么被拒. 本插件用同一张提权卡片接住这次询问, 点拒绝后切到同款拒绝窗口, 描述可选; 留空则行为和原生拒绝一样.

## 效果

- 提权卡片的等待条, 标题, 工具详情, "拒绝" / "允许一次" 都按原生窗口排布.
- 点拒绝不会立刻结束审批, 而是进入拒绝窗口, 仍展示原来的原因和命令, 并多一个描述输入框.
- 确认拒绝后, Host 把描述追加到该次工具的错误结果, 并挂一条 plugin additionalContext.
- 返回可以回到提权窗口. 允许一次仍直接放行.

## 安装

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

装完重启 `dsh web`. 卸载: `dsh plugin --profile web remove dsh-reject-message`.

开发检查: `just verify`.

## 配置

`cordis.patch.yml` 行配置:

| 键 | 默认 | 说明 |
| --- | --- | --- |
| `maxLength` | `4000` | 拒绝描述最大字符数 |

## 实现

Client 以 `conversation.composer` 优先级 `0` 抢在原生 `ui-approval` (`priority: 1`) 前面选中 `kind === 'approval'` 的 pending. Host 暴露 `rejectMessage/record`, 在 `tools/post-execute` 取出描述并写进模型可见结果. 审批生命周期仍由原生 waterfall 负责.
