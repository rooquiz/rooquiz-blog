import type { CSSProperties } from 'react'

/**
 * 云。三层软边积云，从底部往上堆。
 *
 * 画法：每层就是「一块基座矩形 + 一排骑在它上面的圆」，同色不透明填充 ——
 * 同色圆的并集天然光滑，不会在交叠处留缝。软边靠一个 feGaussianBlur，
 * 参照稿里云的边缘有大约 6px 的过渡，硬边剪影读起来是贴纸不是云。
 *
 * 三条别动的规矩：
 *
 * 1. **画布是 1512 单位宽、按视口拉伸的**（`preserveAspectRatio="none"`）。
 *    1512 就是参照稿的视口宽，所以在 15 寸屏上是 1:1。宽屏会横向拉长 ——
 *    对这种大团软边云是可接受的（读作「云更大」），而且必须如此：
 *    两侧那两座高塔是构图的骨架，得永远贴着视口左右边缘。
 *    组件自己不设最小宽度，由 CSS 的 `width: max(100vw, 84rem)` 兜住窄屏
 *    （窄屏改成居中裁切，否则波长被压短，天际线读成扇贝花边）。
 *
 * 2. **底边 y=340 就是纸面线**。最前那层的填充色是 `--paper`，
 *    所以云带底部和正文底色是同一个颜色，天与纸之间没有硬边。
 *    任何一层的基座都不能高于 300，否则会在底部露出一条天色。
 *
 * 3. **两座高塔在最左最右，中间是一段低平的云原**，而且中段那三层要拉开档次：
 *    远层顶边约 y=170、中层约 220、纸色那层约 280。参照稿就是这个构图 ——
 *    标题的末行衬在浅蓝的远层上，纸色只从更低的地方漫上来。
 *    把中层调得接近纯白试过一版，纸色实际上被顶到了 y=200，
 *    标题一多半直接落在白底上，「天空之下是读物」整句话就读不出来了。
 *
 * 4. **每层要用十几团中等大小的云，不要用四五团特大的**。
 *    半径全开到 150+ 试过一版：那样每层只剩三四个巨型圆，交叠界线也跟着变少，
 *    天际线成了两三条大弧，读作「白色色块」而不是积云。
 *    现在每层十七八团、半径大多在 90–110 之间，只有两侧塔顶才放大。
 *
 * 袋鼠脚下那座白丘不在这里 —— 它跟着袋鼠自己走（见 site.css 的 .home__perch::before）。
 * 画在云里的话，宽屏拉伸会把丘和袋鼠错开，袋鼠就悬空了。
 */

/**
 * 一团云：[圆心 x, 圆心 y, 横半径, 纵半径?]。顶边 = cy - ry。
 * 省略纵半径就是正圆。左边那座塔必须用椭圆 —— 参照稿里它又高又窄
 * （60px 横向落 220px），正圆做不出这个侧坡，只能摊成一大片。
 */
type Lobe = [number, number, number] | [number, number, number, number]

const LAYERS: { fill: string; shade: string; base: number; drift: number; duration: string; lobes: Lobe[] }[] = [
  {
    // 最远那层，浅蓝。中段的天际线由它撑起来（顶边约 170），标题末行就衬在这片浅蓝上
    fill: 'var(--cloud-back)',
    shade: 'var(--cloud-back-lo)',
    base: 200,
    drift: 16,
    duration: '38s',
    lobes: [
      [20, 120, 104],
      [110, 130, 130],
      [200, 200, 100],
      [280, 240, 100],
      [370, 240, 100],
      [460, 262, 92],
      [540, 238, 100],
      [640, 234, 98],
      [760, 238, 100],
      [860, 258, 96],
      [940, 246, 96],
      [1020, 232, 100],
      [1090, 244, 90],
      [1170, 196, 106],
      [1250, 300, 100],
      [1330, 266, 130],
      [1430, 200, 140],
      [1560, 150, 150, 190],
    ],
  },
  {
    fill: 'var(--cloud-mid)',
    shade: 'var(--cloud-mid-lo)',
    base: 250,
    drift: -11,
    duration: '29s',
    lobes: [
      [60, 150, 118],
      [180, 214, 108],
      [270, 274, 100],
      [350, 292, 96],
      [440, 320, 92],
      [530, 306, 96],
      [620, 296, 100],
      [720, 330, 94],
      [810, 320, 96],
      [890, 288, 104],
      [970, 262, 106],
      [1055, 306, 100],
      [1140, 330, 108],
      [1260, 316, 120],
      [1350, 258, 140],
      [1450, 194, 130, 186],
      [1570, 160, 150, 190],
    ],
  },
  {
    // 最前一层 = 纸面色。它的底边就是天与正文的交界
    fill: 'var(--paper)',
    shade: 'var(--cloud-fore-lo)',
    base: 304,
    drift: 8,
    duration: '23s',
    lobes: [
      [86, 92, 64, 87],
      [172, 196, 72, 100],
      [258, 248, 92],
      [330, 318, 100],
      [410, 372, 100],
      [500, 366, 96],
      [580, 332, 104],
      [680, 398, 96],
      [770, 400, 98],
      [850, 366, 98],
      [930, 260, 110],
      [1010, 300, 108],
      [1090, 372, 104],
      [1180, 424, 106],
      [1290, 336, 158],
      [1370, 250, 130],
      [1470, 186, 120, 182],
      [1580, 170, 150, 190],
    ],
  },
]

/**
 * 内页那条矮云用的取景框。**不是把整幅云压扁**，而是只开一扇窗看它的下半截 ——
 * `preserveAspectRatio="none"` 会按盒子高度纵向缩放，340 单位塞进 150px 的话
 * 每一团云都被压成扁椭圆，一排下来读作「一串气泡」而不是云。
 * 换成裁窗之后纵向仍是 1:1，露出来的就是这幅云本来的下沿。
 *
 * 窗口上沿取 150 而不是更低：远层基座的上边缘在 200，那是一条直线，
 * 窗口贴着它开的话这条直线就成了云带的顶边，横贯整个视口一眼是矩形。
 * 从 150 开窗，基座那条边被上方那排云团盖住，露出来的才是起伏的天际线。
 */
const LOW_BAND = { y: 150, h: 190 }

export function Clouds({ className, band = 'full' }: { className?: string; band?: 'full' | 'low' }) {
  const view = band === 'low' ? `0 ${LOW_BAND.y} 1512 ${LOW_BAND.h}` : '0 0 1512 340'

  return (
    <svg className={className} viewBox={view} preserveAspectRatio="none" aria-hidden>
      <defs>
        {/*
         * 软边。stdDeviation 是 viewBox 单位（≈ 参照稿的 CSS 像素），3 对应约 6px 的过渡。
         * 别再往上调 —— 5 试过一版，云团之间的界线被抹平，整条云带糊成一片雾。
         * 滤镜区域要放宽到 -20%/140%：默认的 -10%/120% 会把最上那颗圆的模糊裁掉一圈，
         * 表现是塔顶有一道生硬的横切。
         */}
        <filter id="cloud-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>

        {/*
         * 每团云自己的明暗。gradientUnits 用默认的 objectBoundingBox，
         * 于是每个 circle 各拿一份从顶到底的渐变 —— 交叠处两团的明暗对不上，
         * 界线就自己浮出来了，不用画一根线。
         *
         * 收尾那一档必须回到 fill 本色：云团的下半截压在同色的基座矩形上，
         * 停在 shade 的话会在圆的下缘切出一道弧。
         */}
        {LAYERS.map((layer, i) => (
          <linearGradient key={layer.fill} id={`cloud-lobe-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={layer.fill} />
            <stop offset="46%" stopColor={layer.fill} />
            <stop offset="78%" stopColor={layer.shade} />
            <stop offset="100%" stopColor={layer.fill} />
          </linearGradient>
        ))}
      </defs>

      {LAYERS.map((layer, i) => (
        <g
          key={layer.fill}
          className="cloud__layer"
          filter="url(#cloud-soft)"
          style={{ '--drift': layer.drift, '--dur': layer.duration } as CSSProperties}
        >
          {/* 基座画到画布外，横向拉伸时两端不会露缝 */}
          <rect x={-200} y={layer.base} width={1912} height={340 - layer.base + 40} fill={layer.fill} />
          {layer.lobes.map(([cx, cy, rx, ry]) => (
            <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={rx} ry={ry ?? rx} fill={`url(#cloud-lobe-${i})`} />
          ))}
        </g>
      ))}
    </svg>
  )
}

/**
 * 天上那两道细白弧 —— 飞机拉出来的尾迹。
 *
 * 参照稿里有两道，一道在左上角擦过，一道从袋鼠头顶斜下来。
 * 它们唯一的作用是让那片大面积的蓝不那么空；所以极细、极淡，
 * 而且刻意不参与任何动画（一动就变成装饰线，不再像是天上本来有的东西）。
 *
 * 描边色用 `--cloud-back` 而不是 `--paper`：夜里 --paper 是深色，
 * 那条尾迹会变成天上一道**黑**印子。--cloud-back 是「被天光照亮的云」那一档，
 * 明暗两版都比它背后的天亮，两边都成立。
 */
export function Contrails({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1512 260" preserveAspectRatio="none" aria-hidden>
      <g fill="none" stroke="var(--cloud-back)" strokeLinecap="round">
        <path d="M62 -18C126 6 176 26 214 44" strokeWidth={3} opacity={0.5} />
        <path d="M1178 66C1082 96 1000 134 940 182" strokeWidth={4} opacity={0.62} />
      </g>
    </svg>
  )
}
