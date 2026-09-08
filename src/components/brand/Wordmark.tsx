import Link from 'next/link'
import { site, type Locale } from '@config'

import { localePath } from '@/lib/content'

import { RooHead } from './Roo'

/**
 * 文字商标：Roo · 袋鼠头 · Quiz。小袋鼠是字标的一部分，不是独立图标。
 *
 * 袋鼠头夹在两个音节中间而不是摆在最左边 —— 摆左边它就只是一个图标，
 * 夹在中间才成为字的一部分（Roo 正好是「袋鼠」的昵称，这个双关是整个商标的支点）。
 *
 * 两个音节颜色不同：Roo 墨蓝、Quiz 紫。紫是全站的强调色，
 * 商标后半段和眉标、链接是同一个紫，所以它读起来是「这个站的颜色」而不是装饰。
 */
export function Wordmark({ locale }: { locale: Locale }) {
  return (
    <Link href={localePath(locale)} className="brand" aria-label={site.locales[locale].title}>
      <span className="brand__word">Roo</span>
      <RooHead className="brand__mark" />
      <span className="brand__word brand__word--alt">Quiz</span>
    </Link>
  )
}
