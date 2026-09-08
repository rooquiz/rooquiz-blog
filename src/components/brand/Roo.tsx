/* eslint-disable @next/next/no-img-element */
import { clsx } from 'clsx'

/**
 * 吉祥物 Roo。位图，不是 SVG。
 *
 * 参照稿里的袋鼠是一张三维渲染的插画（柔光、软阴影、渐变皮毛），SVG 画不出来 ——
 * 之前那版矢量袋鼠是照着它「翻译」的扁平版，一眼看出是另一个角色。
 * 现在直接用原稿位图（`public/brand/roo.webp`，从设计交付的 1490×1056 PNG
 * 裁到内容边界再缩到 720 宽），头部单独裁一张给文字商标用。
 *
 * 刻意用原生 `<img>` 而不是 `next/image`：
 *   - 两张图的展示尺寸由 CSS 写死（英雄区 ≤ 19rem 宽、商标 1.6em 高），
 *     已经按 2× 出稿，不需要 srcset；
 *   - `next/image` 会把它们绕到 /_next/image 这个 serverless 端点上，
 *     而品牌图每页都出现，白白给全站加一条运行时依赖（文章配图另说，
 *     那些是运行时才知道尺寸的远端图，仍然走 next/image）。
 * 尺寸属性必须留着 —— 缺了会在图片解码前塌成 0 高，英雄区跳一下。
 */

/** 英雄区那只：坐着、抱平板。720×795 是原稿裁切后的 2× */
export function RooMascot({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <img
      src="/brand/roo.webp"
      alt=""
      width={720}
      height={795}
      className={clsx('roo', className)}
      // 英雄区那只在首屏正中，不要懒加载：它是最大的那块内容，晚一步就是一次可见的跳动
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      aria-hidden
    />
  )
}

/** 只有头的那枚。文字商标、页脚签名、无封面兜底都用它 */
export function RooHead({ className }: { className?: string }) {
  return (
    <img
      src="/brand/roo-head.webp"
      alt=""
      width={190}
      height={278}
      className={clsx('roo', className)}
      loading="eager"
      decoding="async"
      aria-hidden
    />
  )
}
