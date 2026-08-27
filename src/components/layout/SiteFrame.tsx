import type { ReactNode } from 'react'
import type { Locale } from '@config'

import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

/**
 * 页面外壳：固定站点头 + 贯通全页的竖发丝线 + 页脚。
 *
 * 竖线单独一个固定元素而不是每块内容各画一段 —— 视觉稿里它是一根不断的线，
 * 分段画在滚动时接缝会错开半个像素。
 *
 * frame__mask 是左影像带的固定窗口遮罩，frame__veil 是顶部那层保证导航可读的薄纱，
 * 两者的原因都写在 stage.css 里。
 */
export function SiteFrame({
  locale,
  localeHrefs,
  section,
  eyebrow,
  children,
}: {
  locale: Locale
  localeHrefs: Partial<Record<Locale, string>>
  section?: 'journal' | 'tags' | 'search'
  eyebrow?: ReactNode
  children: ReactNode
}) {
  return (
    <>
      <SiteHeader locale={locale} localeHrefs={localeHrefs} section={section} eyebrow={eyebrow} />
      <div className="frame__rule" aria-hidden />
      <div className="frame__mask" aria-hidden />
      <div className="frame__veil" aria-hidden />
      {children}
      <SiteFooter locale={locale} />
    </>
  )
}
