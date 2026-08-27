import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { Anybody, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { LOCALES, site, type Locale } from '@config'

import { absoluteUrl } from '@/lib/seo'

import '@/styles/globals.css'

/**
 * 这就是根 layout —— 全站页面都在 /[locale] 下，
 * 把 <html lang> 交给路由段来决定（Next.js 官方 i18n 范式）。
 * /api、/sitemap.xml、/robots.txt、/feed.xml 是 Route Handler 与 metadata 文件，不需要 layout。
 */

/**
 * 展示字体。视觉稿的日期大标题是 Eurostile Bold Extended 那一路的方形宽体，
 * Google Fonts 里只有 Anybody 对得上（它带 wdth 可变轴，所以宽度是选出来的
 * 而不是横向拉伸出来的 —— 拉伸会让竖笔画变粗、横笔画不变，一眼假）。
 * 这里只声明 wdth 轴，具体取值在 CSS 里按用途给（标题 125，小字 112）。
 */
const display = Anybody({
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
  variable: '--next-font-display',
})

/** 正文。原稿正文那个平顶的「3」和双层「a」就是 Space Grotesk */
const body = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--next-font-body',
})

export function generateStaticParams() {
  return LOCALES.map(locale => ({ locale }))
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
    <html lang={locale} className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
