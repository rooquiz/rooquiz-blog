import type { ReactNode } from 'react'
import Link from 'next/link'
import { site, type Locale } from '@config'

import { localePath } from '@/lib/content'
import { t } from '@/lib/i18n'

import { LocaleSwitcher } from './LocaleSwitcher'

/**
 * 站点头。视觉稿里它是一层固定浮层，不占文档流也不带下边框 ——
 * 文字商标压在左影像带上，导航贴到右侧留白里。
 *
 * Server Component：只有语言切换器要读 pathname，那一小块单独隔离，
 * 其余不进 JS bundle。
 */
export function SiteHeader({
  locale,
  localeHrefs,
  /** 当前栏目，用来给导航项上洋红（原稿里高亮的是 NEWS） */
  section,
  /** 商标下方那行小型大写。列表页把 h1 放这儿 —— 视觉稿在这个位置没有大标题 */
  eyebrow,
}: {
  locale: Locale
  localeHrefs: Partial<Record<Locale, string>>
  section?: 'journal' | 'tags' | 'search'
  eyebrow?: ReactNode
}) {
  const copy = t(locale)

  const items = [
    { key: 'journal', href: localePath(locale), label: copy.journal },
    { key: 'tags', href: localePath(locale, 'tags'), label: copy.tags },
    { key: 'search', href: localePath(locale, 'search'), label: copy.search },
  ] as const

  return (
    <header className="head">
      <div className="head__brand">
        <Link href={localePath(locale)} className="head__mark" aria-label={site.locales[locale].title}>
          RooQuiz
          <span>Blog</span>
        </Link>
        {eyebrow}
      </div>

      <nav className="head__nav u-micro">
        {items.map(item => (
          <Link
            key={item.key}
            href={item.href}
            className="head__link"
            aria-current={item.key === section ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
        <LocaleSwitcher current={locale} hrefs={localeHrefs} />
      </nav>
    </header>
  )
}
