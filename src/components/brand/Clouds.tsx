import type { CSSProperties } from 'react'

/**
 * 英雄区底部的云层。三层不同深浅的圆丘剪影，层层往前推，最前面那层就是 --paper ——
 * 于是天空不是「停」在某条边上，而是被纸从底下漫上来盖住，天与正文之间没有硬边。
 *
 * 每一层是「一条铺满下半部的矩形 + 若干骑在它上沿的圆」。都用同一个不透明色填充，
 * 相交处自然合并成一条起伏的天际线 —— 比手写一串 A 弧的路径好改得多，
 * 而且不会在圆丘交界处留下尖角（相切的两段圆弧在数学上一定有尖点，
 * 叠圆则天然是光滑的并集）。
 *
 * preserveAspectRatio="none"：圆丘会随视口横向拉伸成扁椭圆。这是有意的 ——
 * 云本来就该随屏幕铺满，而「保持圆」的代价是窄屏上要么裁掉两侧要么把云顶顶出画布。
 * 软剪影被横向拉伸看不出来（彩虹拱那种圆头药丸就不行，所以它用的是 meet）。
 */

interface Layer {
  fill: string
  /** 动效：这一层横向漂移的幅度（viewBox 单位）与一个来回的时长 */
  drift: number
  duration: string
  /** 这一层的地平线，圆丘骑在它上面 */
  base: number
  /** [圆心 x, 圆心 y, 半径] */
  bumps: [number, number, number][]
}

/*
 * 视口盒 1440×300。三层的地平线依次下移，圆丘依次变小 ——
 * 远处的山头高而缓、近处的低而碎，这样才有纵深。
 *
 * 两条数值上的讲究，都是为了不让它读成一排扇贝：
 *   - 半径拉开档次（同层内 1.6 倍以上的差），而不是一串同样大的圆。
 *     大小一致的圆丘顶端连起来是一条规则的正弦波，一眼就是纹样不是云。
 *   - 圆心 y 也各自浮动，不都钉在地平线上。沉下去的那颗只露一小段弧，
 *     和旁边高的那颗叠出前后关系。
 * 相邻圆的圆心间距一律小于两者半径之和，保证处处相交、并集是光滑的。
 */
const LAYERS: Layer[] = [
  {
    fill: 'var(--cloud-back)',
    drift: 26,
    duration: '34s',
    base: 150,
    bumps: [
      [-60, 176, 250],
      [240, 150, 150],
      [470, 196, 196],
      [740, 142, 218],
      [1010, 190, 158],
      [1230, 156, 226],
      [1500, 184, 210],
    ],
  },
  {
    fill: 'var(--cloud-mid)',
    drift: -18,
    duration: '26s',
    base: 208,
    bumps: [
      [-20, 232, 196],
      [220, 208, 132],
      [430, 244, 190],
      [690, 202, 148],
      [900, 236, 206],
      [1180, 200, 138],
      [1400, 230, 184],
    ],
  },
  {
    fill: 'var(--paper)',
    drift: 12,
    duration: '20s',
    base: 258,
    bumps: [
      [-40, 274, 172],
      [180, 258, 112],
      [380, 288, 168],
      [620, 254, 126],
      [830, 282, 176],
      [1090, 260, 118],
      [1290, 286, 164],
      [1500, 268, 150],
    ],
  },
]

export function Clouds({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1440 300" preserveAspectRatio="none" aria-hidden>
      {LAYERS.map(layer => (
        <g
          key={layer.fill}
          className="cloud__layer"
          fill={layer.fill}
          /* 三层各漂各的：幅度、方向、周期都不同，才不会整片云像一块板在平移 */
          style={{ '--drift': layer.drift, '--dur': layer.duration } as CSSProperties}
        >
          {/* 左右各溢出 60，免得窄屏上把 viewBox 压扁后两端露出天空 */}
          <rect x={-60} y={layer.base} width={1560} height={300 - layer.base} />
          {layer.bumps.map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      ))}
    </svg>
  )
}
