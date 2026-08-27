import { compileMDX } from 'next-mdx-remote/rsc'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import rehypeShiki from '@shikijs/rehype'

import { mdxComponents } from '@/components/mdx'

/**
 * 编译一篇文章的 MDX。只在构建期跑（页面都是 force-static），
 * 所以 Shiki 加载完整语法包的开销无所谓，运行时不承担。
 */
export async function renderMdx(source: string) {
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      // frontmatter 已经在 sync 阶段解析进索引了，这里只要它别被当成正文渲染出来
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap', properties: { className: 'heading-anchor' } }],
          [
            rehypeShiki,
            {
              themes: { light: 'github-light', dark: 'github-dark' },
              // 未标语言的围栏不报错，按纯文本渲染
              fallbackLanguage: 'text',
            },
          ],
        ],
      },
    },
  })

  return content
}
