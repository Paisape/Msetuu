'use client'

import EntityManager from '@/components/admin/EntityManager'
import type { FieldConfig, ColumnConfig } from '@/components/admin/EntityManager'

const fields: FieldConfig[] = [
  { key: 'name', label: 'Temple name', type: 'text', required: true },
  { key: 'latitude', label: 'Latitude', type: 'number', required: true, helperText: 'Decimal degrees, e.g. 25.3176 for Kashi Vishwanath.' },
  { key: 'longitude', label: 'Longitude', type: 'number', required: true, helperText: 'Decimal degrees, e.g. 82.9739.' },
  {
    key: 'radiusMeters',
    label: 'Match radius (meters)',
    type: 'number',
    optional: true,
    defaultValue: 500,
    helperText: 'How close a visitor\'s GPS location must be to this point for the app to auto-suggest this temple\'s name. Defaults to 500m.'
  }
]

const columns: ColumnConfig[] = [
  { key: 'name', label: 'Name' },
  { key: 'latitude', label: 'Latitude', render: item => Number(item.latitude).toFixed(4) },
  { key: 'longitude', label: 'Longitude', render: item => Number(item.longitude).toFixed(4) },
  { key: 'radiusMeters', label: 'Radius (m)' }
]

// Coordinates of known temples used to auto-suggest a name on the visitor-facing Geotag page —
// this is the entirety of "the system detects which mandir you're at" (distance matching, not a
// live reverse-geocoding API). Add every temple you want auto-detected here.
const GeotagTemplesClient = () => (
  <EntityManager
    title='Known Temple'
    listUrl='/api/geotag/temples'
    itemUrl={(id: string) => `/api/geotag/temples/${id}`}
    fields={fields}
    columns={columns}
    emptyMessage='No temples added yet — visitors will need to type the temple name manually until you add some here.'
  />
)

export default GeotagTemplesClient
