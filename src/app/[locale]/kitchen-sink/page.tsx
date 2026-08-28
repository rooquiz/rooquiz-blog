// 注意：barrel `@heroui/react` 在 Server Component 里会炸（它的依赖图里有 client-only）。
// 走 per-component 子路径，客户端边界由各组件自己的 "use client" 声明。
import { Button } from '@heroui/react/button'
import { Card } from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import { Link } from '@heroui/react/link'
import { Pagination } from '@heroui/react/pagination'
import { Separator } from '@heroui/react/separator'

/**
 * 临时验证页：确认 HeroUI v3 装对了、品牌紫覆盖生效、暗色不塌。
 * M3 完成后删掉本目录（它不进 sitemap，也不该被索引）。
 */

export const dynamic = 'force-static'

export const metadata = { robots: { index: false, follow: false } }

export default function KitchenSinkPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">HeroUI v3 · brand token check</h1>
        <p className="text-[var(--muted)]">
          下面每个组件的主色都应该是站点的洋红 <code>--accent</code>（浅色下 <code>#e4008c</code>），
          圆角应该是 <code>--radius</code>，而不是 HeroUI 默认的蓝色与默认圆角。
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium tracking-wide uppercase">Button</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button isDisabled>Disabled</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium tracking-wide uppercase">Link</h2>
        <Link href="https://rooquiz.com">rooquiz.com</Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium tracking-wide uppercase">Chip（文章标签）</h2>
        <div className="flex flex-wrap gap-2">
          <Chip>lead-generation</Chip>
          <Chip>quiz-design</Chip>
          <Chip>coaching</Chip>
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-sm font-medium tracking-wide uppercase">Card（列表卡片）</h2>
        <Card>
          <Card.Header>
            <Card.Title>How to build a quiz funnel that converts</Card.Title>
            <Card.Description>2026-08-27 · 6 min read</Card.Description>
          </Card.Header>
          <Card.Content>
            <p>正文摘要占位。卡片底色来自 HeroUI 的 --surface，文字色来自被我们覆盖过的 --foreground。</p>
          </Card.Content>
        </Card>
      </section>

      {/* HeroUI 的 Pagination 建立在 react-aria Button 上，只接受 onPress、不接受 href，
          所以它渲染的是按钮而非可爬取的 <a>。真实列表页的分页会用 next/link 自己实现，
          这里只是确认配色。 */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium tracking-wide uppercase">Pagination（仅配色验证）</h2>
        <Pagination>
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous>Prev</Pagination.Previous>
            </Pagination.Item>
            <Pagination.Item>
              <Pagination.Link isActive>1</Pagination.Link>
            </Pagination.Item>
            <Pagination.Item>
              <Pagination.Link>2</Pagination.Link>
            </Pagination.Item>
            <Pagination.Item>
              <Pagination.Ellipsis />
            </Pagination.Item>
            <Pagination.Item>
              <Pagination.Next>Next</Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium tracking-wide uppercase">Prose（MDX 正文排版）</h2>
        <div className="prose">
          <h3>小标题</h3>
          <p>
            正文段落，含一个<a href="#">行内链接</a>与 <code>inline code</code>。
          </p>
          <blockquote>引用块的左边框应该是浅紫色。</blockquote>
          <ul>
            <li>列表项一</li>
            <li>列表项二</li>
          </ul>
        </div>
      </section>
    </main>
  )
}
