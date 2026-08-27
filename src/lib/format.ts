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
