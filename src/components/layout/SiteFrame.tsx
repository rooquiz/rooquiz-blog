import type { ReactNode } from 'react'
import type { Locale } from '@config'

import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { Sky } from './Sky'

/**
 * 页面外壳：一片天（头部压在里面）+ 内容 + 页脚。
 *
 * 传了 hero 就是内页 —— 天缩矮，标题块排在云上方的空里；
 * 不传就是首页 —— 天拉满，让彩虹拱和袋鼠占住整个第一屏。
 * 换句话说「有没有标题」和「天有多高」是同一个决定，调用处不用分别指定。
 */
export function SiteFrame({
  locale,
  localeHrefs,
  section,
  hero,
  children,
}: {
  locale: Locale
  localeHrefs: Partial<Record<Locale, string>>
  section?: 'journal' | 'tags' | 'search'
  /** 内页的标题块（眉标 + h1 + 元信息）。首页不传 */
  hero?: ReactNode
  children: ReactNode
}) {
  return (
    <>
      <Sky size={hero ? 'short' : 'tall'}>
        <div className="shell">
          <SiteHeader locale={locale} localeHrefs={localeHrefs} section={section} />
        </div>
        {hero && <div className="shell sky__title">{hero}</div>}
      </Sky>

      {children}

      <SiteFooter locale={locale} />
    </>
  )
}
