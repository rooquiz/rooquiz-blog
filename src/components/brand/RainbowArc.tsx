import type { CSSProperties } from 'react'

/**
 * 彩虹拱门 —— 英雄区的主角，袋鼠就坐在它下面。
 *
 * 结构：八条同心圆弧，每条用「圆头虚线」描边，于是每一小段看起来是一颗独立的
 * 圆角药丸。环色从内到外由热粉走到深蓝（--arc-1 … --arc-8，见 tokens.css）。
 *
 * 三个几何决定，都是为了让它看起来是「砌」出来的而不是「画」出来的：
 *
 * 1. 药丸尺寸恒定，数量随半径变。外环更长所以颗数更多 —— 反过来（等分角度）
 *    会让外圈的药丸被拉长，一眼就露出这是同一段路径缩放出来的。
 * 2. 每环的虚线周期由弧长整除得来，不是写死的常数。写死会在弧的两端剩下半颗，
 *    末端参差不齐。
 * 3. 相邻环错开半个周期，砌出砖缝一样的交错。同相位的话八条环的缝会对齐成
 *    八条放射状的白线，整个拱门会被劈开。
 *
 * 另外所有环的下端落在同一条水平线上（Y_END），而不是同一个角度：外环因此比内环
 * 多张开一点，拱脚是平的，像是踩在地面上而不是悬空的一段圆环。
 */

/** 圆心在画布底部之下一点，于是可见的只有拱顶那一段 */
const CX = 500
const CY = 520
const R_INNER = 272
const R_OUTER = 452
const RINGS = 7
/** 拱脚落位。所有环的端点都在这条线上 */
const Y_END = 496
/** 环的描边粗细。环距 (R_OUTER-R_INNER)/(RINGS-1) = 30，留出约 9 的环间空隙 */
const STROKE = 21
/** 一颗药丸的目标视觉长度与相邻两颗之间的空隙 */
const PILL = 44
const PILL_GAP = 11

interface Ring {
  d: string
  color: string
  dasharray: string
  dashoffset: number
  /** 一个虚线周期的长度。动效里药丸沿弧「流动」正好走这么远，走完无缝接回 */
  period: number
}

function buildRings(): Ring[] {
  const step = (R_OUTER - R_INNER) / (RINGS - 1)

  return Array.from({ length: RINGS }, (_, i) => {
    const r = R_INNER + i * step

    /*
     * 端点角（自水平线起算）：CY - r·sinθ = Y_END。
     * 半径越大 θ 越小，也就是外环张得更开 —— 正是我们要的平拱脚。
     */
    const theta = Math.asin((CY - Y_END) / r)
    const x = r * Math.cos(theta)
    const y = CY - (CY - Y_END)

    /*
     * 从左脚顺时针扫过拱顶到右脚。跨度 π-2θ 恒小于 π，所以 large-arc-flag 取 0；
     * SVG 的 y 轴朝下，「由左下经上到右下」在这个坐标系里是顺时针，sweep-flag 取 1。
     */
    const d = `M ${(CX - x).toFixed(2)} ${y.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${(CX + x).toFixed(2)} ${y.toFixed(2)}`

    // 用弧长整除出周期，保证两端都是完整的一颗
    const arcLength = r * (Math.PI - 2 * theta)
    const count = Math.max(1, Math.round(arcLength / (PILL + PILL_GAP)))
    const period = arcLength / count

    /*
     * 圆头端帽会让一段长 L 的虚线实际画出 L + STROKE。
     * 所以要得到视觉长度 PILL、空隙 PILL_GAP，dasharray 得各自补偿一个 STROKE。
     */
    const dash = Math.max(0.1, (period * PILL) / (PILL + PILL_GAP) - STROKE)
    const gap = period - dash

    return {
      d,
      color: `var(--arc-${i + 1})`,
      dasharray: `${dash.toFixed(2)} ${gap.toFixed(2)}`,
      // 相邻环错开半个周期，砌出砖缝
      dashoffset: i % 2 === 0 ? 0 : period / 2,
      period,
    }
  })
}

const RINGS_DATA = buildRings()

export function RainbowArc({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox={`0 0 1000 ${Y_END}`}
      fill="none"
      /* 药丸必须保持圆头：横向拉伸会把端帽压成椭圆，一眼看出是被拽宽的 */
      preserveAspectRatio="xMidYMax meet"
      aria-hidden
    >
      {RINGS_DATA.map((ring, i) => (
        <path
          key={i}
          className="arc__ring"
          d={ring.d}
          stroke={ring.color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={ring.dasharray}
          /*
           * 这三个自定义属性只服务于动效（见 styles/motion.css）：
           *   --ring   环序号，用来错开入场时间，由内向外依次绽开
           *   --offset / --period  药丸沿弧流动的起点与一个完整周期
           * 关掉动效时它们没有任何作用 —— 静态位置由下面的 strokeDashoffset 属性给。
           */
          style={
            {
              '--ring': i,
              '--offset': ring.dashoffset,
              '--period': ring.period,
            } as CSSProperties
          }
          strokeDashoffset={ring.dashoffset}
        />
      ))}
    </svg>
  )
}
