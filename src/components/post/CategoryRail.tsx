import Link from 'next/link'
import { site, type Locale } from '@config'

import { localePath } from '@/lib/content'
import { t } from '@/lib/i18n'
import { Kangaroo } from '@/components/brand/Kangaroo'
import { ArrowRightIcon } from '@/components/layout/Icons'

/**
 * 首页右侧边栏：分类胶囊 + 订阅 + 关于。
 *
 * 三块都是「读完这篇之后还能去哪」，按可能性从高到低排 ——
 * 换个分类接着读 > 订阅以后接着读 > 去主站看产品。
 *
 * 分类只列前十个。这一栏的作用是给出入口而不是给出全集，
 * 全集在 /tags 那页，末尾那条链接过去。
 */
const MAX_CATEGORIES = 10

export function CategoryRail({ tags, locale }: { tags: { tag: string; count: number }[]; locale: Locale }) {
  const copy = t(locale)

  return (
    <aside className="home__side">
      {tags.length > 0 && (
        <section className="side__block">
          <h2 className="u-eyebrow">{copy.browseByCategory}</h2>
          <div className="side__chips">
            {tags.slice(0, MAX_CATEGORIES).map(({ tag, count }) => (
              <Link key={tag} href={localePath(locale, 'tags', tag)} className="chip">
                {tag}
                <span className="chip__count">{count}</span>
              </Link>
            ))}
          </div>
          {tags.length > MAX_CATEGORIES && (
            <Link href={localePath(locale, 'tags')} className="u-more mt-4 text-[var(--fs-small)]">
              {copy.allCategories}
              <ArrowRightIcon />
            </Link>
          )}
        </section>
      )}

      <section className="side__block">
        <h2 className="u-eyebrow">{copy.subscribeEyebrow}</h2>
        <div className="side__card">
          <p>{copy.subscribeBody}</p>
          <Link href={localePath(locale, 'feed.xml')} className="u-more">
            {copy.subscribeCta}
            <ArrowRightIcon />
          </Link>
        </div>
      </section>

      <section className="side__block">
        <h2 className="u-eyebrow">{copy.aboutEyebrow}</h2>
        <div className="side__card">
          <p>{copy.aboutBody}</p>
          <a href={site.organization.url} className="u-more">
            {copy.aboutCta}
            <ArrowRightIcon />
          </a>
          {/* 负边距让它坐在卡片右下角、半个身子探出卡外 */}
          <Kangaroo idPrefix="side-roo" className="side__roo" simplified />
        </div>
      </section>
    </aside>
  )
}
