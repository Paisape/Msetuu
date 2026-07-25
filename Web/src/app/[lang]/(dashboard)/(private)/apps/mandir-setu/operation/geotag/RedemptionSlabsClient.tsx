'use client'

import { useState, useEffect } from 'react'

import EntityManager from '@/components/admin/EntityManager'
import type { FieldConfig, ColumnConfig } from '@/components/admin/EntityManager'

const thumb = (item: Record<string, any>) =>
  // eslint-disable-next-line @next/next/no-img-element
  item.product?.image ? <img src={item.product.image} alt='' className='w-12 h-12 object-cover rounded' /> : null

// Admin defines reward tiers ("100 points -> Product A", "2000 points -> Product B"). Each slab
// points at a real store Product, so the same catalog/inventory/images already used everywhere
// else is reused here rather than a separate reward-item system.
const RedemptionSlabsClient = () => {
  const [productOptions, setProductOptions] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    fetch('/api/ecommerce/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProductOptions(data.map((p: any) => ({ value: p.id, label: p.name })))
      })
      .catch(() => {})
  }, [])

  const fields: FieldConfig[] = [
    {
      key: 'pointsRequired',
      label: 'Points required',
      type: 'number',
      required: true,
      helperText: 'How many points a visitor must spend to redeem this reward.'
    },
    {
      key: 'productId',
      label: 'Reward product',
      type: 'select',
      required: true,
      options: productOptions,
      helperText: productOptions.length === 0 ? 'No products found — add products in Content Management first.' : undefined
    },
    { key: 'active', label: 'Active', type: 'boolean', defaultValue: true }
  ]

  const columns: ColumnConfig[] = [
    { key: 'image', label: '', render: thumb },
    { key: 'pointsRequired', label: 'Points' },
    { key: 'product', label: 'Product', render: item => item.product?.name ?? '—' },
    {
      key: 'active',
      label: 'Active',
      render: item => (item.active ? 'Yes' : 'No')
    }
  ]

  return (
    <EntityManager
      title='Redemption Slab'
      listUrl='/api/geotag/redemption-slabs'
      itemUrl={(id: string) => `/api/geotag/redemption-slabs/${id}`}
      fields={fields}
      columns={columns}
      emptyMessage='No reward tiers yet — add one, e.g. 100 points for Product A.'
    />
  )
}

export default RedemptionSlabsClient
