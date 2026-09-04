import '@/app/globals.css'
import '@assets/iconify-icons/generated-icons.css'
import MetaPixel from '@/components/MetaPixel'

export const metadata = {
  title: 'Mandirsetuu — Special Offers & Pujas',
  description: 'Book divine pujas and sacred offerings at historic temples with Mandirsetuu.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="w-full" suppressHydrationWarning>
      <body className="flex w-full min-h-screen flex-col" suppressHydrationWarning>
        <MetaPixel />
        {children}
      </body>
    </html>
  )
}
