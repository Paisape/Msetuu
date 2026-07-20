'use client'

import EntityManager, { FieldConfig, ColumnConfig } from '@/components/admin/EntityManager'

const FIELDS: FieldConfig[] = [
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'subtitle', label: 'Description', type: 'textarea', required: true },
  { key: 'fileUrl', label: 'Mantra Audio File', type: 'audio', required: true },
  { key: 'duration', label: 'Duration', type: 'text', required: true, helperText: 'e.g. 4:57' },
  { key: 'deity', label: 'Deity', type: 'text', required: true, helperText: 'e.g. Lord Shiva, Goddess Gayatri' }
]

const COLUMNS: ColumnConfig[] = [
  { key: 'title', label: 'Title' },
  { key: 'deity', label: 'Deity' },
  { key: 'duration', label: 'Duration' },
  {
    key: 'fileUrl',
    label: 'Audio Playback',
    render: (item: any) => (
      <audio src={item.fileUrl} controls className='max-w-[220px]' style={{ height: '32px' }} />
    )
  }
]

const MantraManagementClient = () => {
  return (
    <EntityManager
      title='Mantra'
      listUrl='/api/mantra'
      itemUrl={(id) => `/api/mantra/${id}`}
      fields={FIELDS}
      columns={COLUMNS}
      emptyMessage='No mantras uploaded yet. Add the first one!'
    />
  )
}

export default MantraManagementClient
