import type { Locale } from '@config'

/**
 * UI 文案。量很小，没必要上 i18n 框架 —— dubai 那边也是同样的判断
 * （站点级 i18n 会全量预加载命名空间，对几十条文案不划算）。
 */
const dictionary = {
  en: {
    allPosts: 'All posts',
    tags: 'Tags',
    search: 'Search',
    searchPlaceholder: 'Search posts…',
    noResults: 'No posts matched that search.',
    emptyTag: 'No posts under this tag yet.',
    readMore: 'Read more',
    backToList: 'Back to all posts',
    postedOn: 'Published',
    views: 'views',
    onThisPage: 'On this page',
    previousPage: 'Previous',
    nextPage: 'Next',
    postsUnderTag: (tag: string) => `Posts tagged “${tag}”`,
    pageN: (n: number) => `Page ${n}`,
  },
  zh: {
    allPosts: '全部文章',
    tags: '标签',
    search: '搜索',
    searchPlaceholder: '搜索文章…',
    noResults: '没有匹配的文章。',
    emptyTag: '这个标签下还没有文章。',
    readMore: '阅读全文',
    backToList: '返回文章列表',
    postedOn: '发布于',
    views: '次阅读',
    onThisPage: '本页目录',
    previousPage: '上一页',
    nextPage: '下一页',
    postsUnderTag: (tag: string) => `标签「${tag}」下的文章`,
    pageN: (n: number) => `第 ${n} 页`,
  },
} as const

export function t(locale: Locale) {
  return dictionary[locale]
}
