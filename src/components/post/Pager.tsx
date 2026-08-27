import Link from 'next/link'
import type { Locale } from '@config'

import { localePath } from '@/lib/content'
import { t } from '@/lib/i18n'

/**
 * 列表分页。用 next/link 自己实现而不是 HeroUI 的 Pagination：
 * 后者建立在 react-aria Button 上，只接受 onPress、不接受 href，
 * 渲染出来是按钮而非可爬取的 <a>，分页页面就进不了索引。
 *
 * 版式跟着视觉稿：一条满幅发丝线 + 一行小型大写，左侧对齐到文字栏那条线上。
 */
export function Pager({ locale, current, total }: { locale: Locale; current: number; total: number }) {
  if (total <= 1) return null

  const copy = t(locale)
  const pageHref = (n: number) => (n === 1 ? localePath(locale) : localePath(locale, 'page', String(n)))

  return (
    <nav className="u-micro flex items-center gap-8 border-t border-[var(--rule)] py-10 pr-[6.9%] pl-[4.8%] lg:pl-[var(--col-l)]">
      {current > 1 ? (
        <Link href={pageHref(current - 1)} className="u-cue" rel="prev">
          ← {copy.previousPage}
        </Link>
      ) : (
        <span className="text-[var(--rule-strong)]">← {copy.previousPage}</span>
      )}

      <span className="text-[var(--muted)]">
        {current} / {total}
      </span>

      {current < total ? (
        <Link href={pageHref(current + 1)} className="u-cue" rel="next">
          {copy.nextPage} →
        </Link>
      ) : (
        <span className="text-[var(--rule-strong)]">{copy.nextPage} →</span>
      )}
    </nav>
  )
}
