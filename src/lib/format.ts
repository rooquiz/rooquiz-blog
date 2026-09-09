/** 发布日期。用固定 locale 与 UTC 时区，避免构建机时区不同导致产物不一致。 */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso))
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`
}

/**
 * 紧凑日期戳。现在只有 OG 图用它（站内的日期一律走上面的 formatDate）。
 *
 * 全大写的 "27 AUG 2026"：OG 图由 Satori 渲染、只喂了两个字重的静态字体，
 * 字符集越窄越安全（见 src/lib/og-fonts 的 README）。
 */
export function formatStamp(iso: string): string {
  // en-GB 给的是 "27 Aug 2026"
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
    .format(new Date(iso))
    .toUpperCase()
}
