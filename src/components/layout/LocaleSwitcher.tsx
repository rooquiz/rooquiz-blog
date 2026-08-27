'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LOCALES, type Locale } from '@config'

const LABELS: Record<Locale, string> = { en: 'EN', zh: '中文' }

/**
 * 语言切换。纯静态站不能在服务端知道「当前文章的另一语言版本存不存在」，
 * 所以由页面把 available 传进来：没有对应译文的语言直接不渲染，
 * 避免把用户送到 404。
 */
export function LocaleSwitcher({ current, hrefs }: { current: Locale; hrefs: Partial<Record<Locale, string>> }) {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 text-sm">
      {LOCALES.map(locale => {
        const href = hrefs[locale]
        if (!href) return null

        const isCurrent = locale === current
        return (
          <Link
            key={locale}
            href={href}
            aria-current={isCurrent ? 'true' : undefined}
            prefetch={href !== pathname}
            className={
              isCurrent
                ? 'rounded-md px-2 py-1 font-medium text-[var(--accent)]'
                : 'rounded-md px-2 py-1 text-[var(--muted)] hover:text-[var(--foreground)]'
            }
          >
            {LABELS[locale]}
          </Link>
        )
      })}
    </div>
  )
}
