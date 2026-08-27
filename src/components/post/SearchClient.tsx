'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import MiniSearch from 'minisearch'
import type { Locale } from '@config'

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

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={event => setQuery(event.target.value)}
        placeholder={copy.searchPlaceholder}
        aria-label={copy.search}
        autoFocus
        className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-transparent px-4 py-3 outline-none focus:border-[var(--accent)]"
      />

      {query.trim().length > 0 && (
        <div className="mt-8">
          {results.length === 0 ? (
            <p className="text-[var(--muted)]">{copy.noResults}</p>
          ) : (
            <ul className="space-y-6">
              {results.map(result => (
                <li key={result.id}>
                  <Link href={`/${locale}/${result.id}`} className="font-medium hover:text-[var(--accent)]">
                    {result.title as string}
                  </Link>
                  <p className="mt-1 text-sm text-[var(--muted)]">{result.summary as string}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
