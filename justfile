# 列出可用的 recipe.
[private]
default:
    @just --list

# 安装项目依赖.
install:
    pnpm install

# 执行 TypeScript 类型检查, 不生成文件.
typecheck:
    pnpm exec tsc --noEmit

# 构建 Host ESM bundle 和类型声明.
build-host:
    pnpm exec tsdown --config tsdown.host.config.ts

# 构建 Web Client CJS factory bundle.
build-client:
    pnpm exec tsdown --config tsdown.client.config.ts

# 构建全部 Host 和 Client bundle.
build: build-host build-client

# 执行关键逻辑测试.
test:
    pnpm test

# 检查 Client loader 注册.
check-client:
    node scripts/check-client.mjs

# 类型检查, 构建, 测试, loader 检查和打包预览.
verify:
    just typecheck
    just build
    pnpm test
    just check-client
    pnpm pack --dry-run

# 删除生成的构建产物.
clean:
    rm -rf lib
