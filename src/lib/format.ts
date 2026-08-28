import type { Locale } from '@config'

/** 发布日期。用固定 locale 与 UTC 时区，避免构建机时区不同导致产物不一致。 */
export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso))
}

export function formatReadingTime(minutes: number, locale: Locale): string {
  return locale === 'zh' ? `${minutes} 分钟阅读` : `${minutes} min read`
}

/**
 * 紧凑日期戳。现在只有 OG 图用它（站内的日期一律走上面的 formatDate）。
 *
 * OG 图由 Satori 渲染，只喂了 Plus Jakarta Sans 的两个字重，没有中日韩字形 ——
 * zh 下写「2026年8月27日」，「年月日」三个字会缺字形直接渲染成空白框。
 * 所以中文走纯数字点分，全字符都留在拿得到的那份字体里。
 */
export function formatStamp(iso: string, locale: Locale): string {
  const date = new Date(iso)

  if (locale === 'zh') {
    // en-CA 给的是 YYYY-MM-DD，换成点分
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    })
      .format(date)
      .replace(/-/g, '.')
  }

  // en-GB 给的是 "03 Oct 2026"
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
    .format(date)
    .toUpperCase()
}
