import type { Metadata } from 'next'
import { LOCALES, site, type Locale } from '@config'

import { absoluteUrl } from './seo'

/** hreflang 的语言标签：Google 认 zh-Hans / en，不认裸 zh */
const HREFLANG: Record<Locale, string> = { en: 'en', zh: 'zh-Hans' }

interface PageMetadataInput {
  locale: Locale
  title?: string
  description?: string
  /** 各语言下本页的路径。缺哪个语言就不输出那条 alternate —— 宁可少一条，也不要指向 404 */
  paths: Partial<Record<Locale, string>>
  images?: string[]
  noIndex?: boolean
}

export function buildMetadata({ locale, title, description, paths, images, noIndex }: PageMetadataInput): Metadata {
  const copy = site.locales[locale]
  const canonicalPath = paths[locale]

  const languages: Record<string, string> = {}
  for (const other of LOCALES) {
    const p = paths[other]
    if (p) languages[HREFLANG[other]] = absoluteUrl(p)
  }
  // x-default 指向英文版（英文为主）
  if (paths.en) languages['x-default'] = absoluteUrl(paths.en)

  return {
    title,
    description: description ?? copy.description,
    alternates: {
      canonical: canonicalPath ? absoluteUrl(canonicalPath) : undefined,
      languages,
    },
    openGraph: {
      title: title ?? copy.title,
      description: description ?? copy.description,
      url: canonicalPath ? absoluteUrl(canonicalPath) : undefined,
      siteName: copy.title,
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      images,
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  }
}
