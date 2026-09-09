import type { ReactNode } from 'react'
import { clsx } from 'clsx'

import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { Sky } from './Sky'

/**
 * 页面外壳：一片天（装饰层）+ 站点头 + 内容 + 页脚。
 *
 * 天是绝对定位的装饰，站点头和内容都在它上面正常流动（见 Sky.tsx）。
 * 所以调用处不用关心「内容会不会盖到云上」—— 需要压在天里的东西
 * （首页的英雄区、内页的标题）自己把上边距排够就行。
 *
 * 传了 hero 就是内页：天缩矮，标题块排在云上方的空里。
 * 不传就是首页：天拉满，children 自己负责在这片天里排出英雄区。
 * 换句话说「有没有标题块」和「天有多高」是同一个决定。
 */
export function SiteFrame({
  section,
  hero,
  children,
}: {
  section?: 'journal' | 'tags' | 'search'
  /** 内页的标题块（眉标 + h1 + 元信息）。首页不传 */
  hero?: ReactNode
  children: ReactNode
}) {
  return (
    <>
      {/*
       * 类名用 clsx 拼，不要写成模板字符串里带前导空格的分支
       * （`` `frame${hero ? '' : ' frame--home'}` ``）——
       * prettier-plugin-tailwindcss 会把 className 里的字符串当类名列表处理，
       * 顺手把那个前导空格 trim 掉，两个类名就粘成一个了。跑一次 `pnpm format` 就中招。
       */}
      <div className={clsx('frame', !hero && 'frame--home')}>
        <Sky size={hero ? 'short' : 'tall'} />

        <div className="shell">
          <SiteHeader section={section} />
        </div>

        {hero && <div className="shell frame__hero">{hero}</div>}

        {children}
      </div>

      <SiteFooter />
    </>
  )
}
