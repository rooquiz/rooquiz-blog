import type { JsonLdGraph } from '@/lib/jsonld'

/**
 * 把一张 JSON-LD 图渲染成 `<script type="application/ld+json">`。
 *
 * 输出前把 `<` 转成 Unicode 转义：JSON 里只要出现 `</script`，浏览器就在那里
 * 提前闭合这个标签，后面整段 JSON 漏成页面文本。内容虽然都来自我们自己的索引，
 * 但标题里写一个 `<` 就能触发，转义一次比信任输入便宜。
 */
export function JsonLd({ data }: { data: JsonLdGraph }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
