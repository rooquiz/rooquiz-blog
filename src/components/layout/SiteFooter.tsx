import Link from 'next/link'
import { site, type Locale } from '@config'

import { localePath } from '@/lib/content'

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="mt-20 border-t border-[var(--border)]">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-[var(--muted)]">
        <p>
          © {new Date().getUTCFullYear()}{' '}
          <a href={site.organization.url} className="hover:text-[var(--foreground)]">
            {site.organization.name}
          </a>
        </p>
        <nav className="flex items-center gap-4">
          <Link href={localePath(locale, 'feed.xml')} className="hover:text-[var(--foreground)]">
            RSS
          </Link>
          <a href={site.organization.url} className="hover:text-[var(--foreground)]">
            rooquiz.com
          </a>
        </nav>
      </div>
    </footer>
  )
}
