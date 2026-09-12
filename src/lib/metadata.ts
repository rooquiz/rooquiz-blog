import type { Metadata } from 'next'
import { site } from '@config'

import { sitePath } from './routes'
import { absoluteUrl } from './seo'

interface PageMetadataInput {
  title?: string
  description?: string
  /** 本页的站内路径。走 `sitePath()` 拼，别手写 */
  path: string
  images?: string[]
  noIndex?: boolean
  /**
   * 文章页专用。给了它才会把 og:type 切成 `article` 并补上时间 / 作者 / 标签 ——
   * 这几条是 Google Discover 与社交卡片读的，缺了就只是一个普通 website 卡。
   */
  article?: {
    publishedTime: string
    modifiedTime: string
    authors: string[]
    tags: string[]
  }
  /** 本页的 Markdown 版本（`/{slug}.md`），输出成 `<link rel="alternate" type="text/markdown">` */
  markdownPath?: string
}

/** RSS 自动发现。每一页都带，读者在任何一页按订阅键都能拿到 feed */
const FEED_URL = absoluteUrl(sitePath('feed.xml'))

/**
 * 页面 metadata。
 *
 * **openGraph 必须在这里一次写全**（siteName / locale / type 都不能省）：
 * Next 的 metadata 合并是**逐个顶层字段浅合并**的 —— 页面只要声明了 `openGraph`，
 * 根 layout 那个 `openGraph` 整块被替换掉，而不是逐字段补齐。
 * 文章页早先自己拼了一个只有 title/description/url 的 openGraph，
 * 结果每篇文章的卡片都丢了 `og:site_name` 与 `og:locale`。
 *
 * **没有 hreflang / alternates.languages** —— 站点只有一种语言，输出
 * `<link rel="alternate" hreflang="en">` 指向自己是噪音，`x-default` 同理。
 * 早先双语时这里维护一张 `paths: Partial<Record<Locale, string>>`，
 * 缺哪个语言就少输出一条；那套连同 `getTranslations()` 一起去掉了。
 */
export function buildMetadata({
  title,
  description,
  path,
  images,
  noIndex,
  article,
  markdownPath,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path)
  const resolvedDescription = description ?? site.description
  const resolvedTitle = title ?? site.title

  const types: Record<string, string> = { 'application/rss+xml': FEED_URL }
  if (markdownPath) types['text/markdown'] = absoluteUrl(markdownPath)

  return {
    title,
    description: resolvedDescription,
    alternates: { canonical: url, types },
    openGraph: article
      ? {
          type: 'article',
          title: resolvedTitle,
          description: resolvedDescription,
          url,
          siteName: site.title,
          locale: 'en_US',
          publishedTime: article.publishedTime,
          modifiedTime: article.modifiedTime,
          authors: article.authors,
          tags: article.tags,
          // images 这个键只在真给了图时才出现：不给的话由 opengraph-image.tsx
          // 那套文件约定补上构建期生成的 PNG，写一个 undefined 进去等于把位置占了
          ...(images ? { images } : {}),
        }
      : {
          type: 'website',
          title: resolvedTitle,
          description: resolvedDescription,
          url,
          siteName: site.title,
          locale: 'en_US',
          ...(images ? { images } : {}),
        },
    // 卡片标题 / 描述不会自动从 openGraph 抄过来，要显式给
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description: resolvedDescription,
      ...(images ? { images } : {}),
    },
    /*
     * 只在 noIndex 时才**出现**这个键。写成 `robots: noIndex ? … : undefined` 是不行的：
     * Next 合并 metadata 时按 `for…in` 遍历源对象，键在、值是 undefined 也算声明过，
     * 结果把根 layout 那条（max-image-preview:large 等）整条抹掉。
     */
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  }
}
