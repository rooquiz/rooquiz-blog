import type { Metadata } from 'next'
import Link from 'next/link'

import { getAllTags } from '@/lib/content'
import { sitePath } from '@/lib/routes'
import { copy } from '@/lib/i18n'
import { buildMetadata } from '@/lib/metadata'
import { SiteFrame } from '@/components/layout/SiteFrame'

export const dynamic = 'force-static'

export function generateMetadata(): Metadata {
  return buildMetadata({ title: copy.categories, path: sitePath('tags') })
}

export default async function TagsIndexPage() {
  const tags = await getAllTags()

  return (
    <SiteFrame
      section="tags"
      hero={
        <>
          <p className="u-eyebrow">{copy.browseByCategory}</p>
          <h1 className="u-display">{copy.categories}</h1>
        </>
      }
    >
      <main className="shell page">
        {tags.length === 0 ? (
          <p className="page__empty">{copy.empty}</p>
        ) : (
          <ul className="tagcloud">
            {tags.map(({ tag, count }) => (
              <li key={tag}>
                <Link href={sitePath('tags', tag)} className="chip">
                  {tag}
                  <span className="chip__count">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </SiteFrame>
  )
}
