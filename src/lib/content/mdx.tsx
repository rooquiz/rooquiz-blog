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
              /*
               * 两套主题都只出 CSS 变量（--shiki-light / --shiki-dark），不写内联的
               * color / background-color —— 内联样式压过一切选择器，默认那档
               * （defaultColor: 'light'）会把浅色主题的字色和白底钉死在 <pre> 上，
               * 暗色下就是深底页面里一块白纸。取用在 globals.css，按 html[data-theme] 挑。
               */
              defaultColor: false,
              // 未标语言的围栏也交给 Shiki（按纯文本渲染）。少了这条它整个绕开 Shiki，
              // 出来的 <pre> 一个颜色都没有，落回 typography 那套「深底浅字」的默认值 ——
              // 而本站的代码块是浅底，字就淡得几乎看不见。fallbackLanguage 管的是
              // 标了但 Shiki 不认识的语言，两条都要。
              defaultLanguage: 'text',
              fallbackLanguage: 'text',
            },
          ],
        ],
      },
    },
  })

  return content
}
