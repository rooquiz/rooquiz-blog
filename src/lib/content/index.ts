import fs from 'node:fs/promises'
import path from 'node:path'
import { cache } from 'react'

import { CONTENT_DIR, INDEX_FILE } from './paths'
import type { ContentIndex, PostMeta } from './types'

/**
 * 读 .content/index.json —— 由 pnpm sync 生成。
 * cache() 保证一次构建里只读一次盘，列表页 / 详情页 / OG 图 / feed 共用同一份。
 */
const loadIndex = cache(async (): Promise<ContentIndex> => {
  try {
    return JSON.parse(await fs.readFile(INDEX_FILE, 'utf8')) as ContentIndex
  } catch {
    throw new Error('.content/index.json 不存在。先跑 `pnpm sync`（`pnpm build` 会自动跑）。')
  }
})

export const getContentSource = cache(async () => (await loadIndex()).source)

/** 全部文章，按发布时间倒序 */
export const getAllPosts = cache(async (): Promise<PostMeta[]> => {
  const index = await loadIndex()
  return [...index.posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
})

export const getPost = cache(async (slug: string): Promise<PostMeta | null> => {
  const index = await loadIndex()
  return index.posts.find(post => post.slug === slug) ?? null
})

/** 全部 slug，供 generateStaticParams 用 */
export const getAllPostParams = cache(async (): Promise<{ slug: string }[]> => {
  const index = await loadIndex()
  return index.posts.map(post => ({ slug: post.slug }))
})

/** 标签及其文章数，按文章数倒序 */
export const getAllTags = cache(async (): Promise<{ tag: string; count: number }[]> => {
  const posts = await getAllPosts()
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
})

export const getPostsByTag = cache(async (tag: string): Promise<PostMeta[]> => {
  const posts = await getAllPosts()
  return posts.filter(post => post.tags.includes(tag))
})

/** 读一篇文章的 MDX 原文（含 frontmatter） */
export async function readPostSource(post: PostMeta): Promise<string> {
  return fs.readFile(path.join(CONTENT_DIR, post.contentPath), 'utf8')
}

/* `sitePath()` 刻意不在这个文件里，也不从这里 re-export —— 见 lib/routes.ts 的说明：
   本模块 import 了 node:fs，客户端组件从这里取任何东西都会把它拖进浏览器 bundle。 */

export type { PostMeta }

/**
 * 相邻文章（按发布时间倒序的前后邻居），供文章页底部的上一篇 / 下一篇。
 * 列表已经排过序，这里只取下标 —— 不重新排，免得两处排序规则漂移。
 */
export const getNeighbours = cache(
  async (slug: string): Promise<{ previous: PostMeta | null; next: PostMeta | null }> => {
    const posts = await getAllPosts()
    const index = posts.findIndex(post => post.slug === slug)
    if (index < 0) return { previous: null, next: null }
    return {
      // 倒序列表里「下标更小」是更新的一篇
      next: posts[index - 1] ?? null,
      previous: posts[index + 1] ?? null,
    }
  },
)
