import type { Metadata } from 'next'

import { sitePath } from '@/lib/routes'
import { copy } from '@/lib/i18n'
import { buildMetadata } from '@/lib/metadata'
import { SiteFrame } from '@/components/layout/SiteFrame'
import { SearchClient } from '@/components/post/SearchClient'

export const dynamic = 'force-static'

export function generateMetadata(): Metadata {
  // 搜索页本身没有内容价值，不进索引
  return buildMetadata({ title: copy.search, path: sitePath('search'), noIndex: true })
}

export default function SearchPage() {
  return (
    <SiteFrame
      section="search"
      hero={
        <>
          <p className="u-eyebrow">{copy.journal}</p>
          <h1 className="u-display">{copy.search}</h1>
        </>
      }
    >
      <main className="shell shell--narrow page">
        <SearchClient />
      </main>
    </SiteFrame>
  )
}
