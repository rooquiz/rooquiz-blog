import { notFound } from 'next/navigation'

import { getAllPostParams, getPost, isLocale } from '@/lib/content'
import { formatStamp } from '@/lib/format'
import { ogContentType, ogSize, renderOgImage } from '@/lib/og'

export const size = ogSize
export const contentType = ogContentType

/** 每篇文章一张静态 PNG，构建期生成 */
export async function generateStaticParams() {
  return getAllPostParams()
}

export default async function PostOpengraphImage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  const post = await getPost(locale, slug)
  if (!post) notFound()

  return renderOgImage({
    title: post.title,
    subtitle: post.summary,
    locale,
    stamp: formatStamp(post.publishedAt, locale),
  })
}
