import Link from 'next/link'
import { site, type Locale } from '@config'

import { localePath } from '@/lib/content'
import { t } from '@/lib/i18n'
import { RooHead } from '@/components/brand/Roo'

/**
 * 页脚。一条浅底的带子，左边一只小袋鼠 + 版权，右边几个链接。
 *
 * 这里只用头不用全身：全身那只在页首是插画（大、居中、坐在云上），
 * 页尾要的是签名 —— 小、安静、靠左。同一个形象在一页里换两种身份，
 * 比在页尾放一个 logo 更能把整页收住。
 */
export function SiteFooter({ locale }: { locale: Locale }) {
  const copy = t(locale)

  return (
    <footer className="foot">
      <div className="shell foot__inner">
        <div className="foot__left">
          <RooHead className="foot__roo" />
          <p>
            © {new Date().getUTCFullYear()}{' '}
            <a href={site.organization.url} className="hover:text-[var(--accent)]">
              {site.organization.name}
            </a>
          </p>
        </div>

        <nav className="foot__nav" aria-label={copy.footerNav}>
          <Link href={localePath(locale)}>{copy.journal}</Link>
          <Link href={localePath(locale, 'tags')}>{copy.categories}</Link>
          <Link href={localePath(locale, 'search')}>{copy.search}</Link>
          <Link href={localePath(locale, 'feed.xml')}>{copy.rss}</Link>
          <a href={site.organization.url}>rooquiz.com</a>
        </nav>
      </div>
    </footer>
  )
}
