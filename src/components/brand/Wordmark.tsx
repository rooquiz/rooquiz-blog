import Link from 'next/link'
import { site, type Locale } from '@config'

import { localePath } from '@/lib/content'

import { Logo } from './Logo'

/**
 * 站点商标，链回首页。就是设计交付的那枚锁定版 logo（见 Logo.tsx）。
 *
 * 早先这里是用文字排出来的字标 —— `Roo` + 一张袋鼠头位图 + `Quiz`，
 * 后半段刻意染成全站的强调紫。换成交付稿之后有两处跟着变了，都是有意的：
 *   - 字母是同一个颜色（跟 `--ink` 走），不再有「后半段是紫的」那个呼应；
 *   - 袋鼠的尾巴扫进了 QUIZ，整枚是一个锁定图形，所以 hover 时那颗头轻轻一跳的
 *     彩蛋没有可单独动的部件了，已经从 motion.css 里撤掉。
 *
 * 可读名字挂在这个 `<a>` 上（`aria-label`），里面那张 SVG 是 `aria-hidden` ——
 * 图形本身不该再被读一遍。
 */
export function Wordmark({ locale }: { locale: Locale }) {
  return (
    <Link href={localePath(locale)} className="brand" aria-label={site.locales[locale].title}>
      <Logo />
    </Link>
  )
}
