import type { CSSProperties } from 'react'

/**
 * Three broad cloud silhouettes based on the supplied wide-screen reference.
 * The oversized SVG is cropped on narrow screens, preserving the scale of the
 * shapes instead of squeezing them into a row of tiny bumps.
 */
const layers = [
  {
    fill: 'var(--cloud-back)',
    drift: 18,
    duration: '34s',
    d: 'M-80 118 C40 96 118 126 194 184 C250 226 300 205 352 170 C418 125 486 136 558 210 C598 250 628 258 660 224 C704 177 778 174 848 235 C895 276 908 326 952 320 C1002 312 1028 266 1084 260 C1154 252 1190 310 1230 356 C1260 390 1282 387 1312 340 C1360 264 1445 232 1532 244 C1618 256 1668 232 1718 190 C1792 128 1882 128 1972 186 C2020 216 2060 200 2128 166 L2128 540 L-80 540 Z',
  },
  {
    fill: 'var(--cloud-mid)',
    drift: -12,
    duration: '27s',
    d: 'M-80 205 C40 195 106 226 174 294 C211 331 231 352 262 345 C304 336 333 296 392 276 C510 236 686 248 818 300 C914 338 995 423 1072 468 C1116 494 1148 475 1186 438 C1245 381 1313 370 1395 396 C1483 424 1572 482 1633 481 C1685 480 1681 424 1708 359 C1752 252 1902 199 2128 214 L2128 540 L-80 540 Z',
  },
  {
    fill: 'var(--paper)',
    drift: 8,
    duration: '22s',
    d: 'M-80 220 C45 208 116 236 190 310 C224 344 248 371 279 360 C323 344 348 306 410 286 C526 250 687 253 817 298 C925 335 1009 412 1080 488 C1112 522 1138 535 1170 520 C1246 484 1302 438 1406 436 C1490 434 1548 460 1592 461 C1638 462 1658 420 1680 348 C1712 249 1865 214 2128 230 L2128 540 L-80 540 Z',
  },
] as const

export function Clouds({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 2048 520" preserveAspectRatio="none" aria-hidden>
      {layers.map(layer => (
        <path
          key={layer.fill}
          className="cloud__layer"
          d={layer.d}
          fill={layer.fill}
          style={{ '--drift': layer.drift, '--dur': layer.duration } as CSSProperties}
        />
      ))}
    </svg>
  )
}
