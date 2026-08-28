'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LOCALES, type Locale } from '@config'

const LABELS: Record<Locale, string> = { en: 'EN', zh: '中文' }

/**
 * 语言切换。纯静态站不能在服务端知道「当前文章的另一语言版本存不存在」，
 * 所以由页面把 hrefs 传进来：没有对应译文的语言直接不渲染，避免把用户送到 404。
 *
 * 样式上是一枚小胶囊里挤着两个按钮，当前语言有一层纸色的底 —— 和右边那组圆按钮
 * 同一套语言，但它是「二选一」而不是「按一下」，所以用底色而不是图标来表达状态。
 */
export function LocaleSwitcher({ current, hrefs }: { current: Locale; hrefs: Partial<Record<Locale, string>> }) {
  const pathname = usePathname()

  const available = LOCALES.filter(locale => hrefs[locale])
  // 只剩当前语言时不渲染 —— 一个不能切的切换器只是噪音
  if (available.length < 2) return null

  return (
    <span className="locales">
      {available.map(locale => {
        const href = hrefs[locale]!
        const isCurrent = locale === current

        return (
          <Link
            key={locale}
            href={href}
            aria-current={isCurrent ? 'true' : undefined}
            prefetch={href !== pathname}
            lang={locale}
          >
            {LABELS[locale]}
          </Link>
        )
      })}
    </span>
  )
}
