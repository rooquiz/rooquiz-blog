/**
 * 站点级配置。内容与代码分离，改文案不用翻组件。
 * 参照 topic-coaching 的 site.config.ts 范式。
 *
 * **这个站只有英文。** 早先是 en / zh 双语，路由带 `/[locale]` 段、metadata 出 hreflang、
 * 日期与阅读时长按语言分支。中文从未发布过任何内容，双语那套机械成本却摊在四十来个
 * 文件里，所以整体移除了：URL 从 `/en/xxx` 变成 `/xxx`（旧链接靠 vercel.json 的 301 收拢）。
 *
 * 数据层刻意没动 —— Postgres 的 `locale` 列、Storage 的 `posts/en/` 前缀都保持原样，
 * 写入端一律写 `en`。那样就不用给已有对象改名，也不用跑破坏性迁移。
 * 真要恢复多语言，从 `sitePath()` 和 `src/app/` 的目录结构重新长出来，别指望这里还有钩子。
 */

export const site = {
  name: 'RooQuiz Blog',
  title: 'RooQuiz Blog',
  tagline: 'Quiz marketing, lead generation, and assessment design for coaches and creators.',
  description:
    'Practical guides on building quizzes that capture leads, spark shares, and turn curiosity into customers.',
  /**
   * 首页 `<title>` 的前半段，走 layout 里那条 `%s · RooQuiz Blog` 模板，
   * 拼出来是「Quiz Marketing and Lead Generation Guides · RooQuiz Blog」（54 字符，不会被截）。
   *
   * 为什么首页不直接用 `site.title`：搜索结果里那一行是唯一的排序信号载体，
   * 光一个品牌名等于放弃了「quiz marketing / lead generation」这两个词 ——
   * 而品牌名靠模板的后半段已经带上了。别把这里写成一整句话，超过 60 字符会被截。
   */
  homeTitle: 'Quiz Marketing and Lead Generation Guides',
  /** 列表页每页文章数 */
  pageSize: 12,
  /** JSON-LD 里 Organization 的稳定实体标识，与 topic-coaching 共用同一个 @id */
  organization: {
    url: 'https://rooquiz.com',
    id: 'https://rooquiz.com/#organization',
    name: 'RooQuiz',
    /** Organization 节点的 logo（站内路径，JSON-LD 里再绝对化）。SVG 在 Google 支持的图片格式之内 */
    logo: '/brand/logo.svg',
  },
  defaultAuthor: 'RooQuiz Team',
} as const

/**
 * 内容在 Postgres 与 Storage 里仍然带 locale，值恒为这个。
 * 站点侧不再有语言概念，这个常量只出现在数据读写的边界上。
 */
export const CONTENT_LOCALE = 'en'

/**
 * 与文章 slug 争同一段路径的保留字（`/[slug]` 会和 `/tags` 撞车）。
 * 写入 API 校验时拒绝这些 slug —— 沿用 rooquiz-payload 的 reservedFormSlugs 思路。
 *
 * 去掉 locale 段之后这份名单变得**更重要**：以前 `/en/tags` 和文章路径隔着一层，
 * 现在 `/tags` 和 `/my-post` 是同一层，撞车就是真撞车。
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
  'en',
  'zh',
  // GEO：给模型读的那几个出口（见 src/app/llms.txt / llms-full.txt / md）
  'llms.txt',
  'llms-full.txt',
  'md',
  // 临时验证页，M3 结束后连同 src/app/kitchen-sink 一起删掉
  'kitchen-sink',
])
