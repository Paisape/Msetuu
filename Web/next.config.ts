import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH,

  // These three entry points are served via rewrite (not redirect) so the browser's address
  // bar stays exactly where the visitor typed/clicked — localhost:3000 shows the landing page
  // directly instead of bouncing to .../front-pages/landing-page, and /login and /MsetuAdmin
  // load immediately instead of round-tripping through a visible redirect first.
  rewrites: async () => {
    return [
      { source: '/', destination: '/front-pages/landing-page' },
      { source: '/login', destination: '/en/login' },
      { source: '/MsetuAdmin', destination: '/en/apps/mandir-setu' },
      { source: '/:lang(en|fr|ar)/MsetuAdmin', destination: '/:lang/apps/mandir-setu' }
    ]
  },
  redirects: async () => {
    return [
      {
        source: '/:lang(en|fr|ar)',
        destination: '/front-pages/landing-page',
        permanent: false,
        locale: false
      },
      {
        source: '/:path((?!en|fr|ar|front-pages|images|api|favicon.ico|login).*)*',
        destination: '/en/:path*',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig
