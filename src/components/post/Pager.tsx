import Link from 'next/link'

import { sitePath } from '@/lib/routes'
import { copy } from '@/lib/i18n'
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/layout/Icons'

/**
 * 列表分页。自己写而不用 HeroUI 的 Pagination：后者建立在 react-aria Button 上，
 * 只接受 onPress、不接受 href，渲染出来是按钮而非可爬取的 <a>，分页页面就进不了索引。
 *
 * 到头的那一侧渲染成 aria-disabled 的 <span> 而不是直接不渲染 ——
 * 保持左右两枚的位置，翻页时中间那个「3 / 7」不会左右跳。
 */
export function Pager({ current, total }: { current: number; total: number }) {
  if (total <= 1) return null

  const pageHref = (n: number) => (n === 1 ? sitePath() : sitePath('page', String(n)))

  return (
    <nav className="pager">
      {current > 1 ? (
        <Link href={pageHref(current - 1)} className="pager__link" rel="prev">
          <ArrowLeftIcon />
          {copy.previousPage}
        </Link>
      ) : (
        <span className="pager__link" aria-disabled="true">
          <ArrowLeftIcon />
          {copy.previousPage}
        </span>
      )}

      <span className="pager__count">
        {current} / {total}
      </span>

      {current < total ? (
        <Link href={pageHref(current + 1)} className="pager__link" rel="next">
          {copy.nextPage}
          <ArrowRightIcon />
        </Link>
      ) : (
        <span className="pager__link" aria-disabled="true">
          {copy.nextPage}
          <ArrowRightIcon />
        </span>
      )}
    </nav>
  )
}
