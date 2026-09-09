import { site } from '@config'

import { ogContentType, ogSize, renderOgImage } from '@/lib/og'

export const size = ogSize
export const contentType = ogContentType

/** 站点级 OG 图（首页 / 列表页共用） */
export default function OpengraphImage() {
  return renderOgImage({ title: site.title, subtitle: site.tagline })
}
