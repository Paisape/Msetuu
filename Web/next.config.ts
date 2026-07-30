import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH,
  output: "standalone",
  experimental: {
    cpus: 1,
    memoryBasedWorkersCount: true
  },
  typescript: {
    ignoreBuildErrors: true
  },

  // These three entry points are served via rewrite (not redirect) so the browser's address
  // bar stays exactly where the visitor typed/clicked — localhost:3000 shows the landing page
  // directly instead of bouncing to .../front-pages/landing-page, and /login and /MsetuAdmin
  // load immediately instead of round-tripping through a visible redirect first.
  rewrites: async () => {
    return [
      { source: '/', destination: '/front-pages/landing-page' },
      { source: '/login', destination: '/en/login' },
      { source: '/MsetuAdmin', destination: '/en/apps/mandir-setu' },
      { source: '/:lang(en|fr|ar)/MsetuAdmin', destination: '/:lang/apps/mandir-setu' },
      // Force any localized upload paths back to the public/uploads directory
      // to bypass any permanently cached 308 redirects from earlier bugs.
      { source: '/:lang(en|fr|ar)/uploads/:path*', destination: '/uploads/:path*' }
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
        source: '/:path((?!en|fr|ar|front-pages|images|uploads|audio|api|favicon.ico|login|next.svg|vercel.svg).*)*',
        destination: '/en/:path*',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig
