import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://mandirsetuu.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/blog',
          '/blog/*',
          '/about',
          '/front-pages/*',
          '/o/*',
          '/t/*',
          '/uploads/*'
        ],
        disallow: [
          '/api/*',
          '/en/apps/*',
          '/:lang/apps/*',
          '/MsetuAdmin'
        ]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  }
}
