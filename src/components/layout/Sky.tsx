import { Clouds, Contrails } from '@/components/brand/Clouds'

/**
 * 页面顶部那片天。**只是一层装饰**，不包内容。
 *
 * 它绝对定位在 `.frame` 的顶部、高度写死，内容照常在文档流里从头排下来，
 * 于是「天有多高」和「内容有多长」彻底解耦 —— 首页的英雄区文字、右栏的
 * 分类与订阅可以一路排到天以下的纸面上，中间没有任何断点。
 * 早先把内容套在天里面（天的高度由内容撑），结果是天要么被内容顶得很高，
 * 要么得靠负 margin 把下面的内容拽回来，两条都要按断点手调。
 *
 * 站点头也压在这片天上，不吸顶 —— 吸顶头一旦滚出这片天就得自己长出一层底色，
 * 而那层底色什么时候出现只有 JS 知道。天留在文档流里，全站零滚动监听。
 *
 * 两种高度：
 *   tall  —— 首页。整套演出：两座云塔 + 尾迹 + 坐在云上的袋鼠（袋鼠在内容层里）。
 *   short —— 内页。矮一半，只留云，标题排在云上方那段空里。
 */
export function Sky({ size }: { size: 'tall' | 'short' }) {
  return (
    <div className={`sky sky--${size}`} aria-hidden>
      {size === 'tall' && <Contrails className="sky__trails" />}
      <Clouds className="sky__clouds" band={size === 'tall' ? 'full' : 'low'} />
    </div>
  )
}
