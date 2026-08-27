import type { Locale } from '@config'

import type { TocEntry } from '@/lib/content/toc'
import { t } from '@/lib/i18n'

/**
 * 文章目录。纯锚点链接，不做滚动高亮 —— 那要客户端 JS，首版不值得。
 *
 * 版式上它占的是视觉稿里竖线与文字栏之间那段留白：原稿在那儿放预览卡，
 * 文章页没有卡可放，改放目录，正好把这块空当用出信息量。
 */
export function TableOfContents({ entries, locale }: { entries: TocEntry[]; locale: Locale }) {
  if (entries.length < 3) return null

  return (
    <nav aria-label={t(locale).onThisPage}>
      <p className="u-micro text-[var(--muted)]">{t(locale).onThisPage}</p>
      <ul className="mt-4 space-y-3 border-t border-[var(--rule)] pt-4">
        {entries.map(entry => (
          <li key={entry.id} className={entry.depth === 3 ? 'pl-4' : undefined}>
            <a href={`#${entry.id}`} className="text-sm leading-snug text-[var(--muted)] hover:text-[var(--accent)]">
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
