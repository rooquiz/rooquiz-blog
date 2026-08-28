/**
 * 图标。全部 24×24、只描边不填充，粗细与端点由 CSS 的 currentColor / stroke 决定
 * （见 .head__icon svg 与 .u-more svg）—— 所以这里的 path 不带任何表现属性，
 * 换个位置用就换一套尺寸和颜色，不用改组件。
 *
 * 刻意不引图标库：全站只用到六个形状，一个依赖换六段 path 不划算。
 */

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  )
}

export function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.6v2.2M12 19.2v2.2M4.2 12H2M22 12h-2.2M6.5 6.5 4.9 4.9M19.1 19.1l-1.6-1.6M17.5 6.5l1.6-1.6M4.9 19.1l1.6-1.6" />
    </svg>
  )
}

export function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M20.5 14.3A8.5 8.5 0 1 1 9.7 3.5a6.8 6.8 0 0 0 10.8 10.8Z" />
    </svg>
  )
}

export function RssIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4.5 11.2a8.3 8.3 0 0 1 8.3 8.3M4.5 4.5a15 15 0 0 1 15 15" />
      <circle cx="5.2" cy="18.8" r="1.6" />
    </svg>
  )
}

export function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  )
}

export function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M20 12H5M11 6l-6 6 6 6" />
    </svg>
  )
}
