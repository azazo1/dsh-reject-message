import z from "@deepseek-ai/schemastery";
import { Context } from "@deepseek-ai/cordis";
//#region src/index.d.ts
declare const name = "dsh-reject-message";
declare const inject: string[];
/** 插件配置: 拒绝描述截断上限. */
interface Config {
  /** 拒绝描述最大字符数. */
  maxLength?: number;
}
/** Loader 校验用 schema. */
declare const Config: z<Config>;
/**
 * 挂上 Remote 和 post-execute 附加.
 * @param ctx - Host 插件上下文.
 * @param config - Loader 校验后的行配置.
 */
declare function apply(ctx: Context, config?: Config): void;
//#endregion
export { Config, apply, inject, name };
//# sourceMappingURL=index.d.ts.map