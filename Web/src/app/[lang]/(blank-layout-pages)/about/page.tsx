import { redirect } from 'next/navigation'

// Moved to front-pages/about so it renders with the real site Header/Footer/FrontMenu (this
// (blank-layout-pages) group is chrome-free by design, for auth/error pages) and matches the
// site's actual theme instead of the old dark/amber template styling. Kept as a redirect so any
// bookmarked /en/about (or other locale prefix) link still works.
export default function AboutRedirect() {
  redirect('/front-pages/about')
}
