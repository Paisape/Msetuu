'use client'

import { useState } from 'react'

import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

type ImportResult = { created: number; totalRows: number; errors: { row: number; error: string }[] }

type Props = {
  title: string
  sampleUrl: string
  importUrl: string

  // Called after a successful upload (even one with partial row errors) so the caller can
  // refresh its listing table.
  onImported: () => void
}

// Shared "download sample Excel, fill it in, upload it back" panel used above the Chadhava,
// E-Puja and Products tables in Content Management. Each module supplies its own sample/import
// endpoints (see src/libs/bulkImportColumns.ts) — this component just handles the download
// link, the file picker, and rendering the row-by-row result summary.
const BulkImportPanel = ({ title, sampleUrl, importUrl, onImported }: Props) => {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    setErrorMsg(null)
    setResult(null)

    try {
      const formData = new FormData()

      formData.append('file', file)

      const res = await fetch(importUrl, { method: 'POST', body: formData })
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Import failed.')

      setResult(data)
      if (data.created > 0) onImported()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className='mb-4 p-4'>
      <Typography variant='subtitle1' className='font-bold mb-1'>
        Bulk Import {title}
      </Typography>
      <Typography variant='body2' className='text-textSecondary mb-3'>
        Download the sample Excel file, fill in your listings (one per row), then upload it here to add them all at once.
      </Typography>

      <Box className='flex items-center gap-3 flex-wrap'>
        <Button href={sampleUrl} variant='outlined' size='small' startIcon={<i className='tabler-download' />}>
          Download Sample Excel
        </Button>

        <Button component='label' variant='contained' size='small' disabled={uploading} startIcon={uploading ? <CircularProgress size={14} color='inherit' /> : <i className='tabler-upload' />}>
          {uploading ? 'Uploading...' : 'Upload Filled Excel'}
          <input
            type='file'
            accept='.xlsx,.xls'
            hidden
            onChange={e => {
              const file = e.target.files?.[0]

              if (file) handleUpload(file)
              e.target.value = ''
            }}
          />
        </Button>
      </Box>

      {errorMsg && (
        <Alert severity='error' className='mt-3' onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {result && (
        <Alert severity={result.errors.length > 0 ? 'warning' : 'success'} className='mt-3' onClose={() => setResult(null)}>
          <Typography variant='body2' className='font-semibold'>
            {result.created} of {result.totalRows} row{result.totalRows === 1 ? '' : 's'} imported successfully.
          </Typography>
          {result.errors.length > 0 && (
            <ul className='mt-1 pl-4' style={{ listStyle: 'disc' }}>
              {result.errors.map((e, idx) => (
                <li key={idx}>
                  <Typography variant='caption'>
                    Row {e.row}: {e.error}
                  </Typography>
                </li>
              ))}
            </ul>
          )}
        </Alert>
      )}
    </Card>
  )
}

export default BulkImportPanel
