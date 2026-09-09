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
} as const
