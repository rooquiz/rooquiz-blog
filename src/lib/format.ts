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
 * 大标题上的日期戳。视觉稿里它是全页最大的字，走方形宽体展示字体（Anybody）。
 *
 * zh 下刻意不用「2026年8月27日」：Anybody 没有中日韩字形，「年月日」会掉进系统
 * 字体，一行里两套字重两套宽度，那个大字号下极其明显。改成纯数字点分，
 * 全字符都留在展示字体里。
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
