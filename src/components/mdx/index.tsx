import type { ComponentPropsWithoutRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { publicEnv } from '@/lib/env'

/**
 * MDX 正文里的元素映射。
 * 全是 Server Component —— 正文这一层不引 HeroUI，
 * 免得每篇文章都拖一份 react-aria 进首屏（HeroUI v3 的组件都是 'use client'）。
 */

/** 站内链接走 next/link 预取；外链补 rel */
function Anchor({ href = '', children, ...props }: ComponentPropsWithoutRef<'a'>) {
  const isExternal = /^https?:\/\//.test(href)

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    )
  }

  // 站内相对链接必须自带 locale 前缀（作者在 MDX 里写 /en/xxx）。
  // 这里不做自动补全：补错了比 404 更难查，交给写入 API 校验更合适。
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  )
}

/**
 * 配图。Storage 公共域的图走 next/image 优化，
 * 其它来源（作者贴的第三方图）退回原生 img，免得 remotePatterns 白名单无限膨胀。
 */
function MdxImage({ src, alt = '', ...props }: ComponentPropsWithoutRef<'img'>) {
  const source = typeof src === 'string' ? src : ''
  const isManagedAsset = Boolean(publicEnv.mediaBaseUrl) && source.startsWith(publicEnv.mediaBaseUrl)

  if (!isManagedAsset) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={source} alt={alt} loading="lazy" {...props} />
  }

  // next/image 要求给 width/height，但 MDX 里的 ![]() 语法带不了尺寸。
  // 这里给的是占位比例，靠 height:auto 让浏览器拿到真实图后按固有比例显示——
  // 否则任何非 1200×630 的图都会被纵向拉伸。代价是加载完成前预留的高度不准（轻微 CLS）；
  // 要彻底消除得在发布时把尺寸一起写进元数据，首版不值得。
  return (
    <Image
      src={source}
      alt={alt}
      width={1200}
      height={630}
      sizes="(max-width: 768px) 100vw, 768px"
      className="rounded-[var(--radius)]"
      style={{ width: '100%', height: 'auto' }}
    />
  )
}

export const mdxComponents = {
  a: Anchor,
  img: MdxImage,
}
