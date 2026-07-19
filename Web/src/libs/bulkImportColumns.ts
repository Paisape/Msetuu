import type { ImportColumn } from '@/libs/bulkImport'

// Column definitions for each module's bulk-import sample template + upload parser. Kept in one
// place (not inside the route.ts files) since Next.js route handlers should only export HTTP
// method handlers/route config — sharing these from a plain lib module avoids any ambiguity.

export const CHADHAVA_IMPORT_COLUMNS: ImportColumn[] = [
  { key: 'title', label: 'Title', required: true, example: 'Kashi Vishwanath Rudrabhishek' },
  { key: 'description', label: 'Description', required: true, example: 'Rudrabhishek Shringar & Bhog Chadhava' },
  { key: 'location', label: 'Temple Location', example: 'Varanasi, Uttar Pradesh' },
  { key: 'image', label: 'Image URL', required: true, example: 'https://example.com/temple.jpg' },
  { key: 'price', label: 'Sale Price (INR)', required: true, example: 1101 },
  { key: 'offerPrice', label: 'Offer Price (INR, optional)', example: 999 },
  { key: 'gstPercentage', label: 'GST % (optional)', example: 0 },
  { key: 'gstInclusive', label: 'Price includes GST? (true/false)', example: true }
]

export const EPUJA_IMPORT_COLUMNS: ImportColumn[] = [
  { key: 'title', label: 'Title', required: true, example: 'Maha Mrityunjaya Homa' },
  { key: 'category', label: 'Category', required: true, example: 'Mahadev' },
  { key: 'description', label: 'Description', required: true, example: 'Vedic ritual for health, longevity and protection.' },
  { key: 'image', label: 'Image URL', required: true, example: 'https://example.com/puja.jpg' },
  { key: 'price', label: 'Base Price (INR)', required: true, example: 2100 },
  { key: 'templeName', label: 'Temple Name (optional)', example: 'Mahakaleshwar Jyotirlinga' },
  { key: 'templeLocation', label: 'Temple Location (optional)', example: 'Ujjain, Madhya Pradesh' },
  { key: 'significance', label: 'Significance / About (optional)', example: 'One of the twelve Jyotirlingas of Lord Shiva.' },
  { key: 'benefits', label: 'Benefits (optional, separate with ;)', example: 'Health and longevity;Removes negative energy;Peace of mind' },
  { key: 'packageSinglePrice', label: 'Single Package Price (optional)', example: 2100 },
  { key: 'packageCouplePrice', label: 'Couple Package Price (optional)', example: 3500 },
  { key: 'packageFamilyPrice', label: 'Family Package Price (optional)', example: 5100 }
]

export const PRODUCT_IMPORT_COLUMNS: ImportColumn[] = [
  { key: 'name', label: 'Name', required: true, example: 'Rudraksha Mala' },
  { key: 'category', label: 'Category', required: true, example: 'Rudraksha' },
  { key: 'description', label: 'Description', required: true, example: 'Genuine 5-mukhi Rudraksha mala, lab certified.' },
  { key: 'image', label: 'Image URL', required: true, example: 'https://example.com/product.jpg' },
  { key: 'price', label: 'Sale Price (INR)', required: true, example: 1400 },
  { key: 'offerPrice', label: 'Offer Price (INR, optional)', example: 999 },
  { key: 'gstPercentage', label: 'GST % (optional)', example: 3 },
  { key: 'gstInclusive', label: 'Price includes GST? (true/false)', example: true },
  { key: 'planet', label: 'Planet (optional)', example: 'Shani' },
  { key: 'purpose', label: 'Purpose (optional, must match a Shop Purpose label)', example: 'Wealth' },
  { key: 'isBestSeller', label: 'Show in Best Sellers? (true/false)', example: false }
]
