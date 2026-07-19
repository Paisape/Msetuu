import { NextResponse } from 'next/server'

import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { buildSampleWorkbook } from '@/libs/bulkImport'
import { EPUJA_IMPORT_COLUMNS } from '@/libs/bulkImportColumns'

// GET /api/epuja/listings/import/sample — admin downloads a fillable Excel template with the
// exact columns the bulk-import endpoint below expects.
export async function GET() {
  try {
    await requireAdmin()

    const buffer = await buildSampleWorkbook('E-Puja Listings', EPUJA_IMPORT_COLUMNS)

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="epuja-listings-sample.xlsx"'
      }
    })
  } catch (err) {
    return handleApiError(err)
  }
}
