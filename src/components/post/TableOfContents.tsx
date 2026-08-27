import type { Locale } from '@config'

import type { TocEntry } from '@/lib/content/toc'
import { t } from '@/lib/i18n'

/** 文章目录。纯锚点链接，不做滚动高亮 —— 那要客户端 JS，首版不值得。 */
export function TableOfContents({ entries, locale }: { entries: TocEntry[]; locale: Locale }) {
  if (entries.length < 3) return null

  return (
    <nav aria-label={t(locale).onThisPage} className="rounded-[var(--radius)] bg-[var(--brand-surface-soft)] p-5">
      <p className="text-xs font-medium tracking-wide text-[var(--muted)] uppercase">{t(locale).onThisPage}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {entries.map(entry => (
          <li key={entry.id} className={entry.depth === 3 ? 'pl-4' : undefined}>
            <a href={`#${entry.id}`} className="text-[var(--muted)] hover:text-[var(--accent)]">
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
