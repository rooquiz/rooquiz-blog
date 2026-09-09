import type { TocEntry } from '@/lib/content/toc'
import { copy } from '@/lib/i18n'

/**
 * 文章目录。纯锚点链接，不做滚动高亮 —— 那要客户端 JS 与 IntersectionObserver，
 * 对一篇三五个二级标题的文章不值得。
 *
 * 宽屏时它吸在正文右侧，窄屏时靠 CSS 的 order 挪到正文之前（见 site.css）——
 * 手机上目录恰恰是最有用的，藏起来不如放到最前面当一段结构预告。
 */
export function TableOfContents({ entries }: { entries: TocEntry[] }) {
  if (entries.length < 3) return null

  return (
    <nav aria-label={copy.onThisPage}>
      <p className="u-eyebrow">{copy.onThisPage}</p>
      <ul className="toc__list">
        {entries.map(entry => (
          <li key={entry.id} data-depth={entry.depth}>
            <a href={`#${entry.id}`}>{entry.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
