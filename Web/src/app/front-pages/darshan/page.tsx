import { notFound } from 'next/navigation'

// Daily Darshan is an App-only feature.
// Deities and Bhajans are managed via Admin Content Management (/apps/mandir-setu/content/darshan-daily)
// and served directly to the mobile app via /api/darshan-daily.
const DarshanPage = () => {
  notFound()
}

export default DarshanPage
