import Link from 'next/link'
import { site, type Locale } from '@config'

import { localePath } from '@/lib/content'
import { t } from '@/lib/i18n'

import { LocaleSwitcher } from './LocaleSwitcher'

/**
 * 站点头。Server Component —— 只有语言切换器需要客户端（要读 pathname），
 * 那一小块单独隔离，其余不进 JS bundle。
 */
export function SiteHeader({ locale, localeHrefs }: { locale: Locale; localeHrefs: Partial<Record<Locale, string>> }) {
  const copy = t(locale)

  return (
    <header className="border-b border-[var(--border)]">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-6 px-6 py-5">
        <Link href={localePath(locale)} className="text-base font-semibold tracking-tight">
          {site.locales[locale].title}
        </Link>

        <nav className="flex items-center gap-5 text-sm text-[var(--muted)]">
          <Link href={localePath(locale)} className="hover:text-[var(--foreground)]">
            {copy.allPosts}
          </Link>
          <Link href={localePath(locale, 'tags')} className="hover:text-[var(--foreground)]">
            {copy.tags}
          </Link>
          <Link href={localePath(locale, 'search')} className="hover:text-[var(--foreground)]">
            {copy.search}
          </Link>
          <LocaleSwitcher current={locale} hrefs={localeHrefs} />
        </nav>
      </div>
    </header>
  )
}
