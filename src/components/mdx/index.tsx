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

  // 站内相对链接：作者在 MDX 里直接写 /my-post（去掉多语言后不再有 locale 前缀）。
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

/**
 * 表格外面套一层横向滚动的壳。
 *
 * 不套的话宽表格会把整个 `.article__body` 顶宽 —— 表格的最小内容宽度是硬的
 * （列不会自己折行），窄屏上实测 390px 视口里正文被撑到 510px，
 * 而 body 上那条 `overflow-x: clip` 会把多出来的部分直接切掉，读者根本
 * 看不到右边那几列。让表格自己滚，正文的行长就还是正文的行长。
 *
 * 加 tabindex 是为了键盘可达：能滚的容器必须能被聚焦，否则只有鼠标能滚它。
 */
function MdxTable(props: ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="prose__scroll" tabIndex={0} role="region" aria-label="Table">
      <table {...props} />
    </div>
  )
}

export const mdxComponents = {
  a: Anchor,
  img: MdxImage,
  table: MdxTable,
}
