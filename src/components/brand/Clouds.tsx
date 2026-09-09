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
      /*
       * 这两团是补上去堵缝的，别删。基座矩形从 y=304 起，而上面那两团塔基的下沿
       * 分别停在 179 和 296 —— x 小于 185 单位的那一段没有任何云团跨过 304，
       * 基座的直角上边就直接露出来，是一道 8 级灰阶的笔直横线（2000px 宽的屏上
       * 落在 y≈610，实测 244 → 252）。要判断某团云有没有盖住 304，
       * 看 `cy − ry ≤ 304 ≤ cy + ry`。
       */
      [40, 300, 110],
      [150, 316, 100],
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
 * 几朵单独漂浮的小云，排在三层云带**上方那片空天**里（cy 40–75，都在中段天际线
 * 之上），画在三层之后面 —— 于是它飘过塔顶时是被云带挡住的，读作更远处的云。
 *
 * 和三层云带的关键差别是**它们可以单向循环**。云带只能 `alternate` 来回摆，因为
 * 满幅图形首尾接不上（见 motion.css 里 `cloud-drift` 的说明）；而孤立的小团起点和
 * 终点都在画布之外、`.sky` 又是 `overflow: hidden`，所以回绕那一瞬看不见 ——
 * 这才是真的「飘过去」，不是「来回晃」。
 *
 * 每朵的横移区间由自己的 `cx` 算出来（见下面的 `--x-from` / `--x-to`）：
 * 从完全飘出左边到完全飘出右边。这样**关掉动画时它就停在 `cx` 上**，
 * 减少动态偏好下是三朵散在天上的云，而不是挤在左边缘的一堆。
 *
 * `phase` 是负延迟的比例，两个作用：把三朵的相位错开（否则它们排成一列同步平移），
 * 以及让**页面刚打开时三朵都在天上**。算法是
 * `phase = (想要的绝对 x − cx − x_from) / (x_to − x_from)`，
 * 现在这三个值对应初始落点约 300 / 820 / 1250。
 * 周期都在 80–150s：这是背景里的云，慢到读者不会盯着它看。
 *
 * 只有首页那片满高的天有它们。内页的取景框从 y=150 开窗（见 LOW_BAND），
 * 而它们全在 100 以上，天然落在窗外。
 *
 * 每朵各自一个滤镜组，不要合成一个 —— 滤镜会让整组的包围盒每帧重绘，
 * 合起来那个盒子横跨整张画布，白白多出一大片持续重绘的区域。
 */
const FLOATERS: {
  cx: number
  cy: number
  lobes: [number, number, number][]
  dur: string
  phase: number
  reverse?: boolean
}[] = [
  {
    cx: 430,
    cy: 54,
    lobes: [
      [-42, 8, 29],
      [0, -8, 38],
      [36, 10, 26],
    ],
    dur: '96s',
    phase: 0.28,
  },
  {
    cx: 880,
    cy: 72,
    lobes: [
      [-50, 10, 35],
      [-4, -13, 47],
      [45, 12, 31],
    ],
    dur: '148s',
    /* 唯一一朵往左飘的。和中层云带的漂移同向，右飘的两朵于是有了参照，读出视差 */
    reverse: true,
    phase: 0.47,
  },
  {
    cx: 1210,
    cy: 40,
    lobes: [
      [-29, 6, 20],
      [0, -7, 27],
      [27, 8, 18],
    ],
    dur: '78s',
    phase: 0.74,
  },
]

/**
 * 内页那条矮云用的取景框。**不是把整幅云压扁**，而是只开一扇窗看它的下半截 ——
 * `preserveAspectRatio="none"` 会按盒子高度纵向缩放，340 单位塞进 150px 的话
 * 每一团云都被压成扁椭圆，一排下来读作「一串气泡」而不是云。
 * 换成裁窗之后纵向仍是 1:1，露出来的就是这幅云本来的下沿。
 * 「纵向 1:1」这件事由 `--cloud-h-sm` 保证：它按画布宽度算出这 190 个单位该占
 * 多少 px，所以 2000 / 2560 上云带会跟着长高，而不是被横向拉扁（见 tokens.css）。
 *
 * 窗口上沿取 150 而不是更低：远层基座的上边缘在 200，那是一条直线，
 * 窗口贴着它开的话这条直线就成了云带的顶边，横贯整个视口一眼是矩形。
 *
 * **但从 150 开窗并不会「露出起伏的天际线」——那句原话是错的，已量过。**
 * 裁剪只会露出云团的**内部**，不会产生轮廓：y=150 那条线上 83% 的宽度都被云团
 * 覆盖，剩下 17% 是四段缝，所以裁出来仍然是一道近乎连续的直线，
 * 实测 28/255（11%），1440 / 2000 / 2560 上都一样。换哪个 y 开窗都逃不掉，
 * 除非那个高度几乎没有云。
 *
 * 真正的解法在 CSS 里：`.sky--short .sky__clouds` 给顶边加了 3rem 的 mask 渐隐，
 * 把这条裁剪线化到透明、让底下那片天的渐变透出来（见 sky.css）。
 * 所以**改 LOW_BAND.y 之前先想清楚那条渐隐还够不够长**。
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
         * 漂浮那几朵用更小的 σ。σ=3 是按云带那些半径 90–110 的大团定的，
         * 用在半径 20–45 的小团上，柔化的比例是它的四五倍 —— 整朵被抹成一团雾，
         * 轮廓全没了。2 对小团大致相当于大团用 3 的观感。
         */}
        <filter id="cloud-soft-sm" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" />
        </filter>

        {/*
         * 收底纱。**不是装饰，是修接缝的。**
         *
         * 云团各自的明暗渐变（下面那组 cloud-lobe-*）在 78% 处是背光档，而底部那些
         * 云团的包围盒大半在画布之外，露出来的正好是还没回到本色的那一段 ——
         * 于是画布底边被裁开时，上面是 246–253、下面是纯白纸面，一道 6 级灰阶的
         * 笔直横线横贯全宽。灰阶差很小，但直边最容易被眼睛抓住（马赫带）。
         *
         * 这层纱从 y=264 的全透明渐变到 **y=336** 的纸色不透明（不是 340）：
         * 渐变必须在画布底边**之前**就到满，最后那几个单位要是实心纸色。
         * 写成 341 试过 —— 可见的最后一行只到 0.97 不透明，底下的云色还透出 3%，
         * 于是纸面线上仍留着 1 级灰阶的一道线。梯度之外靠 spreadMethod 的默认
         * pad 续成实色，所以 336 到 384 那一段是纯 --paper。
         *
         * 于是最后几行严格等于 --paper，与正文底色完全连续，接缝在数学上消失。
         * 代价是云带最下面那 77 个单位被抹平 —— 那一段实测本来就是一片
         * 246→253 的平坦色块，没有形状信息，抹掉不损失任何东西。
         *
         * `gradientUnits="userSpaceOnUse"`：y 要按 viewBox 单位算，不是按矩形自己的
         * 包围盒 —— 内页那条矮云（band="low"）用的是同一张画布的下半截，
         * 两者必须落在同一个绝对高度上。
         */}
        <linearGradient id="cloud-hem" gradientUnits="userSpaceOnUse" x1="0" y1="264" x2="0" y2="336">
          <stop offset="0%" stopColor="var(--paper)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--paper)" stopOpacity="1" />
        </linearGradient>

        {/*
         * 漂浮那几朵的填充。上亮下暗和云带同一个idiom（objectBoundingBox，
         * 每个圆各拿一份从顶到底的渐变，交叠处界线自己浮出来）。
         *
         * **但两档都必须取在天的亮度之上**，不能直接复用远层那份渐变：
         * 远层的背光档 `--cloud-back-lo` (#c2e4fe) 亮度 222.6，而它所在高度的天是
         * 223 —— 对大片云海无所谓（背光只出现在团与团的交界），可孤立的小团有一半
         * 面积就是背光，那一半直接溶进天里，实测整朵只剩 +1.4/255 的对比。
         * 现在走 `--cloud-float-hi` / `--cloud-float-lo` 两个 token（定义与取值理由
         * 在 tokens.css），相对那片天分别是 +26 和 +14，两半都看得见。
         * 那两个 token 在暗色下是对调的 —— 夜里三层的亮度关系整体翻转，
         * 照抄浅色的顺序光就变成从下面来的。
         */}
        <linearGradient id="cloud-float-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--cloud-float-hi)" />
          <stop offset="55%" stopColor="var(--cloud-float-hi)" />
          <stop offset="100%" stopColor="var(--cloud-float-lo)" />
        </linearGradient>

        {/*
         * 每团云自己的明暗。gradientUnits 用默认的 objectBoundingBox，
         * 于是每个 circle 各拿一份从顶到底的渐变 —— 交叠处两团的明暗对不上，
         * 界线就自己浮出来了，不用画一根线。
         *
         * 收尾那一档必须回到 fill 本色：云团的下半截压在同色的基座矩形上，
         * 停在 shade 的话会在圆的下缘切出一道弧。**但底部那些云团的包围盒大半在
         * 画布之外，露出来的是还没回到本色的那一段** —— 这就是要有收底纱的原因。
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

      {band === 'full' &&
        FLOATERS.map(f => (
          <g
            key={f.cx}
            className="cloud__float"
            filter="url(#cloud-soft-sm)"
            style={
              {
                /* 从完全飘出一侧到完全飘出另一侧；260 是留给自身半宽加模糊的余量 */
                '--x-from': f.reverse ? 1512 - f.cx + 260 : -(f.cx + 260),
                '--x-to': f.reverse ? -(f.cx + 260) : 1512 - f.cx + 260,
                '--dur': f.dur,
                '--delay': `calc(${f.dur} * -${f.phase})`,
              } as CSSProperties
            }
          >
            {f.lobes.map(([dx, dy, r]) => (
              <circle key={`${dx}-${dy}`} cx={f.cx + dx} cy={f.cy + dy} r={r} fill="url(#cloud-float-fill)" />
            ))}
          </g>
        ))}

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

      {/* 收底纱压在最后，且不进滤镜组 —— 它要的是干净的渐变，不需要软边 */}
      <rect x={-200} y={264} width={1912} height={120} fill="url(#cloud-hem)" />
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
