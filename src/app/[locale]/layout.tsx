import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { Figtree } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { LOCALES, site, type Locale } from '@config'

import { absoluteUrl } from '@/lib/seo'
import { MotionGateScript } from '@/components/layout/motion-gate'
import { ThemeScript } from '@/components/layout/theme'

import '@/styles/globals.css'

/**
 * 这就是根 layout —— 全站页面都在 /[locale] 下，
 * 把 <html lang> 交给路由段来决定（Next.js 官方 i18n 范式）。
 * /api、/sitemap.xml、/robots.txt、/feed.xml 是 Route Handler 与 metadata 文件，不需要 layout。
 */

/**
 * 全站一款字 Figtree，选它的完整理由见 styles/globals.css 顶部。
 * 只取拉丁子集 —— 中文本来就落到系统 CJK 字体。
 */
const sans = Figtree({
  subsets: ['latin'],
  display: 'swap',
  variable: '--next-font-sans',
})

export function generateStaticParams() {
  return LOCALES.map(locale => ({ locale }))
}

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

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const copy = site.locales[locale]
  return {
    metadataBase: new URL(absoluteUrl('/')),
    title: { default: copy.title, template: `%s · ${copy.title}` },
    description: copy.description,
    openGraph: {
      type: 'website',
      siteName: copy.title,
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
    },
    twitter: { card: 'summary_large_image' },
  }
}

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  return (
    /* suppressHydrationWarning：ThemeScript 会在水合之前往 <html> 上写 data-theme，
       服务端渲染的属性集和客户端首帧对不上是预期内的 */
    <html lang={locale} className={sans.variable} suppressHydrationWarning>
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
