import Link from 'next/link'
import { site, type Locale } from '@config'

import { localePath } from '@/lib/content'

import { RooMark } from './Kangaroo'

/**
 * 文字商标：Roo · 袋鼠头 · Quiz。小袋鼠是字标的一部分，不是独立图标。
 *
 * 袋鼠头夹在两个音节中间而不是摆在最左边 —— 摆左边它就只是一个图标，
 * 夹在中间才成为字的一部分（Roo 正好是「袋鼠」的昵称，这个双关是整个商标的支点）。
 *
 */
export function Wordmark({ locale }: { locale: Locale }) {
  return (
    <Link href={localePath(locale)} className="brand" aria-label={site.locales[locale].title}>
      <span className="brand__word">Roo</span>
      <RooMark idPrefix="brand-roo" className="brand__mark" />
      <span className="brand__word brand__word--alt">Quiz</span>
    </Link>
  )
}
