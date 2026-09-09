/**
 * 站内路径。**这个模块必须保持零依赖** —— 不许 import 任何碰 `node:` 的东西。
 *
 * 它单独成文件而不是待在 `lib/content/index.ts` 里，是因为客户端组件也要用它
 * （搜索结果的链接）。`lib/content` 会读 `.content/index.json`，因此 import 了
 * `node:fs/promises` 与 `node:path`；一个客户端组件只要从那里取一个纯字符串函数，
 * webpack 就会顺着依赖把 `node:fs` 拖进浏览器 bundle，构建直接失败
 * （`UnhandledSchemeError: Reading from "node:fs/promises" is not handled`）。踩过一次。
 *
 * 所以 `lib/content` 里**刻意不再 re-export** 这个函数 —— 留个转发口就等着下次再踩。
 */

/**
 * 拼站内路径。**别手拼字符串** —— 站内链接统一从这里出，
 * 将来路径形状再变（前缀、子目录）只改这一处。
 *
 * 早先它叫 `localePath(locale, ...)`、永远带 `/en` 前缀；去掉多语言之后
 * 一并改了名，好让每个调用点都被编译器逼着看一眼，而不是悄悄换掉语义。
 */
export function sitePath(...segments: string[]): string {
  const tail = segments.filter(Boolean).join('/')
  return tail ? `/${tail}` : '/'
}
