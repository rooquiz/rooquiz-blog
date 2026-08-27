import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
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
    <html lang={locale} suppressHydrationWarning>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
