import { notFound } from 'next/navigation'
import { LOCALES, site } from '@config'

import { isLocale } from '@/lib/content'
import { ogContentType, ogSize, renderOgImage } from '@/lib/og'

export const size = ogSize
export const contentType = ogContentType

/** 不加这个的话这条路由会退化成运行时 serverless 渲染，OG 图就不是构建期固化的了 */
export function generateStaticParams() {
  return LOCALES.map(locale => ({ locale }))
}
/** 站点级 OG 图（首页 / 列表页共用） */
export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const copy = site.locales[locale]
  return renderOgImage({ title: copy.title, subtitle: copy.tagline, locale })
}
