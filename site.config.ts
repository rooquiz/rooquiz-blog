/**
 * 站点级配置。内容与代码分离，改文案不用翻组件。
 * 参照 topic-coaching 的 site.config.ts 范式。
 */

export const LOCALES = ['en', 'zh'] as const
export type Locale = (typeof LOCALES)[number]

/** 英文为主：根路径与找不到语言偏好时都落到 en */
export const DEFAULT_LOCALE: Locale = 'en'

export const site = {
  name: 'RooQuiz Blog',
  /** 每种语言一套站点级文案，用于 metadata 与 OG 图 */
  locales: {
    en: {
      title: 'RooQuiz Blog',
      tagline: 'Quiz marketing, lead generation, and assessment design for coaches and creators.',
      description:
        'Practical guides on building quizzes that capture leads, spark shares, and turn curiosity into customers.',
    },
    zh: {
      title: 'RooQuiz 博客',
      tagline: '面向教练与知识创作者的测评营销、获客与题目设计。',
      description: '关于如何用测评抓取线索、激发传播、把好奇心变成客户的实践指南。',
    },
  },
  /** 列表页每页文章数 */
  pageSize: 12,
  /** JSON-LD 里 Organization 的稳定实体标识，与 topic-coaching 共用同一个 @id */
  organization: {
    url: 'https://rooquiz.com',
    id: 'https://rooquiz.com/#organization',
    name: 'RooQuiz',
  },
  defaultAuthor: 'RooQuiz Team',
} as const

/**
 * 与文章 slug 争同一段路径的保留字（/[locale]/[slug] 会和 /[locale]/tags 撞车）。
 * 写入 API 校验时拒绝这些 slug —— 沿用 rooquiz-payload 的 reservedFormSlugs 思路。
 */
export const RESERVED_SLUGS = new Set([
  'tags',
  'page',
  'search',
  'feed.xml',
  'rss.xml',
  'sitemap.xml',
  'robots.txt',
  'about',
  'api',
  'opengraph-image',
  // 临时验证页，M3 结束后连同 src/app/[locale]/kitchen-sink 一起删掉
  'kitchen-sink',
])
