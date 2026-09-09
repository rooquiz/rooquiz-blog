import type { Metadata } from 'next'
import { site } from '@config'

import { absoluteUrl } from './seo'

interface PageMetadataInput {
  title?: string
  description?: string
  /** 本页的站内路径。走 `sitePath()` 拼，别手写 */
  path: string
  images?: string[]
  noIndex?: boolean
}

/**
 * 页面 metadata。
 *
 * **没有 hreflang / alternates.languages** —— 站点只有一种语言，输出
 * `<link rel="alternate" hreflang="en">` 指向自己是噪音，`x-default` 同理。
 * 早先双语时这里维护一张 `paths: Partial<Record<Locale, string>>`，
 * 缺哪个语言就少输出一条；那套连同 `getTranslations()` 一起去掉了。
 */
export function buildMetadata({ title, description, path, images, noIndex }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path)

  return {
    title,
    description: description ?? site.description,
    alternates: { canonical: url },
    openGraph: {
      title: title ?? site.title,
      description: description ?? site.description,
      url,
      siteName: site.title,
      locale: 'en_US',
      images,
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  }
}
