import type { Locale } from '@config'

/**
 * UI 文案。量很小，没必要上 i18n 框架 —— dubai 那边也是同样的判断
 * （站点级 i18n 会全量预加载命名空间，对几十条文案不划算）。
 */
const dictionary = {
  en: {
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
  },
  zh: {
    journal: '文章',
    categories: '分类',
    search: '搜索',
    rss: '订阅',
    toggleTheme: '切换深浅色',
    primaryNav: '栏目',
    footerNav: '站点链接',

    articlesEyebrow: '文章与教程',
    browseByCategory: '按分类浏览',
    allCategories: '全部分类',
    subscribeEyebrow: '订阅',
    subscribeBody: '新文章发布即进你的阅读器。不要邮箱，也不做追踪。',
    aboutEyebrow: '关于',
    aboutBody: 'RooQuiz 帮教练与知识创作者把测评做成获客引擎。这里记下那些真正有效的做法。',
    aboutCta: '去 rooquiz.com',

    readMore: '阅读全文',
    searchPlaceholder: '搜索文章…',
    noResults: '没有匹配的文章。',
    emptyTag: '这个分类下还没有文章。',
    empty: '还没有已发布的文章。',
    backToList: '返回文章列表',
    onThisPage: '本页目录',
    views: '次阅读',
    previousPage: '上一页',
    nextPage: '下一页',
    prevPost: '上一篇',
    nextPost: '下一篇',
    filedUnder: '归入分类',

    resultCount: (n: number) => `${n} 篇文章`,
    postsUnderTag: (tag: string) => `分类「${tag}」下的文章`,
    pageN: (n: number) => `第 ${n} 页`,
  },
} as const

export function t(locale: Locale) {
  return dictionary[locale]
}
