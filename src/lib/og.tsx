import fs from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { site, type Locale } from '@config'

/** OG 图尺寸 / MIME —— 供各 opengraph-image.tsx 直接 re-export */
export const ogSize = { width: 1200, height: 630 } as const
export const ogContentType = 'image/png'

/**
 * 渲染 OG 图（1200×630）。构建期由 opengraph-image.tsx 的文件约定生成静态 PNG，
 * 运行时没有 /api/og。
 *
 * 配色与排版跟站内一致：纸白底、近黑字、洋红点缀、直角、发丝线，
 * 标题走展示字体 Anybody，副标题走 Space Grotesk。
 * 这里写 hex 而不是 CSS 变量 —— Satori 不解析 var()。
 */

const FONT_DIR = path.join(process.cwd(), 'src', 'lib', 'og-fonts')

/**
 * Satori 不读 CSS，必须喂字体二进制，所以字体文件提交在仓库里
 * （来源与取法见 og-fonts/README.md）。
 * 只在构建期读一次盘，跨多张 OG 图复用。
 */
let fontCache: { display: Buffer; body: Buffer } | null = null

async function loadFonts() {
  if (!fontCache) {
    const [display, body] = await Promise.all([
      fs.readFile(path.join(FONT_DIR, 'anybody-800.ttf')),
      fs.readFile(path.join(FONT_DIR, 'spacegrotesk-300.ttf')),
    ])
    fontCache = { display, body }
  }
  return fontCache
}

/** 截断到词边界再补省略号 —— 直接 slice 会把最后一个词切断，OG 图上很显眼 */
function clamp(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  // 中文没有空格，切不出词边界时就硬截
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}

const INK = '#0a0a0a'
const PAPER = '#ffffff'
const ACCENT = '#e4008c'
const MUTED = '#6e6e6e'
const RULE = '#e6e6e6'

export async function renderOgImage({
  title,
  subtitle,
  locale,
  /** 有日期就在左上角压一个日期戳，和列表页的大标题同一个角色 */
  stamp,
}: {
  title: string
  subtitle?: string
  locale: Locale
  stamp?: string
}): Promise<ImageResponse> {
  const copy = site.locales[locale]
  const fonts = await loadFonts()

  // 标题越长字号越小。展示字体是方形宽体，同样字数比常规字体宽得多
  const titleSize = title.length > 78 ? 52 : title.length > 46 ? 64 : 78

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: PAPER,
        fontFamily: 'Body',
      }}
    >
      {/* 左侧那条窄影像带的位置：OG 图里没有配图可放，用一块洋红实色顶上 */}
      <div style={{ display: 'flex', width: 78, background: ACCENT }} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          padding: '56px 64px',
          borderLeft: `1px solid ${RULE}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Display' }}>
            <div style={{ fontSize: 22, letterSpacing: 2, color: INK }}>ROOQUIZ</div>
            <div style={{ fontSize: 22, letterSpacing: 2, color: ACCENT }}>BLOG</div>
          </div>
          {stamp && (
            <div style={{ display: 'flex', fontFamily: 'Display', fontSize: 24, letterSpacing: 3, color: MUTED }}>
              {stamp}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Display',
              fontSize: titleSize,
              lineHeight: 1.06,
              letterSpacing: -0.5,
              color: INK,
            }}
          >
            {clamp(title, 110)}
          </div>
          {subtitle && (
            <div style={{ display: 'flex', marginTop: 26, fontSize: 27, lineHeight: 1.45, color: MUTED }}>
              {clamp(subtitle, 130)}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: `1px solid ${RULE}`,
            paddingTop: 22,
            fontFamily: 'Display',
            fontSize: 18,
            letterSpacing: 3,
            color: MUTED,
          }}
        >
          <div style={{ display: 'flex' }}>{copy.title.toUpperCase()}</div>
          <div style={{ display: 'flex', color: ACCENT }}>BLOG.ROOQUIZ.COM</div>
        </div>
      </div>
    </div>,
    {
      ...ogSize,
      fonts: [
        { name: 'Display', data: fonts.display, style: 'normal', weight: 800 },
        { name: 'Body', data: fonts.body, style: 'normal', weight: 300 },
      ],
    },
  )
}
