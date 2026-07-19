type SearchData = {
  id: string
  name: string
  url: string
  excludeLang?: boolean
  icon: string
  section: string
  shortcut?: string
}

const data: SearchData[] = [
  {
    id: '1',
    name: 'Landing Front',
    url: '/front-pages/landing-page',
    excludeLang: true,
    icon: 'tabler-file-description',
    section: 'Front Pages'
  },
  {
    id: '2',
    name: 'Pricing Front',
    url: '/front-pages/pricing',
    excludeLang: true,
    icon: 'tabler-file-description',
    section: 'Front Pages'
  },
  {
    id: '3',
    name: 'Payment Front',
    url: '/front-pages/payment',
    excludeLang: true,
    icon: 'tabler-file-description',
    section: 'Front Pages'
  },
  {
    id: '4',
    name: 'Checkout Front',
    url: '/front-pages/checkout',
    excludeLang: true,
    icon: 'tabler-file-description',
    section: 'Front Pages'
  },
  {
    id: '5',
    name: 'Help Center Front',
    url: '/front-pages/help-center',
    excludeLang: true,
    icon: 'tabler-file-description',
    section: 'Front Pages'
  }
]

export default data
