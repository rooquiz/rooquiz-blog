import path from 'node:path'

import type { Locale } from '@config'

/** 构建前置同步的落地目录。gitignore，每次 pnpm sync 重建。 */
export const CONTENT_DIR = path.join(process.cwd(), '.content')

export const INDEX_FILE = path.join(CONTENT_DIR, 'index.json')

/** 增量同步用的清单：记录每个对象上次同步时的 content_hash */
export const MANIFEST_FILE = path.join(CONTENT_DIR, 'manifest.json')

/**
 * Storage 对象路径 / .content 相对路径，两处必须一致。
 * 沿用 rooquiz-payload 的做法：key 前缀只有这一个来源，签发端与读取端共用。
 */
export function postObjectPath(locale: Locale, slug: string): string {
  return `posts/${locale}/${slug}.mdx`
}

/** 文章配图在 blog-media 里的前缀，按 translationKey 归拢，中英共用一套图 */
export function mediaObjectPrefix(translationKey: string): string {
  return `images/${translationKey}`
}
