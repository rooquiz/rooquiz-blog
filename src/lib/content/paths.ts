import path from 'node:path'

import { CONTENT_LOCALE } from '@config'

/** 构建前置同步的落地目录。gitignore，每次 pnpm sync 重建。 */
export const CONTENT_DIR = path.join(process.cwd(), '.content')

export const INDEX_FILE = path.join(CONTENT_DIR, 'index.json')

/** 增量同步用的清单：记录每个对象上次同步时的 content_hash */
export const MANIFEST_FILE = path.join(CONTENT_DIR, 'manifest.json')

/**
 * Storage 对象路径 / .content 相对路径，两处必须一致。
 * 沿用 rooquiz-payload 的做法：key 前缀只有这一个来源，签发端与读取端共用。
 *
 * **`posts/en/` 这一段留着不是为了将来做多语言，而是为了不给已有对象改名。**
 * 站点侧已经没有语言概念了（见 site.config.ts），但 Storage 里的对象是既成事实，
 * 前缀一改，所有已发布文章的 key 就全变了。`CONTENT_LOCALE` 恒为 'en'。
 */
export function postObjectPath(slug: string): string {
  return `posts/${CONTENT_LOCALE}/${slug}.mdx`
}

/** 文章配图在 blog-media 里的前缀，按 translationKey 归拢 */
export function mediaObjectPrefix(translationKey: string): string {
  return `images/${translationKey}`
}
