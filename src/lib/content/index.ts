import fs from 'node:fs/promises'
import path from 'node:path'
import { cache } from 'react'

import { DEFAULT_LOCALE, LOCALES, type Locale } from '@config'

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

/** 某语言下的全部文章，按发布时间倒序 */
export const getAllPosts = cache(async (locale: Locale): Promise<PostMeta[]> => {
  const index = await loadIndex()
  return index.posts.filter(post => post.locale === locale).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
})

export const getPost = cache(async (locale: Locale, slug: string): Promise<PostMeta | null> => {
  const index = await loadIndex()
  return index.posts.find(post => post.locale === locale && post.slug === slug) ?? null
})

/** 全部 locale × slug 组合，供 generateStaticParams 用 */
export const getAllPostParams = cache(async (): Promise<{ locale: Locale; slug: string }[]> => {
  const index = await loadIndex()
  return index.posts.map(post => ({ locale: post.locale, slug: post.slug }))
})

/**
 * 同一篇文章的其它语言版本，用于 hreflang。
 * 找不到对应语言就不输出那条 alternate —— 宁可少一条，也不要指向 404。
 */
export const getTranslations = cache(async (translationKey: string): Promise<Partial<Record<Locale, string>>> => {
  const index = await loadIndex()
  const result: Partial<Record<Locale, string>> = {}
  for (const post of index.posts) {
    if (post.translationKey === translationKey) result[post.locale] = post.slug
  }
  return result
})

/** 某语言下的标签及其文章数，按文章数倒序 */
export const getAllTags = cache(async (locale: Locale): Promise<{ tag: string; count: number }[]> => {
  const posts = await getAllPosts(locale)
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
})

export const getPostsByTag = cache(async (locale: Locale, tag: string): Promise<PostMeta[]> => {
  const posts = await getAllPosts(locale)
  return posts.filter(post => post.tags.includes(tag))
})

/** 读一篇文章的 MDX 原文（含 frontmatter） */
export async function readPostSource(post: PostMeta): Promise<string> {
  return fs.readFile(path.join(CONTENT_DIR, post.contentPath), 'utf8')
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

/** 拼站内路径，永远带 locale 前缀 —— docs 仓在这上面踩过坑（内链丢 locale 直接 404） */
export function localePath(locale: Locale, ...segments: string[]): string {
  const tail = segments.filter(Boolean).join('/')
  return tail ? `/${locale}/${tail}` : `/${locale}`
}

export { DEFAULT_LOCALE, LOCALES }
export type { Locale, PostMeta }

/**
 * 同一语言下的相邻文章（按发布时间倒序的前后邻居），供文章页底部的上一篇 / 下一篇。
 * 列表已经排过序，这里只取下标 —— 不重新排，免得两处排序规则漂移。
 */
export const getNeighbours = cache(
  async (locale: Locale, slug: string): Promise<{ previous: PostMeta | null; next: PostMeta | null }> => {
    const posts = await getAllPosts(locale)
    const index = posts.findIndex(post => post.slug === slug)
    if (index < 0) return { previous: null, next: null }
    return {
      // 倒序列表里「下标更小」是更新的一篇
      next: posts[index - 1] ?? null,
      previous: posts[index + 1] ?? null,
    }
  },
)
