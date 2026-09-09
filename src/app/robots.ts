import type { MetadataRoute } from 'next'

import { absoluteUrl } from '@/lib/seo'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 搜索页与临时验证页不该被抓
      disallow: ['/search', '/kitchen-sink'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
