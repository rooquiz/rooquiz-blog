import type { Locale } from '@config'

/** 一篇文章的索引元数据。构建期从 Postgres（或本地样例的 frontmatter）投影而来。 */
export interface PostMeta {
  slug: string
  locale: Locale
  /** 同一篇文章跨语言的分组键，驱动 hreflang */
  translationKey: string
  title: string
  summary: string
  coverUrl: string | null
  tags: string[]
  author: string
  /** ISO 字符串。本地样例里可能缺失，用文件 mtime 兜底 */
  publishedAt: string
  readingMinutes: number
  /** 相对 .content/ 的 MDX 文件路径，形如 posts/en/xxx.mdx */
  contentPath: string
}

/** .content/index.json 的结构 */
export interface ContentIndex {
  generatedAt: string
  /** 内容来源：远端 Supabase 还是本地样例，构建日志里会打出来 */
  source: 'supabase' | 'samples'
  posts: PostMeta[]
}
