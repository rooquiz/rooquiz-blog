import { z } from 'zod'

import { LOCALES, RESERVED_SLUGS } from '@config'

/**
 * slug 规则：小写、数字、连字符。
 * 刻意不接受大写与下划线——URL 大小写敏感，混用迟早出两条指向同一篇文章的路径。
 */
const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug 只能是小写字母、数字与单个连字符')
  .refine(value => !RESERVED_SLUGS.has(value), {
    message: 'slug 与站点保留路径冲突（tags / page / search / feed.xml …）',
  })

export const postInputSchema = z.object({
  slug: slugSchema,
  locale: z.enum(LOCALES),
  /** 同一篇文章跨语言的分组键。不传就退化成用 slug，此时中英文各成一篇、无 hreflang 互链 */
  translationKey: z.string().min(1).max(120).optional(),
  title: z.string().min(1).max(300),
  summary: z.string().max(600).default(''),
  tags: z.array(z.string().min(1).max(50)).max(10).default([]),
  coverUrl: z.url().optional(),
  author: z.string().max(120).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  /** ISO 8601。不传且 status=published 时用当前时间 */
  publishedAt: z.iso.datetime().optional(),
  /** MDX 全文（含 frontmatter 与否都可以，渲染时以本字段为准） */
  mdx: z.string().min(1),
  /**
   * 是否在本次写入后触发构建。
   * 批量写入请传 false，最后单独调一次 POST /api/deploy。
   */
  deploy: z.boolean().default(true),
})

export type PostInput = z.infer<typeof postInputSchema>

export const uploadUrlInputSchema = z.object({
  translationKey: z.string().min(1).max(120),
  /** 文件名，只允许安全字符与白名单扩展名 */
  filename: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9][a-z0-9._-]*\.(webp|png|jpg|jpeg|gif|svg)$/i, '文件名不合法或扩展名不在白名单内'),
})
