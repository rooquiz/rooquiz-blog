import Link from 'next/link'
import type { Locale } from '@config'

import { localePath } from '@/lib/content'
import { t } from '@/lib/i18n'

/**
 * 列表分页。用 next/link 自己实现而不是 HeroUI 的 Pagination：
 * 后者建立在 react-aria Button 上，只接受 onPress、不接受 href，
 * 渲染出来是按钮而非可爬取的 <a>，分页页面就进不了索引。
 */
export function Pager({ locale, current, total }: { locale: Locale; current: number; total: number }) {
  if (total <= 1) return null

  const copy = t(locale)
  const pageHref = (n: number) => (n === 1 ? localePath(locale) : localePath(locale, 'page', String(n)))

  return (
    <nav className="mt-12 flex items-center justify-between border-t border-[var(--border)] pt-6 text-sm">
      {current > 1 ? (
        <Link href={pageHref(current - 1)} className="text-[var(--accent)] hover:underline" rel="prev">
          ← {copy.previousPage}
        </Link>
      ) : (
        <span />
      )}

      <span className="text-[var(--muted)]">{copy.pageN(current)}</span>

      {current < total ? (
        <Link href={pageHref(current + 1)} className="text-[var(--accent)] hover:underline" rel="next">
          {copy.nextPage} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
