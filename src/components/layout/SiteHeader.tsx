import Link from 'next/link'
import type { Locale } from '@config'

import { localePath } from '@/lib/content'
import { t } from '@/lib/i18n'
import { Wordmark } from '@/components/brand/Wordmark'

import { RssIcon, SearchIcon } from './Icons'
import { LocaleSwitcher } from './LocaleSwitcher'
import { ThemeToggle } from './theme'

/**
 * 站点头。它不是固定浮层 —— 常驻在英雄区那片天里，随页面一起滚走（理由见 Sky.tsx）。
 *
 * 分工：左边商标 + 两个栏目链接（文字，用来导航），右边三枚圆按钮 + 语言切换
 * （图标，用来切换视图）。搜索被放在右边那组而不是左边的栏目里，
 * 因为它和「明暗」「订阅」一样是随时可用的工具，不是内容的一个分区。
 *
 * Server Component：只有明暗切换和语言切换需要浏览器，各自单独隔离，
 * 其余不进 JS bundle。
 */
export function SiteHeader({
  locale,
  localeHrefs,
  /** 当前栏目，用来给对应导航项上洋红 */
  section,
}: {
  locale: Locale
  localeHrefs: Partial<Record<Locale, string>>
  section?: 'journal' | 'tags' | 'search'
}) {
  const copy = t(locale)

  const items = [
    { key: 'journal', href: localePath(locale), label: copy.journal },
    { key: 'tags', href: localePath(locale, 'tags'), label: copy.categories },
  ] as const

  return (
    <header className="head">
      <Wordmark locale={locale} />

      <nav className="head__nav" aria-label={copy.primaryNav}>
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
      </nav>

      <div className="head__tools">
        <Link
          href={localePath(locale, 'search')}
          className="head__icon"
          aria-label={copy.search}
          aria-current={section === 'search' ? 'page' : undefined}
        >
          <SearchIcon />
        </Link>
        <ThemeToggle label={copy.toggleTheme} />
        <Link href={localePath(locale, 'feed.xml')} className="head__icon head__rss" aria-label={copy.rss}>
          <RssIcon />
        </Link>
        <LocaleSwitcher current={locale} hrefs={localeHrefs} />
      </div>
    </header>
  )
}
