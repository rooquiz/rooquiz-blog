/**
 * UI 文案。量很小，没必要上 i18n 框架 —— dubai 那边也是同样的判断
 * （站点级 i18n 会全量预加载命名空间，对几十条文案不划算）。
 *
 * 这个站只有英文（见 site.config.ts 顶部），所以这里就是一份平铺的常量，
 * 早先那个 `t(locale)` 取字典的间接层已经去掉 —— 只剩一种语言时它只是噪音。
 */
export const copy = {
  /* ---- 导航 ---- */
  journal: 'Articles',
  categories: 'Categories',
  search: 'Search',
  rss: 'RSS',
  toggleTheme: 'Toggle light or dark theme',
  primaryNav: 'Sections',
  footerNav: 'Site links',

  /* ---- 首页 ---- */
  articlesEyebrow: 'Articles and tutorials',
  browseByCategory: 'Browse by category',
  allCategories: 'All categories',
  subscribeEyebrow: 'Subscribe',
  subscribeBody: 'New posts land in your reader the moment they go live. No email, no tracking.',
  aboutEyebrow: 'About',
  aboutBody:
    'RooQuiz turns quizzes into a lead engine for coaches and creators. This is where we write down what works.',
  aboutCta: 'Visit rooquiz.com',

  /* ---- 列表与文章 ---- */
  readMore: 'Read more',
  searchPlaceholder: 'Search posts…',
  noResults: 'No posts matched that search.',
  emptyTag: 'No posts under this category yet.',
  empty: 'Nothing published yet.',
  backToList: 'Back to all posts',
  onThisPage: 'On this page',
  views: 'views',
  previousPage: 'Previous',
  nextPage: 'Next',
  prevPost: 'Previous post',
  nextPost: 'Next post',
  filedUnder: 'Filed under',

  /* ---- 带参数 ---- */
  resultCount: (n: number) => `${n} ${n === 1 ? 'post' : 'posts'}`,
  postsUnderTag: (tag: string) => `Posts in “${tag}”`,
  pageN: (n: number) => `Page ${n}`,
  byline: (author: string) => `By ${author}`,
  updatedOn: (date: string) => `Last updated on ${date}`,

  /* ---- 只出现在搜索结果里的文案 ----
   * 列表页早先一律退回站点描述，于是首页、/tags、每个分类页在 SERP 里是同一段话 ——
   * 对搜索引擎那是四个互相重复的页面，对读者那一行也没说清点进去能看到什么。
   * 长度按 150–160 字符排，再长会被截。 */
  tagsMetaDescription:
    'Every topic covered on the RooQuiz blog: quiz design, lead generation, result screens, benchmarks, and assessment reporting.',
  tagMetaDescription: (tag: string, count: number) =>
    `${count} ${count === 1 ? 'article' : 'articles'} on ${tag} from the RooQuiz team — what works in quiz marketing, and what the completion data actually shows.`,
  pageMetaDescription: (n: number) =>
    `Page ${n} of the RooQuiz blog archive: quiz marketing, lead generation, and assessment design, newest first.`,
} as const
