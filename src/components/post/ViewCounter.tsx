'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@config'

import { t } from '@/lib/i18n'

/**
 * 阅读量。页面是静态的，计数只能在客户端补一次。
 *
 * 刻意的取舍：
 *   - 挂载即 POST 一次，不做去重。刷新会重复计数，但这是「浏览量」不是「独立访客」，
 *     真实 UV 看 Vercel Analytics；这里的数字只是给读者的社交证明。
 *   - 拿不到数就什么都不显示，不占位、不报错 —— 计数服务挂了不该影响文章可读性。
 */
export function ViewCounter({ locale, slug }: { locale: Locale; slug: string }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch(`/api/views/${locale}/${slug}`, { method: 'POST' })
      .then(res => (res.ok ? res.json() : null))
      .then((data: { count?: number } | null) => {
        if (!cancelled && typeof data?.count === 'number') setCount(data.count)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [locale, slug])

  if (count === null) return null

  return (
    <span>
      {count.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')} {t(locale).views}
    </span>
  )
}
