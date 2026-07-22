'use client'

import { useState, useEffect } from 'react'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

import EntityManager from '@/components/admin/EntityManager'
import type { FieldConfig, ColumnConfig } from '@/components/admin/EntityManager'
import BulkImportPanel from '@/components/admin/BulkImportPanel'
import PujaPackagesDialog from './PujaPackagesDialog'
import MediaGalleryDialog from './MediaGalleryDialog'

// Wraps an EntityManager with a "Bulk Import" panel above it (Chadhava/E-Puja/Products only).
// EntityManager owns its own fetch internally with no exposed refresh method, so a successful
// import bumps `refreshKey` to remount it and pick up the newly-created rows.
const ImportableEntityManager = (props: {
  title: string
  listUrl: string
  itemUrl: (id: string) => string
  fields: FieldConfig[]
  columns: ColumnConfig[]
  emptyMessage?: string
  sampleUrl: string
  importUrl: string
  extraRowActions?: (item: Record<string, any>, refresh: () => Promise<void>) => React.ReactNode
}) => {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div>
      <BulkImportPanel title={props.title} sampleUrl={props.sampleUrl} importUrl={props.importUrl} onImported={() => setRefreshKey(k => k + 1)} />
      <EntityManager
        key={refreshKey}
        title={props.title}
        listUrl={props.listUrl}
        itemUrl={props.itemUrl}
        fields={props.fields}
        columns={props.columns}
        emptyMessage={props.emptyMessage}
        extraRowActions={props.extraRowActions}
      />
    </div>
  )
}

// Fetches the admin-managed category list for a module (see Categories tab below) so listing
// forms can offer a controlled dropdown instead of free text. Falls back to whatever fields were
// passed in unchanged when no categories are configured yet for that module, so the form is
// never blocked before an admin sets up categories.
const useCategoryOptions = (moduleValue: string) => {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    fetch(`/api/categories?module=${encodeURIComponent(moduleValue)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOptions(data.map((c: any) => ({ value: c.name, label: c.name })))
        }
      })
      .catch(() => {
        // Keep the free-text fallback on error
      })
  }, [moduleValue])

  return options
}

const withCategorySelect = (fields: FieldConfig[], categoryOptions: { value: string; label: string }[]): FieldConfig[] =>
  categoryOptions.length === 0
    ? fields
    : fields.map(f => (f.key === 'category' ? { ...f, type: 'select', options: categoryOptions } : f))

const thumb = (item: Record<string, any>) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={item.image} alt='' className='w-12 h-12 object-cover rounded' />
)

// These are exactly the pages that render a Banner/FAQ block today — home plus each service
// page's title/subtitle block. Keep this list in sync with the PageBanner/ServiceFaq usages
// under src/app/front-pages/**, since a page value not used anywhere on the frontend would
// just be a dead admin entry that never displays.
const PAGE_OPTIONS = [
  { value: 'home', label: 'Home' },
  { value: 'chadhava', label: 'Chadhava' },
  { value: 'epuja', label: 'E-Puja' },
  { value: 'jyotish', label: 'Jyotish' },
  { value: 'kundli', label: 'Kundli' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'yatra', label: 'Yatra Booking' },
  { value: 'darshan', label: 'Darshan' },
  { value: 'geotag', label: 'Geo-Tagging' },
  { value: 'login', label: 'Login Page' },
  { value: 'register', label: 'Register Page' }
]

// -- Banners --------------------------------------------------------------
const bannerFields: FieldConfig[] = [
  { key: 'page', label: 'Page', type: 'select', required: true, options: PAGE_OPTIONS },
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
  { key: 'image', label: 'Image', type: 'image', required: true, uploadType: 'banner' },
  { key: 'buttonText', label: 'Button text (primary)', type: 'text' },
  { key: 'buttonLink', label: 'Button link (primary)', type: 'text' },
  { key: 'buttonText2', label: 'Button text (secondary, optional)', type: 'text', helperText: 'e.g. "Remedial Store" — leave blank to show only the primary button.' },
  { key: 'buttonLink2', label: 'Button link (secondary)', type: 'text' },
  { key: 'order', label: 'Display order', type: 'number', defaultValue: 0, helperText: 'Add multiple banners for the same page to show them as an auto-rotating slideshow, in this order.' },
  { key: 'active', label: 'Active', type: 'boolean', defaultValue: true }
]

const bannerColumns: ColumnConfig[] = [
  { key: 'image', label: '', render: thumb },
  { key: 'page', label: 'Page' },
  { key: 'title', label: 'Title' },
  { key: 'order', label: 'Order' },
  { key: 'active', label: 'Active', render: item => <Chip size='small' label={item.active ? 'Yes' : 'No'} color={item.active ? 'success' : 'default'} /> }
]

// -- Shop Purposes ----------------------------------------------------------
const purposeFields: FieldConfig[] = [
  { key: 'label', label: 'Label', type: 'text', required: true },
  { key: 'image', label: 'Image', type: 'image', required: true, uploadType: 'shop-purpose' },
  { key: 'order', label: 'Display order', type: 'number', defaultValue: 0 }
]

const purposeColumns: ColumnConfig[] = [
  { key: 'image', label: '', render: thumb },
  { key: 'label', label: 'Label' },
  { key: 'order', label: 'Order' }
]

// -- Chadhava Listings --------------------------------------------------------
const chadhavaFields: FieldConfig[] = [
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'description', label: 'Offering description', type: 'textarea', optional: true, helperText: 'Optional — leave blank if this offering doesn\'t need one.' },
  { key: 'location', label: 'Temple location', type: 'text' },
  { key: 'image', label: 'Image', type: 'image', required: true, uploadType: 'chadhava' },
  { key: 'price', label: 'Sale price (₹)', type: 'number', required: true },
  {
    key: 'offerPrice',
    label: 'Offer price (₹)',
    type: 'number',
    optional: true,
    helperText: 'Leave blank for no discount. If set and lower than sale price, sale price is shown crossed out.'
  },
  { key: 'gstPercentage', label: 'GST %', type: 'number', optional: true, defaultValue: 0 },
  { key: 'gstInclusive', label: 'Price is inclusive of GST', type: 'boolean', defaultValue: true },
  {
    key: 'secondaryTabLabel',
    label: 'Detail page tab label (defaults to "Temple Details")',
    type: 'text',
    helperText: 'Renames the second tab on the detail page — e.g. "Significance" or "History".'
  },
  { key: 'significance', label: 'Significance / About (detail page)', type: 'textarea', helperText: 'Longer devotional/historical text shown under the tab above.' },
  { key: 'benefits', label: 'Benefits (detail page)', type: 'textarea', helperText: 'One benefit per line — shown as a bullet list on the detail page.' }
]

const priceCell = (item: Record<string, any>) =>
  item.offerPrice && item.offerPrice > 0 && item.offerPrice < item.price ? (
    <>
      <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: 6 }}>₹{item.price}</span>
      <strong>₹{item.offerPrice}</strong>
    </>
  ) : (
    `₹${item.price}`
  )

const chadhavaColumns: ColumnConfig[] = [
  { key: 'image', label: '', render: thumb },
  { key: 'title', label: 'Title' },
  { key: 'location', label: 'Location' },
  { key: 'price', label: 'Price', render: priceCell }
]

// -- E-Puja Listings ------------------------------------------------------
const epujaFields: FieldConfig[] = [
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'category', label: 'Category (e.g. Ganesha, Mahadev)', type: 'text', required: true },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'image', label: 'Image', type: 'image', required: true, uploadType: 'epuja' },
  { key: 'price', label: 'Base price (₹)', type: 'number', required: true },
  { key: 'templeName', label: 'Temple name (detail page)', type: 'text' },
  { key: 'templeLocation', label: 'Temple location (detail page)', type: 'text' },
  {
    key: 'secondaryTabLabel',
    label: 'Detail page tab label (defaults to "Temple Details")',
    type: 'text',
    helperText: 'Renames the second tab on the detail page.'
  },
  { key: 'significance', label: 'Significance / About this Puja (detail page)', type: 'textarea', helperText: 'Longer devotional/historical text shown on the detail page.' },
  { key: 'benefits', label: 'Benefits (detail page)', type: 'textarea', helperText: 'One benefit per line — shown as a bullet list on the detail page.' }
]

const epujaColumns: ColumnConfig[] = [
  { key: 'image', label: '', render: thumb },
  { key: 'title', label: 'Title' },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price', render: item => `₹${item.price}` }
]

// -- Products ---------------------------------------------------------------
const productFields: FieldConfig[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'category', label: 'Category (Bracelets, Rudraksha, Gemstones...)', type: 'text', required: true },
  { key: 'price', label: 'Sale price (₹)', type: 'number', required: true },
  {
    key: 'offerPrice',
    label: 'Offer price (₹)',
    type: 'number',
    optional: true,
    helperText: 'Leave blank for no discount. If set and lower than sale price, sale price is shown crossed out.'
  },
  { key: 'gstPercentage', label: 'GST %', type: 'number', optional: true, defaultValue: 0 },
  { key: 'gstInclusive', label: 'Price is inclusive of GST', type: 'boolean', defaultValue: true },
  { key: 'image', label: 'Image', type: 'image', required: true, uploadType: 'product' },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'isBestSeller', label: 'Show in Best Sellers', type: 'boolean', defaultValue: false },
  { key: 'planet', label: 'Planet (Shop by Planet)', type: 'text' },
  { key: 'purpose', label: 'Purpose (must match a Shop Purpose label)', type: 'text' },
  { key: 'rating', label: 'Rating (0-5)', type: 'number', defaultValue: 5 },
  { key: 'reviewsCount', label: 'Reviews count', type: 'number', defaultValue: 0 },
  { key: 'sourceName', label: 'Source / Certification name (detail page)', type: 'text', helperText: 'e.g. "Gemological Institute Certified"' },
  { key: 'sourceLocation', label: 'Source location (detail page)', type: 'text', helperText: 'e.g. "Sourced from Nepal Himalayas"' },
  {
    key: 'secondaryTabLabel',
    label: 'Detail page tab label (defaults to "Source & Certification")',
    type: 'text',
    helperText: 'Renames the second tab on the detail page.'
  },
  { key: 'significance', label: 'Certification / Origin details (detail page)', type: 'textarea' },
  { key: 'benefits', label: 'Benefits (detail page)', type: 'textarea', helperText: 'One benefit per line — shown as a bullet list on the detail page.' }
]

const productColumns: ColumnConfig[] = [
  { key: 'image', label: '', render: thumb },
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price', render: priceCell },
  {
    key: 'isBestSeller',
    label: 'Best Seller',
    render: item => <Chip size='small' label={item.isBestSeller ? 'Yes' : 'No'} color={item.isBestSeller ? 'success' : 'default'} />
  }
]

// -- Astrologers --------------------------------------------------------------
const astrologerFields: FieldConfig[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'bio', label: 'Bio', type: 'textarea', required: true },
  { key: 'image', label: 'Image', type: 'image', required: true, uploadType: 'astrologer' },
  { key: 'rating', label: 'Rating (0-5)', type: 'number', defaultValue: 5 },
  { key: 'specialties', label: 'Specialties (comma separated)', type: 'text', required: true },
  { key: 'price30', label: '30-Minute Price (₹)', type: 'number', required: true },
  {
    key: 'offerPrice30',
    label: '30-Minute Offer Price (₹)',
    type: 'number',
    optional: true,
    helperText: 'Leave blank for no discount. If set and lower, the 30-min price is shown crossed out.'
  },
  { key: 'price60', label: '60-Minute Price (₹)', type: 'number', required: true },
  {
    key: 'offerPrice60',
    label: '60-Minute Offer Price (₹)',
    type: 'number',
    optional: true,
    helperText: 'Leave blank for no discount. If set and lower, the 60-min price is shown crossed out.'
  },
  { key: 'gstPercentage', label: 'GST %', type: 'number', optional: true, defaultValue: 0 },
  { key: 'gstInclusive', label: 'Price is inclusive of GST', type: 'boolean', defaultValue: true }
]

const astrologerColumns: ColumnConfig[] = [
  { key: 'image', label: '', render: thumb },
  { key: 'name', label: 'Name' },
  { key: 'rating', label: 'Rating' },
  { key: 'specialties', label: 'Specialties' },
  {
    key: 'price30',
    label: '30 Min',
    render: item =>
      item.offerPrice30 && item.offerPrice30 > 0 && item.offerPrice30 < item.price30 ? (
        <>
          <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: 6 }}>₹{item.price30}</span>
          <strong>₹{item.offerPrice30}</strong>
        </>
      ) : (
        `₹${item.price30}`
      )
  },
  {
    key: 'price60',
    label: '60 Min',
    render: item =>
      item.offerPrice60 && item.offerPrice60 > 0 && item.offerPrice60 < item.price60 ? (
        <>
          <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: 6 }}>₹{item.price60}</span>
          <strong>₹{item.offerPrice60}</strong>
        </>
      ) : (
        `₹${item.price60}`
      )
  }
]

// -- Categories ---------------------------------------------------------------
// Admin-curated category catalog per module — replaces free-text category entry on E-Puja
// listings and Products. Each module keeps its own independent list (see Category model).
const CATEGORY_MODULE_OPTIONS = [
  { value: 'epuja', label: 'E-Puja' },
  { value: 'ecommerce', label: 'Products' }
]

const categoryFields: FieldConfig[] = [
  { key: 'module', label: 'Applies to', type: 'select', required: true, options: CATEGORY_MODULE_OPTIONS },
  { key: 'name', label: 'Category name', type: 'text', required: true },
  { key: 'order', label: 'Display order', type: 'number', defaultValue: 0 },
  { key: 'active', label: 'Active', type: 'boolean', defaultValue: true }
]

const categoryColumns: ColumnConfig[] = [
  { key: 'module', label: 'Applies to', render: item => CATEGORY_MODULE_OPTIONS.find(o => o.value === item.module)?.label || item.module },
  { key: 'name', label: 'Name' },
  { key: 'order', label: 'Order' },
  { key: 'active', label: 'Active', render: item => <Chip size='small' label={item.active ? 'Yes' : 'No'} color={item.active ? 'success' : 'default'} /> }
]

// -- Jyotish Time Slots -------------------------------------------------------
// Bookable slots shown on the consultation form's slot picker (e.g. "9:00 AM - 10:00 AM").
// Not exclusive — multiple customers can book the same slot, since astrologer availability
// across slots is coordinated manually by admins rather than enforced here.
const timeSlotFields: FieldConfig[] = [
  { key: 'label', label: 'Slot label (shown to customers)', type: 'text', required: true, helperText: 'e.g. "9:00 AM - 10:00 AM"' },
  { key: 'startTime', label: 'Start time (24-hour HH:mm)', type: 'text', required: true, helperText: 'e.g. 09:00' },
  { key: 'order', label: 'Display order', type: 'number', defaultValue: 0 },
  { key: 'active', label: 'Active', type: 'boolean', defaultValue: true }
]

const timeSlotColumns: ColumnConfig[] = [
  { key: 'label', label: 'Label' },
  { key: 'startTime', label: 'Start Time' },
  { key: 'order', label: 'Order' },
  { key: 'active', label: 'Active', render: item => <Chip size='small' label={item.active ? 'Yes' : 'No'} color={item.active ? 'success' : 'default'} /> }
]

// -- Kundli Listings ----------------------------------------------------------
const kundliFields: FieldConfig[] = [
  { key: 'title', label: 'Title (e.g. Premium Janam Kundli)', type: 'text', required: true },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'delivery', label: 'Delivery format (e.g. Physical Hardcopy + PDF Scans)', type: 'text', required: true },
  { key: 'image', label: 'Image', type: 'image', required: true, uploadType: 'kundli' },
  { key: 'price', label: 'Sale price (₹)', type: 'number', required: true },
  {
    key: 'offerPrice',
    label: 'Offer price (₹)',
    type: 'number',
    optional: true,
    helperText: 'Leave blank for no discount. If set and lower than sale price, sale price is shown crossed out.'
  },
  { key: 'gstPercentage', label: 'GST %', type: 'number', optional: true, defaultValue: 0 },
  { key: 'gstInclusive', label: 'Price is inclusive of GST', type: 'boolean', defaultValue: true }
]

const kundliColumns: ColumnConfig[] = [
  { key: 'image', label: '', render: thumb },
  { key: 'title', label: 'Title' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'price', label: 'Price', render: priceCell }
]

// -- Darshan Temples ------------------------------------------------------
const darshanFields: FieldConfig[] = [
  { key: 'name', label: 'Temple name', type: 'text', required: true },
  { key: 'location', label: 'Location', type: 'text', helperText: 'e.g. "Ayodhya, UP" — shown as a badge on the Darshan page.' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'image', label: 'Banner image', type: 'image', required: true, uploadType: 'darshan' },
  { key: 'qrCodeUrl', label: 'QR code image', type: 'image', required: true, uploadType: 'qr' },
  {
    key: 'model3dUrl',
    label: '3D Darshan experience URL',
    type: 'text',
    required: true,
    helperText: 'A full link (e.g. https://...) to the 3D/AR experience — opened in a new tab when a visitor clicks "View 3D Experience" and encoded into the QR code for mobile scanning.'
  }
]

const darshanColumns: ColumnConfig[] = [
  { key: 'image', label: '', render: thumb },
  { key: 'name', label: 'Name' },
  { key: 'model3dUrl', label: '3D URL' }
]

// -- FAQs -------------------------------------------------------------------
const faqFields: FieldConfig[] = [
  { key: 'page', label: 'Page', type: 'select', required: true, options: PAGE_OPTIONS },
  { key: 'question', label: 'Question', type: 'text', required: true },
  { key: 'answer', label: 'Answer', type: 'textarea', required: true },
  { key: 'order', label: 'Display order', type: 'number', defaultValue: 0 },
  { key: 'active', label: 'Active', type: 'boolean', defaultValue: true }
]

const faqColumns: ColumnConfig[] = [
  { key: 'page', label: 'Page' },
  { key: 'question', label: 'Question' },
  { key: 'order', label: 'Order' },
  { key: 'active', label: 'Active', render: item => <Chip size='small' label={item.active ? 'Yes' : 'No'} color={item.active ? 'success' : 'default'} /> }
]

// -- How It Works Steps ------------------------------------------------------
// Each row is one step of a page's "How It Works" section. Admins add/remove steps by
// adding/deleting rows here — no separate list editor needed. See HowItWorksSection.tsx.
const howItWorksFields: FieldConfig[] = [
  { key: 'page', label: 'Page', type: 'select', required: true, options: PAGE_OPTIONS },
  { key: 'title', label: 'Step title (e.g. "Select")', type: 'text', required: true },
  { key: 'description', label: 'Step description', type: 'textarea', required: true },
  { key: 'order', label: 'Display order (1, 2, 3...)', type: 'number', defaultValue: 0 },
  { key: 'active', label: 'Active', type: 'boolean', defaultValue: true }
]

const howItWorksColumns: ColumnConfig[] = [
  { key: 'page', label: 'Page' },
  { key: 'order', label: 'Order' },
  { key: 'title', label: 'Step Title' },
  { key: 'description', label: 'Description', render: item => <span className='line-clamp-2 max-w-[320px] inline-block'>{item.description}</span> },
  { key: 'active', label: 'Active', render: item => <Chip size='small' label={item.active ? 'Yes' : 'No'} color={item.active ? 'success' : 'default'} /> }
]

// -- Reviews (moderation) ----------------------------------------------------
// Reviews aren't created here — customers submit them from a verified purchase. This tab is
// purely for moderation: an admin approves/rejects a pending review, or deletes an abusive one.
const reviewFields: FieldConfig[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { value: 'PENDING', label: 'Pending' },
      { value: 'APPROVED', label: 'Approved' },
      { value: 'REJECTED', label: 'Rejected' }
    ]
  }
]

const statusColor = (status: string) => (status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'error' : 'warning')

// -- Contact Messages ---------------------------------------------------------
// Submissions aren't created here — visitors submit them from the public Contact Us form. This
// tab is for triage: mark an inquiry `handled` once replied to, or delete spam.
const contactFields: FieldConfig[] = [
  { key: 'handled', label: 'Handled', type: 'boolean', defaultValue: false }
]

const contactColumns: ColumnConfig[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'message', label: 'Message', render: item => <span className='line-clamp-2 max-w-[320px] inline-block'>{item.message}</span> },
  { key: 'handled', label: 'Handled', render: item => <Chip size='small' label={item.handled ? 'Yes' : 'No'} color={item.handled ? 'success' : 'default'} /> },
  { key: 'createdAt', label: 'Received', render: item => new Date(item.createdAt).toLocaleString('en-IN') }
]

const reviewColumns: ColumnConfig[] = [
  { key: 'customerName', label: 'Customer' },
  { key: 'targetTitle', label: 'Item' },
  { key: 'orderType', label: 'Type' },
  { key: 'rating', label: 'Rating', render: item => '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating) },
  { key: 'comment', label: 'Comment', render: item => <span className='line-clamp-2 max-w-[280px] inline-block'>{item.comment || '—'}</span> },
  {
    key: 'media',
    label: 'Media',
    render: item =>
      Array.isArray(item.media) && item.media.length > 0 ? (
        <Chip size='small' label={`${item.media.length} file${item.media.length > 1 ? 's' : ''}`} />
      ) : (
        '—'
      )
  },
  { key: 'status', label: 'Status', render: item => <Chip size='small' label={item.status} color={statusColor(item.status) as any} /> }
]

const TABS = [
  { label: 'Banners', Component: () => <EntityManager title='Banner' listUrl='/api/banners?all=1' itemUrl={(id: string) => `/api/banners/${id}`} fields={bannerFields} columns={bannerColumns} /> },
  { label: 'Shop Purposes', Component: () => <EntityManager title='Shop Purpose' listUrl='/api/shop-purposes' itemUrl={(id: string) => `/api/shop-purposes/${id}`} fields={purposeFields} columns={purposeColumns} /> },
  {
    label: 'Chadhava Listings',
    Component: () => (
      <ImportableEntityManager
        title='Chadhava Listing'
        listUrl='/api/chadhava/listings'
        itemUrl={(id: string) => `/api/chadhava/listings/${id}`}
        fields={chadhavaFields}
        columns={chadhavaColumns}
        extraRowActions={(item, refresh) => (
          <MediaGalleryDialog item={item} titleKey='title' patchUrl={`/api/chadhava/listings/${item.id}`} uploadType='chadhava' onSaved={refresh} />
        )}
        sampleUrl='/api/chadhava/listings/import/sample'
        importUrl='/api/chadhava/listings/import'
      />
    )
  },
  {
    label: 'E-Puja Listings',
    Component: () => {
      const categoryOptions = useCategoryOptions('epuja')

      return (
        <ImportableEntityManager
          title='E-Puja Listing'
          listUrl='/api/epuja/listings'
          itemUrl={(id: string) => `/api/epuja/listings/${id}`}
          fields={withCategorySelect(epujaFields, categoryOptions)}
          columns={epujaColumns}
          emptyMessage='No E-Puja listings yet.'
          extraRowActions={(item, refresh) => (
            <>
              <PujaPackagesDialog listing={item} />
              <MediaGalleryDialog item={item} titleKey='title' patchUrl={`/api/epuja/listings/${item.id}`} uploadType='epuja' onSaved={refresh} />
            </>
          )}
          sampleUrl='/api/epuja/listings/import/sample'
          importUrl='/api/epuja/listings/import'
        />
      )
    }
  },
  {
    label: 'Products',
    Component: () => {
      const categoryOptions = useCategoryOptions('ecommerce')

      return (
        <ImportableEntityManager
          title='Product'
          listUrl='/api/ecommerce/products'
          itemUrl={(id: string) => `/api/ecommerce/products/${id}`}
          fields={withCategorySelect(productFields, categoryOptions)}
          columns={productColumns}
          extraRowActions={(item, refresh) => (
            <MediaGalleryDialog item={item} titleKey='name' patchUrl={`/api/ecommerce/products/${item.id}`} uploadType='product' onSaved={refresh} />
          )}
          sampleUrl='/api/ecommerce/products/import/sample'
          importUrl='/api/ecommerce/products/import'
        />
      )
    }
  },
  {
    label: 'Categories',
    Component: () => (
      <EntityManager
        title='Category'
        listUrl='/api/categories?all=1'
        itemUrl={(id: string) => `/api/categories/${id}`}
        fields={categoryFields}
        columns={categoryColumns}
        emptyMessage='No categories yet — add some here, then they appear as a dropdown on the E-Puja Listings / Products forms.'
      />
    )
  },
  { label: 'Kundli Listings', Component: () => <EntityManager title='Kundli Listing' listUrl='/api/kundli/listings' itemUrl={(id: string) => `/api/kundli/listings/${id}`} fields={kundliFields} columns={kundliColumns} /> },
  { label: 'Astrologers', Component: () => <EntityManager title='Astrologer' listUrl='/api/jyotish/astrologers' itemUrl={(id: string) => `/api/jyotish/astrologers/${id}`} fields={astrologerFields} columns={astrologerColumns} /> },
  {
    label: 'Jyotish Time Slots',
    Component: () => (
      <EntityManager
        title='Time Slot'
        listUrl='/api/jyotish/time-slots?all=1'
        itemUrl={(id: string) => `/api/jyotish/time-slots/${id}`}
        fields={timeSlotFields}
        columns={timeSlotColumns}
        emptyMessage='No time slots configured yet — add slots like "9:00 AM - 10:00 AM" for customers to pick from.'
      />
    )
  },
  { label: 'Darshan Temples', Component: () => <EntityManager title='Darshan Temple' listUrl='/api/darshan' itemUrl={(id: string) => `/api/darshan/${id}`} fields={darshanFields} columns={darshanColumns} /> },
  { label: 'FAQs', Component: () => <EntityManager title='FAQ' listUrl='/api/faqs?all=1' itemUrl={(id: string) => `/api/faqs/${id}`} fields={faqFields} columns={faqColumns} emptyMessage='No FAQs configured yet — pages fall back to their built-in defaults.' /> },
  {
    label: 'How It Works',
    Component: () => (
      <EntityManager
        title='How It Works Step'
        listUrl='/api/how-it-works?all=1'
        itemUrl={(id: string) => `/api/how-it-works/${id}`}
        fields={howItWorksFields}
        columns={howItWorksColumns}
        emptyMessage='No steps configured yet — pages fall back to the built-in default flow (Select, Add Details, Pay, Get Video).'
      />
    )
  },
  {
    label: 'Reviews',
    Component: () => (
      <EntityManager
        title='Review'
        listUrl='/api/reviews?all=1'
        itemUrl={(id: string) => `/api/reviews/${id}`}
        fields={reviewFields}
        columns={reviewColumns}
        emptyMessage='No customer reviews submitted yet.'
      />
    )
  },
  {
    label: 'Contact Messages',
    Component: () => (
      <EntityManager
        title='Contact Message'
        listUrl='/api/contact-submissions'
        itemUrl={(id: string) => `/api/contact-submissions/${id}`}
        fields={contactFields}
        columns={contactColumns}
        emptyMessage='No Contact Us submissions yet.'
      />
    )
  }
]

// Must stay 1:1 with the TABS array above (same order, same count) — a mismatch here silently
// sends admins to the wrong form (e.g. "Products" rendering the Categories tab), which is exactly
// what happened before this was aligned, so double check both arrays when adding/removing a tab.
const SLUG_TO_INDEX: Record<string, number> = {
  'banners': 0,
  'shop-purposes': 1,
  'chadhava-listings': 2,
  'epuja-listings': 3,
  'products': 4,
  'categories': 5,
  'kundli-listings': 6,
  'astrologers': 7,
  'jyotish-time-slots': 8,
  'darshan-temples': 9,
  'faqs': 10,
  'how-it-works': 11,
  'reviews': 12,
  'contact-messages': 13
}

const ContentManagementClient = ({ slug }: { slug: string }) => {
  const tabIndex = SLUG_TO_INDEX[slug] ?? 0
  const activeTabObj = TABS[tabIndex]
  const ActiveTab = activeTabObj.Component

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <Typography variant='h4' className='font-bold text-textPrimary'>
          Content Management — {activeTabObj.label}
        </Typography>
        <Typography variant='body2' className='text-textSecondary mt-1'>
          Manage homepage banners, shop-by-purpose tiles, listings, products, astrologers and temples shown across the site.
        </Typography>
      </div>

      <ActiveTab />
    </div>
  )
}

export default ContentManagementClient
