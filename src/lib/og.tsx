import { ImageResponse } from 'next/og'
import { site, type Locale } from '@config'

/** OG 图尺寸 / MIME —— 供各 opengraph-image.tsx 直接 re-export */
export const ogSize = { width: 1200, height: 630 } as const
export const ogContentType = 'image/png'

/**
 * 渲染 OG 图（1200×630）。纯参数驱动，不拉网络资源，
 * 因此可以在构建期由 opengraph-image.tsx 文件约定生成静态 PNG，运行时没有 /api/og。
 *
 * 配色沿用 dubai 的品牌紫：#6e3cff 主色 + 近黑 ink 文字。
 * 这里写 hex 而不是 CSS 变量 —— Satori 不解析 var()。
 */
export function renderOgImage({
  title,
  subtitle,
  locale,
}: {
  title: string
  subtitle?: string
  locale: Locale
}): ImageResponse {
  const copy = site.locales[locale]

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: 'linear-gradient(135deg, #f4f0ff 0%, #ffffff 55%, #e8e0ff 100%)',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 18, height: 18, borderRadius: 6, background: '#6e3cff' }} />
        <div style={{ fontSize: 26, fontWeight: 600, color: '#2a0e7a' }}>{copy.title}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div
          style={{
            fontSize: title.length > 60 ? 54 : 66,
            fontWeight: 700,
            lineHeight: 1.15,
            color: '#0e0e11',
            letterSpacing: '-0.02em',
          }}
        >
          {title.slice(0, 110)}
        </div>
        {subtitle && <div style={{ fontSize: 28, color: '#5b5b63', lineHeight: 1.4 }}>{subtitle.slice(0, 140)}</div>}
      </div>

      <div style={{ display: 'flex', fontSize: 24, color: '#6e3cff', fontWeight: 500 }}>blog.rooquiz.com</div>
    </div>,
    ogSize,
  )
}
