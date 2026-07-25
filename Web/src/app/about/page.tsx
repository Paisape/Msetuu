import { redirect } from 'next/navigation'

// Moved to front-pages/about so it renders with the real site Header/Footer/FrontMenu. Kept as
// a redirect so any bookmarked /about link still works.
export default function AboutRedirect() {
  redirect('/front-pages/about')
}
