import Link from 'next/link'
import { site, type Locale } from '@config'

import { localePath } from '@/lib/content'

/**
 * 页脚。视觉稿里没有页脚，这里按同一套语言补一个最轻的：
 * 一条发丝线 + 一行小型大写，左侧对齐到影像带内，右侧对齐到导航那条边。
 */
export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="border-t border-[var(--rule)]">
      <div className="u-micro flex flex-wrap items-center justify-between gap-4 py-8 pr-[6.9%] pl-[4.8%] text-[var(--muted)]">
        <p>
          © {new Date().getUTCFullYear()}{' '}
          <a href={site.organization.url} className="hover:text-[var(--accent)]">
            {site.organization.name}
          </a>
        </p>
        <nav className="flex items-center gap-6">
          <Link href={localePath(locale, 'feed.xml')} className="hover:text-[var(--accent)]">
            RSS
          </Link>
          <a href={site.organization.url} className="hover:text-[var(--accent)]">
            rooquiz.com
          </a>
        </nav>
      </div>
    </footer>
  )
}
