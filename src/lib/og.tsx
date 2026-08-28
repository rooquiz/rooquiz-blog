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
 * 版式跟站内一致：上方一条天空渐变的带子，一排白圆把它接回纸面（就是站内那三层云
 * 的极简版），下面是标题与摘要。
 *
 * 两个 Satori 限制决定了这里的写法：
 *   - 不解析 CSS 变量，颜色只能写死 hex（下面那组常量与 tokens.css 手工对齐）；
 *   - 任何有多个子节点的元素必须显式 display:flex，漏一个直接抛错而不是排错版。
 * 云也因此是一排 border-radius:50% 的 div 而不是 SVG —— Satori 对 SVG 的支持
 * 只覆盖基本图元，一条带 dasharray 的圆弧（站内那道彩虹拱）它画不出来。
 */

const FONT_DIR = path.join(process.cwd(), 'src', 'lib', 'og-fonts')

/**
 * Satori 不读 CSS，必须喂字体二进制，所以字体文件提交在仓库里
 * （来源与取法见 og-fonts/README.md）。
 * 只在构建期读一次盘，跨多张 OG 图复用。
 */
let fontCache: { bold: Buffer; medium: Buffer } | null = null

async function loadFonts() {
  if (!fontCache) {
    const [bold, medium] = await Promise.all([
      fs.readFile(path.join(FONT_DIR, 'figtree-800.ttf')),
      fs.readFile(path.join(FONT_DIR, 'figtree-500.ttf')),
    ])
    fontCache = { bold, medium }
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

/* 与 tokens.css 的浅色一版手工对齐 */
const INK = '#21203a'
const PAPER = '#ffffff'
const ACCENT = '#e4008c'
const VIOLET = '#5b4bdb'
const MUTED = '#64627f'
const SKY_TOP = '#74c9ea'
const SKY_BOTTOM = '#c8ebfa'

/**
 * 云线：一排骑在天空带下沿的白圆。半径拉开档次、圆心也各自浮沉，
 * 和站内 Clouds.tsx 是同一条讲究 —— 一串同样大、同样高的圆，
 * 顶端连起来是规则的正弦波，读成扇贝花边而不是云。
 * [圆心 x, 圆心 y（相对天空带下沿的偏移，正数为沉下去）, 半径]
 */
const CLOUDS: [number, number, number][] = [
  [-40, 10, 150],
  [180, -6, 96],
  [390, 18, 138],
  [610, -2, 88],
  [800, 14, 146],
  [1030, -8, 92],
  [1220, 16, 132],
]

const BAND_H = 236

export async function renderOgImage({
  title,
  subtitle,
  locale,
  /** 有日期就压在右下角 */
  stamp,
}: {
  title: string
  subtitle?: string
  locale: Locale
  stamp?: string
}): Promise<ImageResponse> {
  const copy = site.locales[locale]
  const fonts = await loadFonts()

  // 标题越长字号越小，保证三行以内排得下
  const titleSize = title.length > 84 ? 50 : title.length > 50 ? 60 : 72

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: PAPER,
        fontFamily: 'Figtree',
      }}
    >
      {/* 天空带 + 云线 */}
      <div
        style={{
          display: 'flex',
          position: 'relative',
          height: BAND_H,
          background: `linear-gradient(to bottom, ${SKY_TOP}, ${SKY_BOTTOM})`,
        }}
      >
        {CLOUDS.map(([cx, dy, r], i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: cx - r,
              top: BAND_H + dy - r,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              background: PAPER,
            }}
          />
        ))}

        {/* 文字商标。Roo 墨色 / Quiz 紫 / BLOG 一枚洋红胶囊，和站内同一套 */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '52px 64px' }}>
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 800, color: INK }}>Roo</div>
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 800, color: VIOLET }}>Quiz</div>
          <div
            style={{
              display: 'flex',
              marginLeft: 14,
              borderRadius: 999,
              background: ACCENT,
              padding: '6px 14px',
              fontSize: 19,
              fontWeight: 800,
              letterSpacing: 2,
              color: PAPER,
            }}
          >
            BLOG
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          padding: '30px 64px 52px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: titleSize,
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: -1.5,
              color: INK,
            }}
          >
            {clamp(title, 110)}
          </div>
          {subtitle && (
            <div style={{ display: 'flex', marginTop: 22, fontSize: 26, lineHeight: 1.45, color: MUTED }}>
              {clamp(subtitle, 128)}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 21,
            fontWeight: 800,
            letterSpacing: 1.5,
            color: MUTED,
          }}
        >
          <div style={{ display: 'flex' }}>{copy.title.toUpperCase()}</div>
          <div style={{ display: 'flex', color: ACCENT }}>{stamp ?? 'BLOG.ROOQUIZ.COM'}</div>
        </div>
      </div>
    </div>,
    {
      ...ogSize,
      fonts: [
        { name: 'Figtree', data: fonts.bold, style: 'normal', weight: 800 },
        { name: 'Figtree', data: fonts.medium, style: 'normal', weight: 500 },
      ],
    },
  )
}
