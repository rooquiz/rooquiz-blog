import type { ReactNode } from 'react'

import { Clouds } from '@/components/brand/Clouds'
import { Kangaroo } from '@/components/brand/Kangaroo'
import { RainbowArc } from '@/components/brand/RainbowArc'

/**
 * 每一页的顶部都是一片天，站点头压在它最深的那一段上。
 *
 * 这样安排是为了不做吸顶头：吸顶头一旦滚出英雄区就得自己长出一层底色，
 * 而那层底色要么盖住正文要么在滚动时闪一下 —— 两种都要 JS 去听滚动。
 * 天空常驻在文档流里、头部留在天里，一行 JS 都不用，代价只是页面头会随滚动离开。
 *
 * 两种尺寸：
 *   tall  —— 首页。整套演出：彩虹拱 + 坐在拱下的袋鼠 + 三层云。
 *   short —— 内页。只留云和一只从云后探头的袋鼠，标题排在云上方的空里。
 *
 * 层序（后面的压前面的）：天 → 彩虹拱 → 云 → 袋鼠 → 内容。
 * 拱脚因此没在半空中断掉，而是插进云里；袋鼠则坐在云前面。
 */
export function Sky({
  size,
  children,
}: {
  size: 'tall' | 'short'
  /** 站点头，以及内页的标题块 */
  children: ReactNode
}) {
  return (
    <div className={`sky sky--${size}`}>
      {size === 'tall' && (
        <>
          <RainbowArc className="sky__arc" />
          <Clouds className="sky__clouds" />
          {/*
           * 外面这层 span 只负责定位（绝对定位 + 横向居中），SVG 只负责动。
           * 分开是必须的：居中靠的是 translate: -50%，而入场的落下与常驻的呼吸
           * 也要写 translate —— 同一个元素上两者会互相覆盖，袋鼠会在动画第一帧
           * 直接横向弹到左边去。
           */}
          <span className="sky__roo">
            <Kangaroo idPrefix="hero-roo" className="sky__roo-art" />
          </span>
        </>
      )}

      {size === 'short' && (
        <>
          <Clouds className="sky__clouds" />
          {/* 内页那只小一号，坐在云线右端 */}
          <span className="sky__roo sky__roo--peek">
            <Kangaroo idPrefix="peek-roo" className="sky__roo-art" simplified />
          </span>
        </>
      )}

      <div className="sky__content">{children}</div>
    </div>
  )
}
