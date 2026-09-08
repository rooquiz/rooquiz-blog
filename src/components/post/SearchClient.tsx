'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import MiniSearch from 'minisearch'
import type { Locale } from '@config'

import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'

interface SearchDoc {
  id: string
  title: string
  summary: string
  tags: string
  publishedAt: string
}

/**
 * 站内搜索。索引由 pnpm sync 在构建期投影成 public/search-index-<locale>.json，
 * 页面加载后一次性拉下来在浏览器里建索引。
 *
 * 为什么不走 Postgres 全文检索：Supabase 的托管 Postgres 没有中文分词扩展，
 * to_tsvector 对中文等于整段不切；而且纯静态站为了搜索单开一个 serverless 端点不划算。
 * 文章量上千后再切服务端（posts.search_vector 那列已经留着了）。
 */
export function SearchClient({ locale }: { locale: Locale }) {
  const copy = t(locale)
  const [docs, setDocs] = useState<SearchDoc[] | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch(`/search-index-${locale}.json`)
      .then(res => (res.ok ? res.json() : []))
      .then((data: SearchDoc[]) => {
        if (!cancelled) setDocs(data)
      })
      .catch(() => setDocs([]))
    return () => {
      cancelled = true
    }
  }, [locale])

  const engine = useMemo(() => {
    if (!docs) return null
    const mini = new MiniSearch<SearchDoc>({
      fields: ['title', 'summary', 'tags'],
      storeFields: ['title', 'summary', 'publishedAt'],
      searchOptions: {
        boost: { title: 3, tags: 2 },
        prefix: true,
        fuzzy: 0.2,
      },
      // 中文没有空格分词，按字符切；英文仍按词切
      tokenize: text => (locale === 'zh' ? Array.from(text.replace(/\s+/g, '')) : text.split(/[\s\-—/]+/)),
    })
    mini.addAll(docs)
    return mini
  }, [docs, locale])

  const results = useMemo(() => {
    if (!engine || query.trim().length === 0) return []
    return engine.search(query).slice(0, 20)
  }, [engine, query])

  const hasQuery = query.trim().length > 0

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={event => setQuery(event.target.value)}
        placeholder={copy.searchPlaceholder}
        aria-label={copy.search}
        autoFocus
        className="search__field"
      />

      {/*
       * 结果条数放在 aria-live 里播报。搜索是「边打字边换内容」的交互，
       * 读屏器不会自动重读列表，不播报的话用户完全不知道结果变了。
       */}
      <p className="search__count" aria-live="polite">
        {hasQuery ? copy.resultCount(results.length) : ''}
      </p>

      {hasQuery &&
        (results.length === 0 ? (
          <p className="page__empty">{copy.noResults}</p>
        ) : (
          <ul className="rows">
            {results.map(result => (
              <li key={result.id}>
                <Link href={`/${locale}/${result.id}`} className="row__link">
                  <p className="u-meta">
                    <time dateTime={result.publishedAt as string}>
                      {formatDate(result.publishedAt as string, locale)}
                    </time>
                  </p>
                  <h2 className="row__title mt-1">{result.title as string}</h2>
                  <p className="row__summary">{result.summary as string}</p>
                </Link>
              </li>
            ))}
          </ul>
        ))}
    </div>
  )
}
