/**
 * JSON-LD（schema.org）。
 *
 * 全站的结构化数据都从这里出，写法是**一张 `@graph`**：同一页里的实体各自带 `@id`，
 * 互相只放引用。好处有两个 ——
 *   - 不用在一页里把 Organization 重复三遍（文章的 author、publisher、面包屑的根都指它）；
 *   - 解析器（Google、以及各家 AI 抓取端）能把跨页面的同 `@id` 节点合并成一个实体。
 *
 * **`@id` 必须是真的被定义过的节点**。早先文章页写 `publisher: { '@id': 'https://rooquiz.com/#organization' }`
 * 却从不输出那个节点 —— 那是一条悬空引用，rich results 测试里 publisher 直接是空的。
 * 现在每张图都把 Organization / WebSite 一起带上，引用才落得到实处。
 */
import { site } from '@config'

import type { PostMeta } from './content/types'
import { copy } from './i18n'
import { sitePath } from './routes'
import { absoluteUrl } from './seo'

type Node = Record<string, unknown>

export interface JsonLdGraph {
  '@context': 'https://schema.org'
  '@graph': Node[]
}

/** 组织实体与主站共用同一个 `@id`（见 site.config.ts），博客只是它的一个出版物 */
const ORG_ID = site.organization.id
const WEBSITE_ID = absoluteUrl('/#website')
const BLOG_ID = absoluteUrl('/#blog')

const pageId = (path: string) => `${absoluteUrl(path)}#webpage`
const breadcrumbId = (path: string) => `${absoluteUrl(path)}#breadcrumb`

/** Google 对 headline 的上限是 110 字符，超了这条结构化数据会被判无效 */
function headline(title: string): string {
  return title.length <= 110 ? title : `${title.slice(0, 109).trimEnd()}…`
}

function graph(nodes: Node[]): JsonLdGraph {
  return { '@context': 'https://schema.org', '@graph': nodes }
}

// ---------------------------------------------------------------------------
// 常驻节点：每一页都带这三个，页面自己的节点挂在它们下面
// ---------------------------------------------------------------------------

function organizationNode(): Node {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: site.organization.name,
    url: site.organization.url,
    logo: { '@type': 'ImageObject', url: absoluteUrl(site.organization.logo) },
    // 同一实体在别处的主页。这串链接是给消歧用的，不是社交入口
    sameAs: [...site.organization.sameAs],
  }
}

function websiteNode(): Node {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: absoluteUrl(sitePath()),
    name: site.title,
    description: site.description,
    inLanguage: 'en',
    publisher: { '@id': ORG_ID },
  }
}

function blogNode(): Node {
  return {
    '@type': 'Blog',
    '@id': BLOG_ID,
    url: absoluteUrl(sitePath()),
    name: site.title,
    description: site.description,
    inLanguage: 'en',
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORG_ID },
  }
}

// ---------------------------------------------------------------------------
// 通用零件
// ---------------------------------------------------------------------------

interface Crumb {
  name: string
  path: string
}

/**
 * 面包屑。第一级永远是首页，最后一级是当前页。
 * 最后一级刻意**不带 item** —— 规范允许省略，Google 也建议当前页不要再自链。
 */
function breadcrumbNode(path: string, trail: Crumb[]): Node {
  return {
    '@type': 'BreadcrumbList',
    '@id': breadcrumbId(path),
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      ...(i < trail.length - 1 ? { item: absoluteUrl(crumb.path) } : {}),
    })),
  }
}

/**
 * 列表页的 ItemList：把这一页列出的文章按顺序枚举一遍。
 * 人看得到的是那一列卡片，机器看到的是这张表 —— 生成式检索靠它一次拿全
 * 「这个站在这个主题下有哪些文章」，而不用逐个爬 HTML。
 */
function itemListNode(path: string, posts: PostMeta[]): Node {
  return {
    '@type': 'ItemList',
    '@id': `${absoluteUrl(path)}#list`,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: posts.length,
    itemListElement: posts.map((post, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(sitePath(post.slug)),
      name: post.title,
    })),
  }
}

function collectionPageNode({
  path,
  name,
  description,
  posts,
  hasBreadcrumb,
}: {
  path: string
  name: string
  description: string
  posts: PostMeta[]
  hasBreadcrumb: boolean
}): Node {
  return {
    '@type': 'CollectionPage',
    '@id': pageId(path),
    url: absoluteUrl(path),
    name,
    description,
    inLanguage: 'en',
    isPartOf: { '@id': WEBSITE_ID },
    ...(hasBreadcrumb ? { breadcrumb: { '@id': breadcrumbId(path) } } : {}),
    ...(posts.length > 0 ? { mainEntity: { '@id': `${absoluteUrl(path)}#list` } } : {}),
  }
}

/**
 * 作者。默认署名（「RooQuiz Team」）就是组织自己，但**名字要和页面上那行署名一字不差** ——
 * Google 明确拿可见署名和结构化数据对账，对不上会把 author 判为不可信。
 * 所以这里不复用 Organization 那个 `@id`（它的 name 是「RooQuiz」），而是就地写一个节点。
 */
function authorNode(author: string): Node {
  return author === site.defaultAuthor
    ? { '@type': 'Organization', name: author, url: site.organization.url }
    : { '@type': 'Person', name: author }
}

/** 文章配图：封面优先，没有封面就用构建期生成的那张 OG 图 */
function postImages(post: PostMeta): string[] {
  return [post.coverUrl ?? absoluteUrl(sitePath(post.slug, 'opengraph-image'))]
}

// ---------------------------------------------------------------------------
// 各页面的图
// ---------------------------------------------------------------------------

/** 首页 / 分页页：博客本体 + 这一页列出的文章 */
export function blogIndexJsonLd(
  posts: PostMeta[],
  { path, page, description }: { path: string; page: number; description?: string },
): JsonLdGraph {
  const isFirstPage = page === 1
  const name = isFirstPage ? site.title : `${site.title} · ${copy.pageN(page)}`

  return graph([
    organizationNode(),
    websiteNode(),
    blogNode(),
    {
      ...collectionPageNode({
        path,
        name,
        // 与这一页 <meta name="description"> 同一句话。两处漂开就等于对同一页给了两种说法
        description: description ?? site.description,
        posts,
        hasBreadcrumb: !isFirstPage,
      }),
      // 第一页就是博客本体那个实体，分页页只是它的一段
      ...(isFirstPage ? { '@id': pageId(path), about: { '@id': BLOG_ID } } : { isPartOf: { '@id': BLOG_ID } }),
    },
    itemListNode(path, posts),
    ...(isFirstPage
      ? []
      : [
          breadcrumbNode(path, [
            { name: copy.journal, path: sitePath() },
            // 面包屑里那一级写「Page 2」就够了，带上站名会让这一级读起来像另一个站
            { name: copy.pageN(page), path },
          ]),
        ]),
  ])
}

/** 单篇文章：WebPage + BlogPosting + 面包屑 */
export function postJsonLd(post: PostMeta, { wordCount }: { wordCount: number }): JsonLdGraph {
  const path = sitePath(post.slug)
  const url = absoluteUrl(path)
  const images = postImages(post)

  /* 面包屑走「首页 → 分类归档 → 本文」。中间那级用第一个标签 ——
     它在站内是真实存在的一页（/tags/xxx），不是为了凑层级编出来的。 */
  const trail: Crumb[] = [{ name: copy.journal, path: sitePath() }]
  if (post.tags[0]) trail.push({ name: post.tags[0], path: sitePath('tags', post.tags[0]) })
  trail.push({ name: post.title, path })

  return graph([
    organizationNode(),
    websiteNode(),
    blogNode(),
    {
      '@type': 'WebPage',
      '@id': pageId(path),
      url,
      name: post.title,
      description: post.summary,
      inLanguage: 'en',
      isPartOf: { '@id': WEBSITE_ID },
      breadcrumb: { '@id': breadcrumbId(path) },
      primaryImageOfPage: { '@type': 'ImageObject', url: images[0] },
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
    },
    {
      '@type': 'BlogPosting',
      '@id': `${url}#article`,
      headline: headline(post.title),
      name: post.title,
      description: post.summary,
      url,
      mainEntityOfPage: { '@id': pageId(path) },
      isPartOf: { '@id': BLOG_ID },
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: authorNode(post.author),
      publisher: { '@id': ORG_ID },
      image: images,
      inLanguage: 'en',
      // keywords 给数组而不是逗号串：两种写法 Google 都收，数组对其它解析器更稳
      keywords: post.tags,
      articleSection: post.tags[0],
      wordCount,
      timeRequired: `PT${post.readingMinutes}M`,
    },
    breadcrumbNode(path, trail),
  ])
}

/** 分类总览页 */
export function tagsIndexJsonLd(tags: { tag: string; count: number }[]): JsonLdGraph {
  const path = sitePath('tags')

  return graph([
    organizationNode(),
    websiteNode(),
    {
      '@type': 'CollectionPage',
      '@id': pageId(path),
      url: absoluteUrl(path),
      name: copy.categories,
      description: `Every topic covered on ${site.title}.`,
      inLanguage: 'en',
      isPartOf: { '@id': WEBSITE_ID },
      breadcrumb: { '@id': breadcrumbId(path) },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: tags.length,
        itemListElement: tags.map(({ tag }, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: absoluteUrl(sitePath('tags', tag)),
          name: tag,
        })),
      },
    },
    breadcrumbNode(path, [
      { name: copy.journal, path: sitePath() },
      { name: copy.categories, path },
    ]),
  ])
}

/** 单个分类的归档页 */
export function tagArchiveJsonLd(tag: string, posts: PostMeta[], description: string): JsonLdGraph {
  const path = sitePath('tags', tag)

  return graph([
    organizationNode(),
    websiteNode(),
    collectionPageNode({ path, name: copy.postsUnderTag(tag), description, posts, hasBreadcrumb: true }),
    itemListNode(path, posts),
    breadcrumbNode(path, [
      { name: copy.journal, path: sitePath() },
      { name: copy.categories, path: sitePath('tags') },
      { name: tag, path },
    ]),
  ])
}
