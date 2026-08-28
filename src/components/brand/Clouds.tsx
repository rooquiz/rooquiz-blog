import type { CSSProperties } from 'react'

/**
 * 英雄区底部的云层。三层不同深浅的圆丘剪影，层层往前推，最前面那层就是 --paper ——
 * 于是天空不是「停」在某条边上，而是被纸从底下漫上来盖住，天与正文之间没有硬边。
 *
 * ── 画布是定宽的，不随视口拉伸 ──
 * viewBox 5120 宽，CSS 也给 5120px（见 sky.css 的 .sky__clouds），居中放置、
 * 两侧溢出由 .sky 的 overflow: clip 裁掉。山丘的物理尺寸因此恒定，窄屏只是少看见
 * 几座，而不是把同样多的山丘挤进更小的宽度里。早先按 width:100% 拉伸过一版，
 * 1440 屏上一堆峰挤在一起，顶端连成规则的正弦波 —— 读出来是扇贝花边，不是云。
 *
 * ── 天际线是算出来的，不是手排的 ──
 * 手排「峰心 + 半宽 + 峰高」调过三轮都不像。问题不在数值调得准不准，而在手排的
 * 起伏天然是规整的：峰距差不多、峰高差不多，一眼就是纹样。要的是一条峰距在三四倍
 * 之间乱跳、相邻峰高能差一倍的曲线。
 *
 * 所以这里用三条**不可通约**周期的正弦叠加，再乘一个落在袋鼠位置的高斯谷。
 * 周期不可通约是关键 —— 取成整数倍的话合成波会以最小公倍数为周期规律重复，
 * 又变回纹样。每一层有自己的一组周期，见 LAYERS 上方的说明。
 *
 * ── 渲染成一排交叠的圆帽 ──
 * 把曲线在横向 64 等分上采样，每段放一个圆帽，帽顶落在该段的高度上。
 * 半宽 capW 远大于段宽（80），相邻帽子层层交叠，并集天然光滑 —— 比手写一串 A 弧
 * 好改得多，也不会在交界处留尖角（相切的两段圆弧一定有尖点，叠圆则不会）。
 * capW 是每层的手感旋钮，取值跟着该层的波长走：调大越圆滑、细节越少，
 * 调小越贴合、越容易起棱。
 *
 * ── 谷的位置和袋鼠绑定 ──
 * 高斯谷的中心 TROUGH_X 就是袋鼠所在（视口中心右侧 331px，换算到画布是 2560 + 331；
 * 见 sky.css 的 --hero-shift），让它坐在一段开阔的天际线上而不是顶在峰尖上。
 * **改 --hero-shift 时 TROUGH_X 要跟着改。**
 *
 * 谷不必压得很狠：彩虹拱压在云之前（层序见 sky.css），不靠这道谷让出来。
 *
 * preserveAspectRatio="none"：纵向随 --cloud-h 缩放，横向始终 1:1。
 * 软剪影被纵向压扁看不出来（彩虹拱那种圆头药丸就不行，所以它用的是 meet）。
 */

const VIEW_W = 5120
const VIEW_H = 456
const BINS = 64
const BIN_W = VIEW_W / BINS
/*
 * 正弦和的增益。三条正弦极少同时到顶，所以合成波的实际峰值只有理论上限的六七成；
 * 这两个数把它拉回 0…1 并轻微削顶，峰才吃得满 maxRise。
 * 削顶还有个好处：顶被压平一点更像云，谷被压平则给出一段平缓的天际线。
 */
const GAIN_OFFSET = 0.62
const GAIN_DIVISOR = 1.2

/** 高斯谷的中心与宽度。中心 = 画布中点 + --hero-shift */
const TROUGH_X = 2560 + 331
const TROUGH_W = 620
/** 谷底把峰高压掉多少。不用压太狠 —— 拱门在云之前，不靠这道谷露出来 */
const TROUGH_DEPTH = 0.82



interface Layer {
  fill: string
  /** 这一层的地平线，圆帽全部骑在它上面 */
  base: number
  /** 最高的一座峰离地平线多高 */
  maxRise: number
  /** 这一层的三条周期与权重 */
  periods: [number, number, number]
  weights: [number, number, number]
  /** 相位。三层各不相同，天际线才不会上下层平行 */
  phase: number
  /** 圆帽半宽。约等于这一层一个云瓣的半宽 */
  capW: number
  /** 动效：横向漂移的幅度（viewBox 单位 = px，因为横向 1:1）与一个来回的时长 */
  drift: number
  duration: string
}

/*
 * **三层的波长必须不同**，这是纵深的来源，也是最容易做错的一处。
 *
 * 远层是一串小圆丘（主波长 ≈ 380，1440 屏上看得到三四瓣）；
 * 近层是一整片大形（主波长 ≈ 2400，一个周期就横跨整屏，只在袋鼠那儿沉下去）；
 * 中层居中过渡。三层用同一组周期试过：要么全是小瓣、要么全是大缓坡，
 * 怎么调都凑不出「远处碎、近处整」的层次。
 *
 * 地平线依次下移、峰依次变矮，配合波长的变化一起给出纵深。
 */
const LAYERS: Layer[] = [
  {
    fill: 'var(--cloud-back)',
    base: 243,
    maxRise: 244,
    periods: [760, 380, 210],
    weights: [0.16, 0.22, 0.08],
    phase: 0.9,
    capW: 140,
    drift: 26,
    duration: '34s',
  },
  {
    fill: 'var(--cloud-mid)',
    base: 324,
    maxRise: 398,
    periods: [1300, 620, 320],
    weights: [0.2, 0.16, 0.06],
    phase: 1.8,
    capW: 190,
    drift: -18,
    duration: '26s',
  },
  {
    fill: 'var(--paper)',
    base: 371,
    maxRise: 310,
    periods: [2400, 1050, 520],
    weights: [0.26, 0.13, 0.05],
    phase: 2.36,
    capW: 280,
    drift: 12,
    duration: '20s',
  },
]

/**
 * 某一层在横坐标 x 处的峰高（0 … maxRise）。
 *
 * 归一化那一步不能省，增益（GAIN_*）也不能随手给。三条正弦极少同时到顶，
 * 峰值利用率只有六七成，而且**每层各不相同**（周期和相位不一样）——
 * 直接调 maxRise 会一直追不上去，表面看是「云太矮」，其实是合成波没跑满量程。
 * 三层的 base / maxRise 是按各自的利用率反解出来的，让天际线落在设定的区间里；
 * 动了周期、相位或增益，这三对数就要重新解一次。
 */
function riseAt(layer: Layer, x: number): number {
  const span = layer.weights[0] + layer.weights[1] + layer.weights[2]
  let n = 0
  for (let i = 0; i < layer.periods.length; i++) {
    n += layer.weights[i] * Math.sin((2 * Math.PI * x) / layer.periods[i] + layer.phase * (i + 1))
  }
  const wave = Math.min(1, Math.max(0, (n + span * GAIN_OFFSET) / (span * GAIN_DIVISOR)))

  // 袋鼠脚下那一段压下去，给彩虹拱让出开阔的天
  const t = (x - TROUGH_X) / TROUGH_W
  const trough = 1 - TROUGH_DEPTH * Math.exp(-t * t)

  return layer.maxRise * wave * trough
}

/**
 * 由 (半宽 w, 峰高 h) 反算出过 (±w, 0) 与 (0, h) 三点的圆。
 * r = (w² + h²) / 2h，圆心沉在地平线下方 r - h。
 */
function capCircle(w: number, h: number) {
  const r = (w * w + h * h) / (2 * h)
  return { r, drop: r - h }
}

export function Clouds({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" aria-hidden>
      {LAYERS.map(layer => (
        <g
          key={layer.fill}
          className="cloud__layer"
          fill={layer.fill}
          /* 三层各漂各的：幅度、方向、周期都不同，才不会整片云像一块板在平移 */
          style={{ '--drift': layer.drift, '--dur': layer.duration } as CSSProperties}
        >
          {/* 左右各溢出 400，给漂移留余量，免得漂到一半端头露出天空 */}
          <rect x={-400} y={layer.base} width={VIEW_W + 800} height={VIEW_H - layer.base} />
          {Array.from({ length: BINS }, (_, i) => {
            const cx = i * BIN_W + BIN_W / 2
            const h = riseAt(layer, cx)
            // 已经贴着地平线的段不用画 —— h→0 时半径趋于无穷
            if (h < 3) return null
            const { r, drop } = capCircle(layer.capW, h)
            return <circle key={i} cx={cx} cy={layer.base + drop} r={r} />
          })}
        </g>
      ))}
    </svg>
  )
}
