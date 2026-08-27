'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LOCALES, type Locale } from '@config'

const LABELS: Record<Locale, string> = { en: 'EN', zh: '中文' }

/**
 * 语言切换。纯静态站不能在服务端知道「当前文章的另一语言版本存不存在」，
 * 所以由页面把 available 传进来：没有对应译文的语言直接不渲染，
 * 避免把用户送到 404。
 *
 * 样式上跟着视觉稿：当前语言是墨色，其它语言灰、hover 变洋红，中间一条竖发丝线。
 */
export function LocaleSwitcher({ current, hrefs }: { current: Locale; hrefs: Partial<Record<Locale, string>> }) {
  const pathname = usePathname()

  const available = LOCALES.filter(locale => hrefs[locale])
  // 只剩当前语言时不渲染 —— 一个不能切的切换器只是噪音
  if (available.length < 2) return null

  return (
    <span className="flex items-center gap-2.5">
      {available.map((locale, index) => {
        const href = hrefs[locale]!
        const isCurrent = locale === current

        return (
          <span key={locale} className="flex items-center gap-2.5">
            {index > 0 && <span className="h-2.5 w-px bg-[var(--rule-strong)]" aria-hidden />}
            <Link
              href={href}
              aria-current={isCurrent ? 'true' : undefined}
              prefetch={href !== pathname}
              className={isCurrent ? 'text-[var(--ink)]' : 'text-[var(--muted)] hover:text-[var(--accent)]'}
            >
              {LABELS[locale]}
            </Link>
          </span>
        )
      })}
    </span>
  )
}
