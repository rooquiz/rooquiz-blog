import Link from 'next/link'

import { sitePath } from '@/lib/routes'
import { copy } from '@/lib/i18n'
import { Wordmark } from '@/components/brand/Wordmark'

import { RssIcon, SearchIcon } from './Icons'
import { ThemeToggle } from './theme'

/**
 * 站点头。它不是固定浮层 —— 常驻在英雄区那片天里，随页面一起滚走（理由见 Sky.tsx）。
 *
 * 分工：左边商标 + 两个栏目链接（文字，用来导航），右边三枚圆按钮
 * （图标，用来切换视图）。搜索被放在右边那组而不是左边的栏目里，
 * 因为它和「明暗」「订阅」一样是随时可用的工具，不是内容的一个分区。
 *
 * 语言切换器已经拿掉了 —— 站点只有英文（见 site.config.ts 顶部）。
 *
 * Server Component：只有明暗切换需要浏览器，单独隔离，其余不进 JS bundle。
 */
export function SiteHeader({
  /** 当前栏目，用来给对应导航项上强调色 */
  section,
}: {
  section?: 'journal' | 'tags' | 'search'
}) {
  const items = [
    { key: 'journal', href: sitePath(), label: copy.journal },
    { key: 'tags', href: sitePath('tags'), label: copy.categories },
  ] as const

  return (
    <header className="head">
      <Wordmark />

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
          href={sitePath('search')}
          className="head__icon"
          aria-label={copy.search}
          aria-current={section === 'search' ? 'page' : undefined}
        >
          <SearchIcon />
        </Link>
        <ThemeToggle label={copy.toggleTheme} />
        <Link href={sitePath('feed.xml')} className="head__icon head__rss" aria-label={copy.rss}>
          <RssIcon />
        </Link>
      </div>
    </header>
  )
}
