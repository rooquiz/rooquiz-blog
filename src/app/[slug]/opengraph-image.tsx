import { notFound } from 'next/navigation'

import { getAllPostParams, getPost } from '@/lib/content'
import { formatStamp } from '@/lib/format'
import { ogContentType, ogSize, renderOgImage } from '@/lib/og'

export const size = ogSize
export const contentType = ogContentType

/** 每篇文章一张静态 PNG，构建期生成 */
export async function generateStaticParams() {
  return getAllPostParams()
}

export default async function PostOpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const post = await getPost(slug)
  if (!post) notFound()

  return renderOgImage({
    title: post.title,
    subtitle: post.summary,
    stamp: formatStamp(post.publishedAt),
  })
}
