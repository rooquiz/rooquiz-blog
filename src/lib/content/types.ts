/** 一篇文章的索引元数据。构建期从 Postgres（或本地样例的 frontmatter）投影而来。 */
export interface PostMeta {
  slug: string
  /**
   * 早先驱动 hreflang 的跨语言分组键。站点只有英文之后它对页面已经没用了，
   * **但不能删** —— 文章配图在 Storage 里是按它归拢的
   * （`mediaObjectPrefix()`，见 paths.ts），删掉就得给已有对象改名。
   */
  translationKey: string
  title: string
  summary: string
  coverUrl: string | null
  tags: string[]
  author: string
  /** ISO 字符串。本地样例里可能缺失，用文件 mtime 兜底 */
  publishedAt: string
  /**
   * 最后一次改动时间（Postgres 的 `updated_at`，由触发器维护）。
   * 驱动 JSON-LD 的 `dateModified`、sitemap 的 `lastmod` 与 og:modified_time ——
   * 搜索引擎与 AI 检索都用它判断一篇旧文是不是还在被维护。
   * 库里没有（本地样例）就退回 publishedAt，**不要留空**：缺 lastmod 的条目
   * 会被当成「从未更新」，比写一个等于发布时间的值更差。
   */
  updatedAt: string
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
