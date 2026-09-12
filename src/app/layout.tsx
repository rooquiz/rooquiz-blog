import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Figtree } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { site } from '@config'

import { absoluteUrl } from '@/lib/seo'
import { MotionGateScript } from '@/components/layout/motion-gate'
import { ThemeScript } from '@/components/layout/theme'

import '@/styles/globals.css'

/**
 * 根 layout。
 *
 * 早先全站页面都在 `/[locale]` 段下、`<html lang>` 由路由段决定（Next 的官方 i18n 范式）；
 * 去掉多语言之后这一层回到 `src/app/` 根上，`lang` 写死 `en`（见 site.config.ts 顶部）。
 * /api、/sitemap.xml、/robots.txt 是 Route Handler 与 metadata 文件，不走这个 layout。
 */

/**
 * 全站一款字 Figtree，选它的完整理由见 styles/globals.css 顶部。
 * 只取拉丁子集 —— 站点只有英文，用不到别的子集。
 */
const sans = Figtree({
  subsets: ['latin'],
  display: 'swap',
  variable: '--next-font-sans',
})

/**
 * 浏览器 UI（地址栏、下拉回弹区）的底色跟着天空走，不跟正文底色走 ——
 * 页面最顶端是那片蓝，地址栏染成白色会在天上方切出一条突兀的边。
 */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#a3d7fd' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0a22' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl('/')),
  title: { default: site.title, template: `%s · ${site.title}` },
  description: site.description,
  applicationName: site.title,
  authors: [{ name: site.organization.name, url: site.organization.url }],
  creator: site.organization.name,
  publisher: site.organization.name,
  /*
   * 预览规格要显式放开。Google 的默认值是小缩略图 + 一段自己截的短摘要；
   * `max-image-preview: large` 决定了图文结果与 Discover 里能不能出大图，
   * `max-snippet: -1` 是不限制摘要长度 —— 对以问句开头的长文，
   * 摘要能不能把答案那一句完整带上，就差在这一条。
   * 各页面的 noIndex 由 buildMetadata 单独覆盖（见 lib/metadata.ts 里的说明）。
   */
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    siteName: site.title,
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    /* suppressHydrationWarning：ThemeScript 会在水合之前往 <html> 上写 data-theme，
       服务端渲染的属性集和客户端首帧对不上是预期内的 */
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <body>
        {/* 必须是 body 的第一个子节点 —— 它要在页面内容被解析出来之前跑完，否则会闪一下浅色 */}
        <ThemeScript />
        {/* 紧跟其后，同样要在内容解析之前跑完：它决定首页入场动画的起点成不成立 */}
        <MotionGateScript />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
